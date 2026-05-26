"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { GuestRecipient, InvitePayload, InviteTheme, MediaAsset } from "../../../lib/invite-types";
import {
  buildShareMessage,
  formatInviteDate,
  formatInviteTime,
  getEmbedMapUrl,
} from "../../../lib/invite-utils";

type InviteDisplayProps = {
  invite: InvitePayload | null;
  localInviteId?: string;
  guestToken?: string;
};

function getTheme(theme: InviteTheme) {
  switch (theme) {
    case "garden":
      return {
        page: "bg-[#f8f1e4]",
        frame: "border-[#8f6d3f] bg-[#fffaf2]",
        accent: "text-[#8f6d3f]",
        button: "bg-[#8f6d3f] hover:bg-[#725333]",
        band: "bg-[#efe0c4]",
      };
    case "royal":
      return {
        page: "bg-[#fbefd8]",
        frame: "border-[#b98528] bg-[#fff8e8]",
        accent: "text-[#8f3325]",
        button: "bg-[#8f3325] hover:bg-[#70291f]",
        band: "bg-[#f4d38a]",
      };
    case "midnight":
      return {
        page: "bg-[#eef2f8]",
        frame: "border-[#27324a] bg-[#f9fbff]",
        accent: "text-[#27324a]",
        button: "bg-[#27324a] hover:bg-[#1d2538]",
        band: "bg-[#dae4f3]",
      };
    default:
      return {
        page: "bg-[#f7f3ec]",
        frame: "border-teal-800 bg-[#fffaf2]",
        accent: "text-teal-800",
        button: "bg-teal-800 hover:bg-teal-900",
        band: "bg-teal-50",
      };
  }
}

function getDisplayNames(invite: InvitePayload) {
  if (invite.eventType === "Wedding" && (invite.bride || invite.groom)) {
    return [invite.bride, invite.groom].filter(Boolean).join(" & ");
  }

  if (invite.honoreeName) {
    return invite.age ? `${invite.honoreeName} turns ${invite.age}` : invite.honoreeName;
  }

  return invite.title;
}

function findGuest(invite: InvitePayload, guestToken?: string): GuestRecipient | undefined {
  if (!guestToken) {
    return undefined;
  }

  return invite.guestList.find((guest) => guest.token === guestToken || guest.id === guestToken);
}

