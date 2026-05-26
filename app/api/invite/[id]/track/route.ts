import { NextResponse } from "next/server";

import dbConnect from "../../../../../lib/mongoose";
import Invite from "../../../../../lib/models/invite";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    await dbConnect();

    const invite = await Invite.findOne({ publicToken: id });
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    invite.analytics = invite.analytics || {
      openCount: 0,
      sentCount: 0,
      rsvpYes: 0,
      rsvpNo: 0,
    };

    const action = typeof body.action === "string" ? body.action : "open";
    const openedAt = new Date().toISOString();

    if (action === "open") {
      invite.analytics.openCount = (invite.analytics.openCount || 0) + 1;
      invite.analytics.lastOpenedAt = openedAt;
    }

    const guestToken = typeof body.guestToken === "string" ? body.guestToken : "";
    const guestId = typeof body.guestId === "string" ? body.guestId : "";

    if (guestToken || guestId) {
      const guest = (invite.guestList || []).find(
        (item) => item.token === guestToken || item.id === guestId
      );
      if (guest && action === "open" && guest.status !== "RSVP Yes" && guest.status !== "RSVP No") {
        guest.status = "Opened";
        guest.lastOpenedAt = openedAt;
      }
      if (guest && action === "rsvpYes") {
        guest.status = "RSVP Yes";
        guest.rsvp = "yes";
      }
      if (guest && action === "rsvpNo") {
        guest.status = "RSVP No";
        guest.rsvp = "no";
      }
    }

    invite.analytics.rsvpYes = (invite.guestList || []).filter((guest) => guest.status === "RSVP Yes").length;
    invite.analytics.rsvpNo = (invite.guestList || []).filter((guest) => guest.status === "RSVP No").length;

    await invite.save();

    return NextResponse.json({ ok: true, analytics: invite.analytics });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
