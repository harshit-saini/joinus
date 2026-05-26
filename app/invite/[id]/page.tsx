import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InviteDisplay from "./InviteDisplay";
import dbConnect from "../../../lib/mongoose";
import Invite from "../../../lib/models/invite";
import type { InvitePayload } from "../../../lib/invite-types";

type InvitePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ guest?: string }>;
};

async function getInvite(id: string): Promise<InvitePayload | null> {
  try {
    await dbConnect();
    const invite = await Invite.findOne({ publicToken: id }).lean();
    if (!invite) {
      return null;
    }

    return JSON.parse(JSON.stringify(invite)) as InvitePayload;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { id } = await params;
  const invite = await getInvite(id);

  if (!invite) {
    return {
      title: "Invitation",
    };
  }
}

  return {
    title: invite.title || `${invite.eventType} Invitation`,
    description: invite.message || "You are invited.",
  };
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const guestToken = typeof query.guest === "string" ? query.guest : "";
  const invite = await getInvite(id);

  if (!invite && id.startsWith("local_")) {
    return <InviteDisplay invite={null} localInviteId={id} guestToken={guestToken} />;
  }

  if (!invite) {
    notFound();
  }

  return <InviteDisplay invite={invite} guestToken={guestToken} />;
}