function normalizeInvite(invite: InvitePayload): InvitePayload {
  const draft = invite as Partial<InvitePayload>;
  const eventType = draft.eventType || "Custom";

  return {
    eventType,
    cardMode: draft.cardMode || (draft.cardAsset ? "uploaded" : "virtual"),
    theme: draft.theme || "signature",
    title: draft.title || `${eventType} Invitation`,
    receiverName: draft.receiverName || "",
    hostName: draft.hostName || "",
    message: draft.message || "",
    date: draft.date || "",
    time: draft.time || "",
    venue: draft.venue || "",
    mapLink: draft.mapLink || "",
    bride: draft.bride || "",
    groom: draft.groom || "",
    honoreeName: draft.honoreeName || "",
    age: draft.age || "",
    dressCode: draft.dressCode || "",
    rsvpDate: draft.rsvpDate || "",
    rsvpContact: draft.rsvpContact || "",
    registryLink: draft.registryLink || "",
    giftNote: draft.giftNote || "",
    privacy: draft.privacy || "unlisted",
    cardAsset: draft.cardAsset || null,
    gallery: Array.isArray(draft.gallery) ? draft.gallery : [],
    guestList: Array.isArray(draft.guestList)
      ? draft.guestList.map((guest) => ({
          ...guest,
          token: guest.token || guest.id,
        }))
      : [],
    analytics: {
      openCount: draft.analytics?.openCount || 0,
      sentCount: draft.analytics?.sentCount || 0,
      rsvpYes: draft.analytics?.rsvpYes || 0,
      rsvpNo: draft.analytics?.rsvpNo || 0,
      lastOpenedAt: draft.analytics?.lastOpenedAt || "",
    },
    _id: draft._id,
    publicToken: draft.publicToken,
    ownerEmail: draft.ownerEmail,
    ownerName: draft.ownerName,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

function readLocalInvite(id: string): InvitePayload | null {
  try {
    const raw = localStorage.getItem(`joinus:invite:${id}`);
    return raw ? normalizeInvite(JSON.parse(raw) as InvitePayload) : null;
  } catch {
    return null;
  }
}

function updateLocalRsvp(invite: InvitePayload, guestToken: string, status: GuestRecipient["status"]) {
  if (!invite._id) {
    return;
  }

  try {
    const savedInvites = JSON.parse(localStorage.getItem("joinus:invites") || "[]");
    const updatedInvites = savedInvites.map((savedInvite: { id: string; payload: InvitePayload }) => {
      if (savedInvite.id !== invite._id) {
        return savedInvite;
      }

      return {
        ...savedInvite,
        payload: {
          ...savedInvite.payload,
          guestList: (savedInvite.payload.guestList || []).map((guest) =>
            guest.token === guestToken || guest.id === guestToken
              ? {
                  ...guest,
                  status,
                  rsvp: status === "RSVP Yes" ? "yes" : "no",
                }
              : guest
          ),
        },
      };
    });

    localStorage.setItem("joinus:invites", JSON.stringify(updatedInvites));
    localStorage.setItem(
      `joinus:invite:${invite._id}`,
      JSON.stringify({
        ...invite,
        guestList: invite.guestList.map((guest) =>
          guest.token === guestToken || guest.id === guestToken
            ? {
                ...guest,
                status,
                rsvp: status === "RSVP Yes" ? "yes" : "no",
              }
            : guest
        ),
      })
    );
  } catch {
    return;
  }
}

function buildCalendarUrl(invite: InvitePayload) {
  const start = invite.date ? invite.date.replace(/-/g, "") : "";
  const time = invite.time ? invite.time.replace(":", "") : "0900";
  const startDateTime = start ? `${start}T${time}00` : "";
  const endDateTime = start ? `${start}T${time}00` : "";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: invite.title,
    details: invite.message,
    location: invite.venue,
  });

  if (startDateTime && endDateTime) {
    params.set("dates", `${startDateTime}/${endDateTime}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function MediaView({ asset }: { asset: MediaAsset }) {
  if (asset.kind === "image" && asset.dataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={asset.dataUrl} alt={asset.name} className="h-full w-full object-cover" />;
  }

  if (asset.kind === "video" && asset.dataUrl) {
    return <video src={asset.dataUrl} className="h-full w-full object-cover" controls />;
  }

  return (
    <div className="flex h-full min-h-40 items-center justify-center p-4 text-center font-semibold text-stone-700">
      {asset.name}
    </div>
  );
}

export default function InviteDisplay({ invite, localInviteId, guestToken }: InviteDisplayProps) {
  const [resolvedInvite, setResolvedInvite] = useState<InvitePayload | null>(() =>
    invite ? normalizeInvite(invite) : null
  );
  const [isHydrated, setIsHydrated] = useState(Boolean(invite));
  const [rsvpState, setRsvpState] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (invite) {
      setResolvedInvite(normalizeInvite(invite));
      setIsHydrated(true);
      return;
    }

    if (localInviteId) {
      setResolvedInvite(readLocalInvite(localInviteId));
      setIsHydrated(true);
    }
  }, [invite, localInviteId]);

  const guest = useMemo(
    () => (resolvedInvite ? findGuest(resolvedInvite, guestToken) : undefined),
    [guestToken, resolvedInvite]
  );

  useEffect(() => {
    if (!resolvedInvite?.publicToken || resolvedInvite._id?.startsWith("local_")) {
      return;
    }

    const key = `joinus:tracked:${resolvedInvite.publicToken}:${guestToken || "anonymous"}`;
    if (sessionStorage.getItem(key)) {
      return;
    }

    sessionStorage.setItem(key, "1");
    fetch(`/api/invite/${resolvedInvite.publicToken}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestToken, action: "open" }),
    }).catch(() => undefined);
  }, [guestToken, resolvedInvite]);

  if (!resolvedInvite && !isHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-5 text-stone-900">
        <p className="rounded-lg border border-stone-300 bg-white px-5 py-4 font-semibold">Opening invitation...</p>
      </main>
    );
  }

  if (!resolvedInvite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-5 text-stone-900">
        <div className="rounded-lg border border-stone-300 bg-white p-6 text-center">
          <h1 className="text-2xl font-semibold">Invitation not found</h1>
          <Link href="/invite" className="mt-4 inline-flex rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
            Create an invite
          </Link>
        </div>
      </main>
    );
  }

  const theme = getTheme(resolvedInvite.theme);
  const titleNames = getDisplayNames(resolvedInvite);
  const greetingName = guest?.name || resolvedInvite.receiverName || "Guest";
  const inviteUrl = typeof window !== "undefined" ? window.location.href : "";
  const mapUrl = resolvedInvite.mapLink ? getEmbedMapUrl(resolvedInvite.mapLink) : "";
  const canShowVirtual = resolvedInvite.cardMode === "virtual" || resolvedInvite.cardMode === "both";
  const canShowUploaded =
    (resolvedInvite.cardMode === "uploaded" || resolvedInvite.cardMode === "both") && resolvedInvite.cardAsset;

  async function shareInvite() {
    if (!resolvedInvite) {
      return;
    }

    const message = buildShareMessage(resolvedInvite, inviteUrl);

    if (navigator.share) {
      await navigator.share({
        title: resolvedInvite.title,
        text: message,
        url: inviteUrl,
      });
      return;
    }

    if (!navigator.clipboard) {
      setStatusMessage(message);
      return;
    }

    await navigator.clipboard.writeText(message);
    setStatusMessage("Invite text copied.");
  }

  async function handleRsvp(status: GuestRecipient["status"]) {
    if (!resolvedInvite?._id || !resolvedInvite.publicToken || !guestToken || !guest) {
      setRsvpState(status);
      setStatusMessage("Use the personalized invite link sent to you to save this RSVP.");
      return;
    }

    setRsvpState(status);
    if (resolvedInvite._id.startsWith("local_")) {
      updateLocalRsvp(resolvedInvite, guestToken, status);
      setStatusMessage("RSVP saved locally.");
      return;
    }

    await fetch(`/api/invite/${resolvedInvite.publicToken}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestToken,
        action: status === "RSVP Yes" ? "rsvpYes" : "rsvpNo",
      }),
    }).catch(() => undefined);
    setStatusMessage("RSVP sent.");
  }

  return (
    <main className={`min-h-screen ${theme.page} text-stone-950`}>
      <section className="border-b border-stone-300 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>
              {resolvedInvite.eventType} invitation
            </p>
            <h1 className="mt-1 text-3xl font-semibold md:text-4xl">{titleNames}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shareInvite}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition ${theme.button}`}
            >
              Share
            </button>
            <a
              href={buildCalendarUrl(resolvedInvite)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-stone-400 bg-white px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-teal-700"
            >
              Add to calendar
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <section className={`rounded-lg border-2 p-5 shadow-sm md:p-8 ${theme.frame}`}>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col justify-center">
              <p className="text-sm uppercase tracking-wide text-stone-500">Dear {greetingName}</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{resolvedInvite.title}</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">{resolvedInvite.message}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-md p-4 ${theme.band}`}>
                  <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Date</p>
                  <p className="mt-1 text-lg font-semibold">{formatInviteDate(resolvedInvite.date)}</p>
                </div>
                <div className="rounded-md bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Time</p>
                  <p className="mt-1 text-lg font-semibold">{formatInviteTime(resolvedInvite.time)}</p>
                </div>
              </div>

              {resolvedInvite.venue && (
                <div className="mt-3 rounded-md bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Venue</p>
                  <p className="mt-1 text-lg font-semibold">{resolvedInvite.venue}</p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-stone-300 bg-white p-5">
              {canShowUploaded && resolvedInvite.cardAsset ? (
                <div className="overflow-hidden rounded-md border border-stone-200">
                  <MediaView asset={resolvedInvite.cardAsset} />
                </div>
              ) : (
                <div className="flex min-h-[360px] flex-col justify-center rounded-md border border-stone-200 p-6 text-center">
                  <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>
                    Together with loved ones
                  </p>
                  <p className="mt-6 text-5xl font-semibold leading-tight">{titleNames}</p>
                  <p className="mt-6 leading-7 text-stone-700">{resolvedInvite.message}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {canShowUploaded && canShowVirtual && (
          <section className="mt-6 rounded-lg border border-stone-300 bg-white p-5 md:p-8">
            <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>Virtual card</p>
            <h2 className="mt-3 text-3xl font-semibold">{titleNames}</h2>
            <p className="mt-4 max-w-3xl leading-7 text-stone-700">{resolvedInvite.message}</p>
          </section>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {resolvedInvite.hostName && (
            <div className="rounded-lg border border-stone-300 bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Host</p>
              <p className="mt-2 font-semibold">{resolvedInvite.hostName}</p>
            </div>
          )}
          {resolvedInvite.dressCode && (
            <div className="rounded-lg border border-stone-300 bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Dress code</p>
              <p className="mt-2 font-semibold">{resolvedInvite.dressCode}</p>
            </div>
          )}
          {resolvedInvite.rsvpDate && (
            <div className="rounded-lg border border-stone-300 bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">RSVP by</p>
              <p className="mt-2 font-semibold">{formatInviteDate(resolvedInvite.rsvpDate)}</p>
            </div>
          )}
          {resolvedInvite.rsvpContact && (
            <div className="rounded-lg border border-stone-300 bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">RSVP contact</p>
              <p className="mt-2 font-semibold">{resolvedInvite.rsvpContact}</p>
            </div>
          )}
        </section>

        {(resolvedInvite.registryLink || resolvedInvite.giftNote) && (
          <section className="mt-6 rounded-lg border border-stone-300 bg-white p-5">
            <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>Gifts</p>
            {resolvedInvite.giftNote && <p className="mt-3 leading-7 text-stone-700">{resolvedInvite.giftNote}</p>}
            {resolvedInvite.registryLink && (
              <a
                href={resolvedInvite.registryLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 inline-flex rounded-md px-4 py-2 text-sm font-semibold text-white ${theme.button}`}
              >
                Open gift link
              </a>
            )}
          </section>
        )}

        {resolvedInvite.gallery.length > 0 && (
          <section className="mt-6 rounded-lg border border-stone-300 bg-white p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>Moments</p>
                <h2 className="mt-1 text-2xl font-semibold">Photos and videos</h2>
              </div>
              <p className="text-sm text-stone-500">{resolvedInvite.gallery.length} items</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resolvedInvite.gallery.map((asset) => (
                <div key={asset.id} className="aspect-[4/3] overflow-hidden rounded-md border border-stone-200 bg-stone-50">
                  <MediaView asset={asset} />
                </div>
              ))}
            </div>
          </section>
        )}

        {mapUrl && (
          <section className="mt-6 overflow-hidden rounded-lg border border-stone-300 bg-white">
            <div className="flex flex-col gap-3 border-b border-stone-300 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>Location</p>
                <h2 className="mt-1 text-2xl font-semibold">{resolvedInvite.venue || "Event location"}</h2>
              </div>
              <a
                href={resolvedInvite.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-stone-400 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
              >
                Open map
              </a>
            </div>
            <iframe
              src={mapUrl}
              width="100%"
              height="380"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>
        )}

        <section className="mt-6 rounded-lg border border-stone-300 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wide ${theme.accent}`}>RSVP</p>
              <h2 className="mt-1 text-2xl font-semibold">Can you make it?</h2>
              {rsvpState && <p className="mt-2 text-sm font-semibold text-teal-800">{rsvpState}</p>}
              {statusMessage && <p className="mt-2 text-sm text-stone-600">{statusMessage}</p>}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => handleRsvp("RSVP Yes")}
                className={`rounded-md px-5 py-3 font-semibold text-white ${theme.button}`}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => handleRsvp("RSVP No")}
                className="rounded-md border border-stone-400 px-5 py-3 font-semibold text-stone-800 hover:border-coral-700"
              >
                Decline
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
