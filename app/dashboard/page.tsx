"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import type { DeliveryChannel, GuestRecipient, InviteEventType, InvitePayload } from "../../lib/invite-types";
import { buildGuestInviteUrl, buildShareMessage, formatInviteDate, formatInviteTime } from "../../lib/invite-utils";

type DashboardInvite = InvitePayload & {
  _id: string;
  publicToken: string;
};

type EventFilter = "All" | InviteEventType;

const emptyAnalytics = {
  openCount: 0,
  sentCount: 0,
  rsvpYes: 0,
  rsvpNo: 0,
};

function normalizeInvite(invite: InvitePayload): DashboardInvite {
  const id = invite._id || invite.publicToken || "";
  const guestList = Array.isArray(invite.guestList)
    ? invite.guestList.map((guest) => ({
        ...guest,
        token: guest.token || guest.id,
      }))
    : [];

  return {
    ...invite,
    _id: id,
    publicToken: invite.publicToken || id,
    title: invite.title || `${invite.eventType} Invitation`,
    date: invite.date || "",
    time: invite.time || "",
    venue: invite.venue || "",
    guestList,
    gallery: Array.isArray(invite.gallery) ? invite.gallery : [],
    analytics: {
      ...emptyAnalytics,
      ...(invite.analytics || {}),
    },
  };
}

function getInviteUrl(invite: DashboardInvite) {
  if (typeof window === "undefined") {
    return `/invite/${invite.publicToken}`;
  }

  return `${window.location.origin}/invite/${invite.publicToken}`;
}

function getStatusCounts(invite: DashboardInvite) {
  const sent = invite.guestList.filter((guest) => guest.status === "Sent").length;
  const opened = invite.guestList.filter((guest) => guest.status === "Opened").length;
  const yes = invite.guestList.filter((guest) => guest.status === "RSVP Yes").length;
  const no = invite.guestList.filter((guest) => guest.status === "RSVP No").length;

  return {
    total: invite.guestList.length,
    sent,
    opened,
    yes,
    no,
    pending: invite.guestList.filter((guest) => guest.status === "Ready").length,
  };
}

