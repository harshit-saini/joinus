import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../lib/auth";
import dbConnect from "../../../lib/mongoose";
import Invite from "../../../lib/models/invite";
import type { GuestRecipient, InviteAnalytics, InvitePayload, MediaAsset } from "../../../lib/invite-types";

const MAX_GALLERY_ITEMS = 8;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createToken(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(24).toString("base64url")}`;
}

function cleanMediaAsset(value: unknown, role: "card" | "gallery"): MediaAsset | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const asset = value as Partial<MediaAsset>;
  return {
    id: cleanString(asset.id) || `${role}_${Date.now()}`,
    name: cleanString(asset.name) || "Uploaded file",
    type: cleanString(asset.type),
    size: Number(asset.size) || 0,
    kind: asset.kind === "image" || asset.kind === "video" || asset.kind === "file" ? asset.kind : "file",
    role,
    dataUrl: cleanString(asset.dataUrl),
  };
}

function cleanGuests(value: unknown): GuestRecipient[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((guest) => {
      const draft = guest as Partial<GuestRecipient>;
      const name = cleanString(draft.name);
      if (!name) {
        return null;
      }

      const channel =
        draft.channel === "Email" || draft.channel === "SMS" || draft.channel === "WhatsApp"
          ? draft.channel
          : "WhatsApp";

      return {
        id: cleanString(draft.id) || `guest_${Date.now()}`,
        token: cleanString(draft.token) || createToken("guest"),
        name,
        contact: cleanString(draft.contact),
        channel,
        status:
          draft.status === "Sent" ||
          draft.status === "Opened" ||
          draft.status === "RSVP Yes" ||
          draft.status === "RSVP No"
            ? draft.status
            : "Ready",
        lastSentAt: cleanString(draft.lastSentAt),
        lastOpenedAt: cleanString(draft.lastOpenedAt),
        rsvp: draft.rsvp === "yes" || draft.rsvp === "no" || draft.rsvp === "maybe" ? draft.rsvp : undefined,
      } satisfies GuestRecipient;
    })
    .filter(Boolean) as GuestRecipient[];
}

function cleanInvitePayload(
  body: Partial<InvitePayload>,
  owner: { email: string; name: string }
): InvitePayload {
  const gallery = Array.isArray(body.gallery)
    ? body.gallery
        .slice(0, MAX_GALLERY_ITEMS)
        .map((asset) => cleanMediaAsset(asset, "gallery"))
        .filter(Boolean)
    : [];

  const eventType =
    body.eventType === "Birthday" ||
    body.eventType === "Anniversary" ||
    body.eventType === "Housewarming" ||
    body.eventType === "Baby Shower" ||
    body.eventType === "Graduation" ||
    body.eventType === "Custom"
      ? body.eventType
      : "Wedding";

  const cardMode =
    body.cardMode === "virtual" || body.cardMode === "uploaded" || body.cardMode === "both"
      ? body.cardMode
      : "both";

  const theme =
    body.theme === "garden" || body.theme === "royal" || body.theme === "midnight"
      ? body.theme
      : "signature";

  const guestList = cleanGuests(body.guestList);
  const analytics: InviteAnalytics = {
    openCount: 0,
    sentCount: guestList.filter((guest) => guest.status === "Sent").length,
    rsvpYes: 0,
    rsvpNo: 0,
  };

  return {
    publicToken: createToken("invite"),
    ownerEmail: owner.email,
    ownerName: owner.name,
    eventType,
    cardMode,
    theme,
    title: cleanString(body.title) || `${eventType} Invitation`,
    receiverName: cleanString(body.receiverName),
    hostName: cleanString(body.hostName),
    message: cleanString(body.message),
    date: cleanString(body.date),
    time: cleanString(body.time),
    venue: cleanString(body.venue),
    mapLink: cleanString(body.mapLink),
    bride: cleanString(body.bride),
    groom: cleanString(body.groom),
    honoreeName: cleanString(body.honoreeName),
    age: cleanString(body.age),
    dressCode: cleanString(body.dressCode),
    rsvpDate: cleanString(body.rsvpDate),
    rsvpContact: cleanString(body.rsvpContact),
    registryLink: cleanString(body.registryLink),
    giftNote: cleanString(body.giftNote),
    privacy: body.privacy === "public" ? "public" : "unlisted",
    cardAsset: cleanMediaAsset(body.cardAsset, "card"),
    gallery: gallery as MediaAsset[],
    guestList,
    analytics,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const ownerEmail = session?.user?.email;

    if (!ownerEmail) {
      return NextResponse.json({ error: "Google login is required." }, { status: 401 });
    }

    await dbConnect();
    const invites = await Invite.find({ ownerEmail }).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      invites: JSON.parse(JSON.stringify(invites)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ownerEmail = session?.user?.email;

    if (!ownerEmail) {
      return NextResponse.json({ error: "Google login is required to create invitations." }, { status: 401 });
    }

    const body = (await req.json()) as Partial<InvitePayload>;
    const invitePayload = cleanInvitePayload(body, {
      email: ownerEmail,
      name: session.user?.name || "",
    });

    await dbConnect();
    const invite = await Invite.create(invitePayload);

    return NextResponse.json({
      id: invite._id.toString(),
      publicToken: invite.publicToken,
      invite: invite.toObject(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
