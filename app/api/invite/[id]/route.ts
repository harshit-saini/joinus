import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import dbConnect from "../../../../lib/mongoose";
import Invite from "../../../../lib/models/invite";
import type { DeliveryStatus } from "../../../../lib/invite-types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getDeliveryStatus(value: unknown): DeliveryStatus | null {
  if (
    value === "Ready" ||
    value === "Sent" ||
    value === "Opened" ||
    value === "RSVP Yes" ||
    value === "RSVP No"
  ) {
    return value;
  }

  return null;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const ownerEmail = session?.user?.email;

    if (!ownerEmail) {
      return NextResponse.json({ error: "Google login is required." }, { status: 401 });
    }

    const { id } = await context.params;
    await dbConnect();

    const invite = await Invite.findOne({ _id: id, ownerEmail }).lean();
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    invite.analytics = invite.analytics || {
      openCount: 0,
      sentCount: 0,
      rsvpYes: 0,
      rsvpNo: 0,
    };

    return NextResponse.json({ invite });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const ownerEmail = session?.user?.email;

    if (!ownerEmail) {
      return NextResponse.json({ error: "Google login is required." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    await dbConnect();

    const invite = await Invite.findOne({ _id: id, ownerEmail });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    invite.analytics = invite.analytics || {
      openCount: 0,
      sentCount: 0,
      rsvpYes: 0,
      rsvpNo: 0,
    };

    const status = getDeliveryStatus(body.status);
    if (typeof body.guestId === "string" && status) {
      const guest = (invite.guestList || []).find((item) => item.id === body.guestId);
      if (guest) {
        guest.status = status;
        if (status === "Sent") {
          guest.lastSentAt = new Date().toISOString();
        }
      }
    }

    invite.analytics.sentCount = (invite.guestList || []).filter((guest) => guest.status === "Sent").length;
    await invite.save();

    return NextResponse.json({ invite: invite.toObject() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