function openShare(channel: DeliveryChannel, invite: DashboardInvite, url: string, contact = "") {
  const message = buildShareMessage(invite, url);
  const encodedMessage = encodeURIComponent(message);
  const trimmedContact = contact.trim();

  if (channel === "WhatsApp") {
    const phone = trimmedContact.replace(/\D/g, "");
    window.open(`https://wa.me/${phone ? phone : ""}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
    return;
  }

  if (channel === "Email") {
    const subject = encodeURIComponent(invite.title || "You are invited");
    window.open(`mailto:${trimmedContact}?subject=${subject}&body=${encodedMessage}`, "_blank");
    return;
  }

  window.open(`sms:${trimmedContact}?&body=${encodedMessage}`, "_blank");
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [invites, setInvites] = useState<DashboardInvite[]>([]);
  const [selectedInviteId, setSelectedInviteId] = useState("");
  const [eventFilter, setEventFilter] = useState<EventFilter>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadInvites() {
    if (status !== "authenticated") {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/invite");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load invitations");
      }

      const nextInvites = (data.invites || []).map(normalizeInvite);
      setInvites(nextInvites);
      setSelectedInviteId((current) => current || nextInvites[0]?._id || "");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Unable to load invitations";
      setMessage(nextMessage);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const eventFilters = useMemo(() => {
    const values = new Set<InviteEventType>();
    invites.forEach((invite) => values.add(invite.eventType));
    return ["All", ...Array.from(values)] as EventFilter[];
  }, [invites]);

  const filteredInvites = useMemo(() => {
    if (eventFilter === "All") {
      return invites;
    }

    return invites.filter((invite) => invite.eventType === eventFilter);
  }, [eventFilter, invites]);

  const selectedInvite = useMemo(() => {
    return filteredInvites.find((invite) => invite._id === selectedInviteId) || filteredInvites[0] || null;
  }, [filteredInvites, selectedInviteId]);

  const overall = useMemo(() => {
    return invites.reduce(
      (total, invite) => {
        const counts = getStatusCounts(invite);
        return {
          events: total.events + 1,
          guests: total.guests + counts.total,
          sent: total.sent + counts.sent,
          opened: total.opened + (invite.analytics?.openCount || counts.opened),
          rsvpYes: total.rsvpYes + counts.yes,
          rsvpNo: total.rsvpNo + counts.no,
        };
      },
      { events: 0, guests: 0, sent: 0, opened: 0, rsvpYes: 0, rsvpNo: 0 }
    );
  }, [invites]);

  async function copyLink(url: string) {
    if (!navigator.clipboard) {
      setMessage(url);
      return;
    }

    await navigator.clipboard.writeText(url);
    setMessage("Invite link copied.");
  }

  async function markGuestSent(inviteId: string, guestId: string) {
    await fetch(`/api/invite/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, status: "Sent" }),
    }).catch(() => undefined);

    setInvites((current) =>
      current.map((invite) =>
        invite._id === inviteId
          ? {
              ...invite,
              guestList: invite.guestList.map((guest) =>
                guest.id === guestId
                  ? {
                      ...guest,
                      status: "Sent",
                      lastSentAt: new Date().toISOString(),
                    }
                  : guest
              ),
            }
          : invite
      )
    );
  }

  function shareWithGuest(invite: DashboardInvite, guest: GuestRecipient) {
    const guestUrl = buildGuestInviteUrl(getInviteUrl(invite), guest);
    openShare(guest.channel, invite, guestUrl, guest.contact);
    markGuestSent(invite._id, guest.id);
  }

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <section className="w-full max-w-xl rounded-lg border border-stone-300 bg-[#fffaf2] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Creator dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">Log in to see your sent invitations</h1>
          <p className="mt-4 leading-7 text-stone-700">
            Guests never need an account. Only creators use Google to manage events, delivery status,
            opens, and RSVP responses.
          </p>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="mt-6 rounded-md bg-stone-950 px-5 py-3 font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue with Google
          </button>
        </section>
      </main>
    );
  }

  const selectedCounts = selectedInvite ? getStatusCounts(selectedInvite) : null;
  const selectedUrl = selectedInvite ? getInviteUrl(selectedInvite) : "";

  return (
    <main className="min-h-screen">
      <header className="border-b border-stone-300 bg-[#fffaf2]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold uppercase tracking-wide text-teal-800">
              JoinUs
            </Link>
            <h1 className="mt-1 text-3xl font-semibold text-stone-950">My invitation dashboard</h1>
            <p className="mt-1 text-sm text-stone-600">Signed in as {session?.user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/invite"
              className="rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
            >
              Create invite
            </Link>
            <button
              type="button"
              onClick={loadInvites}
              className="rounded-md border border-stone-400 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-md border border-stone-400 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <section className="grid gap-3 md:grid-cols-5">
          {[
            ["Events", overall.events],
            ["Guests", overall.guests],
            ["Sent", overall.sent],
            ["Opens", overall.opened],
            ["RSVP yes", overall.rsvpYes],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-stone-300 bg-white p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-stone-300 bg-[#fffaf2] p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Events</p>
              <h2 className="mt-1 text-2xl font-semibold text-stone-950">Select a particular event</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {eventFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setEventFilter(filter);
                    setSelectedInviteId("");
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    eventFilter === filter
                      ? "bg-stone-950 text-white"
                      : "border border-stone-300 bg-white text-stone-700 hover:border-teal-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </section>

        {message && (
          <p className="mt-4 rounded-md border border-stone-300 bg-white p-3 text-sm text-stone-700">{message}</p>
        )}

        {isLoading ? (
          <p className="mt-8 rounded-lg border border-stone-300 bg-white p-6 font-semibold text-stone-700">
            Loading your invitations...
          </p>
        ) : invites.length === 0 ? (
          <section className="mt-8 rounded-lg border border-stone-300 bg-white p-8 text-center">
            <h2 className="text-2xl font-semibold text-stone-950">No invitations yet</h2>
            <p className="mt-3 text-stone-600">Create your first event and it will appear here.</p>
            <Link
              href="/invite"
              className="mt-5 inline-flex rounded-md bg-stone-950 px-5 py-3 font-semibold text-white hover:bg-teal-900"
            >
              Create invite
            </Link>
          </section>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
            <aside className="space-y-3">
              {filteredInvites.map((invite) => {
                const counts = getStatusCounts(invite);
                const isSelected = selectedInvite?._id === invite._id;

                return (
                  <button
                    key={invite._id}
                    type="button"
                    onClick={() => setSelectedInviteId(invite._id)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      isSelected
                        ? "border-teal-800 bg-teal-50"
                        : "border-stone-300 bg-white hover:border-teal-700"
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                      {invite.eventType}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-stone-950">{invite.title}</h3>
                    <p className="mt-2 text-sm text-stone-600">{formatInviteDate(invite.date)}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <span className="rounded-md bg-white px-2 py-2 font-semibold text-stone-700">
                        {counts.total} guests
                      </span>
                      <span className="rounded-md bg-white px-2 py-2 font-semibold text-teal-800">
                        {counts.sent} sent
                      </span>
                      <span className="rounded-md bg-white px-2 py-2 font-semibold text-coral-800">
                        {invite.analytics?.openCount || counts.opened} opens
                      </span>
                    </div>
                  </button>
                );
              })}
            </aside>

            {selectedInvite && selectedCounts && (
              <section className="rounded-lg border border-stone-300 bg-white shadow-sm">
                <div className="border-b border-stone-300 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                        {selectedInvite.eventType}
                      </p>
                      <h2 className="mt-1 text-3xl font-semibold text-stone-950">{selectedInvite.title}</h2>
                      <p className="mt-2 text-stone-600">
                        {formatInviteDate(selectedInvite.date)} at {formatInviteTime(selectedInvite.time)}
                      </p>
                      {selectedInvite.venue && <p className="mt-1 text-stone-600">{selectedInvite.venue}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyLink(selectedUrl)}
                        className="rounded-md border border-stone-400 px-3 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                      >
                        Copy link
                      </button>
                      <button
                        type="button"
                        onClick={() => openShare("WhatsApp", selectedInvite, selectedUrl)}
                        className="rounded-md border border-stone-400 px-3 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                      >
                        WhatsApp
                      </button>
                      <a
                        href={selectedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                      >
                        View invite
                      </a>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-5">
                    {[
                      ["Guests", selectedCounts.total],
                      ["Sent", selectedCounts.sent],
                      ["Opened", selectedInvite.analytics?.openCount || selectedCounts.opened],
                      ["Accepted", selectedCounts.yes],
                      ["Declined", selectedCounts.no],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-stone-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
                        <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-semibold text-stone-950">Guest activity</h3>
                  {selectedInvite.guestList.length === 0 ? (
                    <p className="mt-4 rounded-md bg-stone-50 p-4 text-sm text-stone-600">
                      This event does not have guests attached yet.
                    </p>
                  ) : (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-stone-300">
                      <div className="min-w-[760px]">
                        <div className="grid grid-cols-[1.1fr_1fr_120px_120px_120px] bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                          <span>Name</span>
                          <span>Contact</span>
                          <span>Status</span>
                          <span>Channel</span>
                          <span>Action</span>
                        </div>
                        {selectedInvite.guestList.map((guest) => (
                          <div
                            key={guest.id}
                            className="grid grid-cols-[1.1fr_1fr_120px_120px_120px] items-center gap-2 border-t border-stone-200 px-4 py-3 text-sm"
                          >
                            <span className="font-semibold text-stone-950">{guest.name}</span>
                            <span className="truncate text-stone-600">{guest.contact || "-"}</span>
                            <span className="rounded-md bg-stone-100 px-2 py-1 text-center text-xs font-semibold text-stone-700">
                              {guest.status}
                            </span>
                            <span className="text-stone-600">{guest.channel}</span>
                            <button
                              type="button"
                              onClick={() => shareWithGuest(selectedInvite, guest)}
                              className="rounded-md bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                            >
                              {guest.status === "Ready" ? "Send" : "Remind"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
