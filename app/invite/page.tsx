"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import type {
  CardMode,
  DeliveryChannel,
  GuestRecipient,
  InviteEventType,
  InvitePayload,
  InviteTheme,
  MediaAsset,
} from "../../lib/invite-types";
import {
  buildGuestInviteUrl,
  buildShareMessage,
  formatInviteDate,
  formatInviteTime,
  getEmbedMapUrl,
} from "../../lib/invite-utils";

type BuilderTab = "details" | "card" | "guests" | "review";

type SavedInvite = {
  id: string;
  publicToken: string;
  url: string;
  title: string;
  eventType: InviteEventType;
  date: string;
  createdAt: string;
  localOnly: boolean;
  payload: InvitePayload;
};

const savedInvitesKey = "joinus:invites";

const eventTypes: InviteEventType[] = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Housewarming",
  "Baby Shower",
  "Graduation",
  "Custom",
];

const cardModes: { value: CardMode; label: string; copy: string }[] = [
  { value: "virtual", label: "Virtual card", copy: "A designed online invite." },
  { value: "uploaded", label: "Uploaded card", copy: "Attach your printed card." },
  { value: "both", label: "Both", copy: "Show the card and a digital version." },
];

const themes: { value: InviteTheme; label: string; swatch: string }[] = [
  { value: "signature", label: "Signature", swatch: "bg-[#0f766e]" },
  { value: "garden", label: "Garden", swatch: "bg-[#8f6d3f]" },
  { value: "royal", label: "Royal", swatch: "bg-[#8f3325]" },
  { value: "midnight", label: "Midnight", swatch: "bg-[#27324a]" },
];

const channels: DeliveryChannel[] = ["WhatsApp", "Email", "SMS"];

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15";

const labelClass = "text-sm font-semibold text-stone-800";

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialInvite(): InvitePayload {
  return {
    eventType: "Wedding",
    cardMode: "both",
    theme: "signature",
    title: "A celebration to remember",
    receiverName: "Friends and family",
    hostName: "",
    message: "We would love for you to join us as we celebrate this special occasion.",
    date: "",
    time: "",
    venue: "",
    mapLink: "",
    bride: "",
    groom: "",
    honoreeName: "",
    age: "",
    dressCode: "",
    rsvpDate: "",
    rsvpContact: "",
    registryLink: "",
    giftNote: "",
    privacy: "unlisted",
    cardAsset: null,
    gallery: [],
    guestList: [],
    analytics: {
      openCount: 0,
      sentCount: 0,
      rsvpYes: 0,
      rsvpNo: 0,
    },
  };
}

function getMediaKind(file: File): MediaAsset["kind"] {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return "file";
}

function fileToAsset(file: File, role: MediaAsset["role"]): Promise<MediaAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: createId(role),
        name: file.name,
        type: file.type,
        size: file.size,
        kind: getMediaKind(file),
        role,
        dataUrl: String(reader.result || ""),
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeSavedInvite(invite: SavedInvite): SavedInvite {
  const fallback = createInitialInvite();
  const payload = {
    ...fallback,
    ...(invite.payload || {}),
    gallery: Array.isArray(invite.payload?.gallery) ? invite.payload.gallery : [],
    guestList: Array.isArray(invite.payload?.guestList)
      ? invite.payload.guestList.map((guest) => ({
          ...guest,
          token: guest.token || guest.id,
        }))
      : [],
    analytics: {
      ...fallback.analytics,
      ...(invite.payload?.analytics || {}),
    },
  };

  return {
    ...invite,
    id: invite.id || payload._id || createId("local_invite"),
    publicToken: invite.publicToken || payload.publicToken || invite.id || payload._id || "",
    url:
      invite.url ||
      (typeof window !== "undefined" && (invite.publicToken || payload.publicToken || invite.id || payload._id)
        ? `${window.location.origin}/invite/${invite.publicToken || payload.publicToken || invite.id || payload._id}`
        : ""),
    title: invite.title || payload.title,
    eventType: payload.eventType,
    date: invite.date || payload.date,
    createdAt: invite.createdAt || new Date().toISOString(),
    localOnly: Boolean(invite.localOnly),
    payload,
  };
}

function readSavedInvites(): SavedInvite[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return (JSON.parse(localStorage.getItem(savedInvitesKey) || "[]") as SavedInvite[]).map(normalizeSavedInvite);
  } catch {
    return [];
  }
}

function getThemeClasses(theme: InviteTheme) {
  switch (theme) {
    case "garden":
      return {
        frame: "border-[#8f6d3f] bg-[#fff8ed]",
        accent: "text-[#8f6d3f]",
        band: "bg-[#f2e3cf]",
      };
    case "royal":
      return {
        frame: "border-[#b98528] bg-[#fff4df]",
        accent: "text-[#8f3325]",
        band: "bg-[#f6d99a]",
      };
    case "midnight":
      return {
        frame: "border-[#27324a] bg-[#f3f6fb]",
        accent: "text-[#27324a]",
        band: "bg-[#dbe5f6]",
      };
    default:
      return {
        frame: "border-teal-800 bg-[#fffaf2]",
        accent: "text-teal-800",
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

export default function CreateInvitePage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState<InvitePayload>(() => createInitialInvite());
  const [activeTab, setActiveTab] = useState<BuilderTab>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [createdInvite, setCreatedInvite] = useState<SavedInvite | null>(null);
  const [savedInvites, setSavedInvites] = useState<SavedInvite[]>([]);
  const [guestDraft, setGuestDraft] = useState({
    name: "",
    contact: "",
    channel: "WhatsApp" as DeliveryChannel,
  });

  useEffect(() => {
    if (status === "authenticated") {
      setSavedInvites(readSavedInvites());
    }
  }, [status]);

  const guestStats = useMemo(() => {
    const sent = form.guestList.filter((guest) => guest.status === "Sent").length;
    const opened = form.guestList.filter((guest) => guest.status === "Opened").length;
    const rsvp = form.guestList.filter(
      (guest) => guest.status === "RSVP Yes" || guest.status === "RSVP No"
    ).length;

    return {
      total: form.guestList.length,
      sent,
      opened,
      rsvp,
    };
  }, [form.guestList]);

  const previewNames = getDisplayNames(form);
  const themeClasses = getThemeClasses(form.theme);
  const mapPreviewUrl = form.mapLink ? getEmbedMapUrl(form.mapLink) : "";

  function updateForm<K extends keyof InvitePayload>(key: K, value: InvitePayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatusMessage("");
  }

  function persistSavedInvites(nextInvites: SavedInvite[]) {
    setSavedInvites(nextInvites);
    try {
      localStorage.setItem(savedInvitesKey, JSON.stringify(nextInvites));
      nextInvites.forEach((invite) => {
        localStorage.setItem(`joinus:invite:${invite.id}`, JSON.stringify(invite.payload));
      });
    } catch {
      setStatusMessage("The invite was created, but local storage is full for large uploads.");
    }
  }

  function rememberInvite(invite: SavedInvite) {
    const nextInvites = [
      invite,
      ...savedInvites.filter((savedInvite) => savedInvite.id !== invite.id),
    ].slice(0, 20);
    persistSavedInvites(nextInvites);
  }

  async function handleCardUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const asset = await fileToAsset(file, "card");
    updateForm("cardAsset", asset);
    event.target.value = "";
  }

  async function handleGalleryUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, 8);
    if (files.length === 0) {
      return;
    }

    const assets = await Promise.all(files.map((file) => fileToAsset(file, "gallery")));
    updateForm("gallery", [...form.gallery, ...assets].slice(0, 8));
    event.target.value = "";
  }

  function removeGalleryAsset(assetId: string) {
    updateForm(
      "gallery",
      form.gallery.filter((asset) => asset.id !== assetId)
    );
  }

  function addGuest() {
    if (!guestDraft.name.trim()) {
      return;
    }

    const guest: GuestRecipient = {
      id: createId("guest"),
      token: createId("guest_token"),
      name: guestDraft.name.trim(),
      contact: guestDraft.contact.trim(),
      channel: guestDraft.channel,
      status: "Ready",
    };

    updateForm("guestList", [...form.guestList, guest]);
    setGuestDraft({ name: "", contact: "", channel: guestDraft.channel });
  }

  function removeGuest(guestId: string) {
    updateForm(
      "guestList",
      form.guestList.filter((guest) => guest.id !== guestId)
    );
  }

  function updateLocalGuestStatus(inviteId: string, guestId: string, status: GuestRecipient["status"]) {
    const updatedInvites = readSavedInvites().map((invite) => {
      if (invite.id !== inviteId) {
        return invite;
      }

      const nextGuestList = invite.payload.guestList.map((guest) =>
        guest.id === guestId
          ? {
              ...guest,
              status,
              lastSentAt: status === "Sent" ? new Date().toISOString() : guest.lastSentAt,
            }
          : guest
      );

      return {
        ...invite,
        payload: {
          ...invite.payload,
          guestList: nextGuestList,
          analytics: {
            ...(invite.payload.analytics || {
              openCount: 0,
              sentCount: 0,
              rsvpYes: 0,
              rsvpNo: 0,
            }),
            sentCount: nextGuestList.filter((guest) => guest.status === "Sent").length,
          },
        },
      };
    });

    persistSavedInvites(updatedInvites);
    if (createdInvite?.id === inviteId) {
      const refreshedInvite = updatedInvites.find((invite) => invite.id === inviteId) || null;
      setCreatedInvite(refreshedInvite);
    }

    if (!inviteId.startsWith("local_")) {
      fetch(`/api/invite/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, status }),
      }).catch(() => undefined);
    }
  }

  async function refreshInviteStats(inviteId: string) {
    if (inviteId.startsWith("local_")) {
      setStatusMessage("Local invites can be shared and previewed on this browser.");
      return;
    }

    try {
      const response = await fetch(`/api/invite/${inviteId}`);
      const data = await response.json();
      if (!response.ok || !data.invite) {
        throw new Error(data.error || "Could not refresh invite");
      }

      const updatedInvites = readSavedInvites().map((invite) =>
        invite.id === inviteId
          ? {
              ...invite,
              payload: {
                ...invite.payload,
                ...data.invite,
                _id: invite.id,
              },
            }
          : invite
      );
      persistSavedInvites(updatedInvites);
      setStatusMessage("Tracking refreshed.");
    } catch {
      setStatusMessage("Tracking refresh is unavailable right now.");
    }
  }

  function copyInviteLink(url: string) {
    if (!navigator.clipboard) {
      setStatusMessage(url);
      return;
    }

    navigator.clipboard.writeText(url).then(
      () => setStatusMessage("Invite link copied."),
      () => setStatusMessage(url)
    );
  }

  function openShare(channel: DeliveryChannel, invite: InvitePayload, url: string, contact = "") {
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

  function shareWithGuest(invite: SavedInvite, guest: GuestRecipient) {
    const guestUrl = buildGuestInviteUrl(invite.url, guest);
    openShare(guest.channel, invite.payload, guestUrl, guest.contact);
    updateLocalGuestStatus(invite.id, guest.id, "Sent");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status !== "authenticated") {
      setStatusMessage("Please continue with Google before creating invitations.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    const payload: InvitePayload = {
      ...form,
      ownerEmail: session?.user?.email || "",
      ownerName: session?.user?.name || "",
      analytics: {
        openCount: 0,
        sentCount: form.guestList.filter((guest) => guest.status === "Sent").length,
        rsvpYes: 0,
        rsvpNo: 0,
      },
    };

    let localOnly = false;
    let id = "";

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.id) {
        if (response.status === 401) {
          setIsSubmitting(false);
          setStatusMessage("Please continue with Google before creating invitations.");
          return;
        }
        throw new Error(data.error || "Unable to create invite");
      }

      id = data.id;
      payload.publicToken = data.publicToken || data.invite?.publicToken || data.id;
    } catch {
      localOnly = true;
      id = `local_${createId("invite")}`;
      payload.publicToken = id;
      setStatusMessage("MongoDB is unavailable, so this invite was saved locally in this browser.");
    }

    const publicToken = payload.publicToken || id;
    const url = `${window.location.origin}/invite/${publicToken}`;
    const createdAt = new Date().toISOString();
    const savedInvite: SavedInvite = {
      id,
      publicToken,
      url,
      title: payload.title,
      eventType: payload.eventType,
      date: payload.date,
      createdAt,
      localOnly,
      payload: {
        ...payload,
        _id: id,
        publicToken,
        createdAt,
      },
    };

    rememberInvite(savedInvite);
    setCreatedInvite(savedInvite);
    setActiveTab("review");
    setIsSubmitting(false);
  }

  function resetBuilder() {
    setForm(createInitialInvite());
    setCreatedInvite(null);
    setActiveTab("details");
    setStatusMessage("");
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-stone-300 bg-[#fffaf2]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold uppercase tracking-wide text-teal-800">
              JoinUs
            </Link>
            <h1 className="mt-1 text-3xl font-semibold text-stone-950">Create a personalized invitation</h1>
            {session?.user?.email && (
              <p className="mt-1 text-sm text-stone-600">Signed in as {session.user.email}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {status === "authenticated" && (
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-md border border-stone-400 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                >
                  Sign out
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md border border-stone-300 bg-white px-4 py-2">
              <p className="text-xl font-semibold text-stone-950">{guestStats.total}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">Guests</p>
            </div>
            <div className="rounded-md border border-stone-300 bg-white px-4 py-2">
              <p className="text-xl font-semibold text-teal-800">{guestStats.sent}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">Sent</p>
            </div>
            <div className="rounded-md border border-stone-300 bg-white px-4 py-2">
              <p className="text-xl font-semibold text-coral-700">{guestStats.opened}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">Opened</p>
            </div>
            </div>
          </div>
        </div>
      </header>

      {status !== "authenticated" ? (
        <section className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-lg border border-stone-300 bg-[#fffaf2] p-6 text-center shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Google account required</p>
            <h2 className="mt-3 text-3xl font-semibold text-stone-950">Log in or create your account</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-stone-700">
              Creators use Google to save and manage invitations. Guests can still open and respond to
              invitation links without logging in.
            </p>
            <button
              type="button"
              disabled={status === "loading"}
              onClick={() => signIn("google", { callbackUrl: "/invite" })}
              className="mt-6 rounded-md bg-stone-950 px-5 py-3 font-semibold text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue with Google
            </button>
            <p className="mt-4 text-sm text-stone-500">
              Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` before using this button.
            </p>
          </div>
        </section>
      ) : (
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
          <section className="rounded-lg border border-stone-300 bg-[#fffaf2] shadow-sm">
            <div className="border-b border-stone-300 p-4">
              <div className="grid grid-cols-4 gap-2">
                {(["details", "card", "guests", "review"] as BuilderTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
                      activeTab === tab
                        ? "bg-stone-950 text-white"
                        : "border border-stone-300 bg-white text-stone-700 hover:border-teal-700 hover:text-teal-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              {activeTab === "details" && (
                <div className="animate-rise-in space-y-6">
                  <div>
                    <label className={labelClass}>Event type</label>
                    <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                      {eventTypes.map((eventType) => (
                        <button
                          key={eventType}
                          type="button"
                          onClick={() => updateForm("eventType", eventType)}
                          className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                            form.eventType === eventType
                              ? "border-teal-800 bg-teal-800 text-white"
                              : "border-stone-300 bg-white text-stone-700 hover:border-teal-700"
                          }`}
                        >
                          {eventType}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="title">
                        Invite title
                      </label>
                      <input
                        id="title"
                        value={form.title}
                        onChange={(event) => updateForm("title", event.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="receiverName">
                        Greeting name
                      </label>
                      <input
                        id="receiverName"
                        value={form.receiverName}
                        onChange={(event) => updateForm("receiverName", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="hostName">
                        Host or family name
                      </label>
                      <input
                        id="hostName"
                        value={form.hostName}
                        onChange={(event) => updateForm("hostName", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="honoreeName">
                        Celebrant name
                      </label>
                      <input
                        id="honoreeName"
                        value={form.honoreeName}
                        onChange={(event) => updateForm("honoreeName", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {form.eventType === "Wedding" && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="bride">
                          Bride name
                        </label>
                        <input
                          id="bride"
                          value={form.bride}
                          onChange={(event) => updateForm("bride", event.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="groom">
                          Groom name
                        </label>
                        <input
                          id="groom"
                          value={form.groom}
                          onChange={(event) => updateForm("groom", event.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {form.eventType === "Birthday" && (
                    <div>
                      <label className={labelClass} htmlFor="age">
                        Age
                      </label>
                      <input
                        id="age"
                        value={form.age}
                        onChange={(event) => updateForm("age", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass} htmlFor="message">
                      Invitation message
                    </label>
                    <textarea
                      id="message"
                      value={form.message}
                      onChange={(event) => updateForm("message", event.target.value)}
                      rows={4}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className={labelClass} htmlFor="date">
                        Date
                      </label>
                      <input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(event) => updateForm("date", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="time">
                        Time
                      </label>
                      <input
                        id="time"
                        type="time"
                        value={form.time}
                        onChange={(event) => updateForm("time", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="dressCode">
                        Dress code
                      </label>
                      <input
                        id="dressCode"
                        value={form.dressCode}
                        onChange={(event) => updateForm("dressCode", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="venue">
                      Venue
                    </label>
                    <input
                      id="venue"
                      value={form.venue}
                      onChange={(event) => updateForm("venue", event.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="mapLink">
                      Google Maps link
                    </label>
                    <input
                      id="mapLink"
                      type="url"
                      value={form.mapLink}
                      onChange={(event) => updateForm("mapLink", event.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="rsvpContact">
                        RSVP contact
                      </label>
                      <input
                        id="rsvpContact"
                        value={form.rsvpContact}
                        onChange={(event) => updateForm("rsvpContact", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="rsvpDate">
                        RSVP by
                      </label>
                      <input
                        id="rsvpDate"
                        type="date"
                        value={form.rsvpDate}
                        onChange={(event) => updateForm("rsvpDate", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="registryLink">
                        Registry or gift link
                      </label>
                      <input
                        id="registryLink"
                        type="url"
                        value={form.registryLink}
                        onChange={(event) => updateForm("registryLink", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="giftNote">
                        Gift note
                      </label>
                      <input
                        id="giftNote"
                        value={form.giftNote}
                        onChange={(event) => updateForm("giftNote", event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "card" && (
                <div className="animate-rise-in space-y-6">
                  <div>
                    <label className={labelClass}>Card type</label>
                    <div className="mt-2 grid gap-3 md:grid-cols-3">
                      {cardModes.map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => updateForm("cardMode", mode.value)}
                          className={`rounded-md border p-4 text-left transition ${
                            form.cardMode === mode.value
                              ? "border-teal-800 bg-teal-50"
                              : "border-stone-300 bg-white hover:border-teal-700"
                          }`}
                        >
                          <span className="block font-semibold text-stone-950">{mode.label}</span>
                          <span className="mt-1 block text-sm leading-6 text-stone-600">{mode.copy}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Virtual card theme</label>
                    <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {themes.map((theme) => (
                        <button
                          key={theme.value}
                          type="button"
                          onClick={() => updateForm("theme", theme.value)}
                          className={`rounded-md border bg-white p-3 text-left transition ${
                            form.theme === theme.value ? "border-stone-950" : "border-stone-300 hover:border-teal-700"
                          }`}
                        >
                          <span className={`block h-8 rounded-md ${theme.swatch}`} />
                          <span className="mt-2 block text-sm font-semibold text-stone-800">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(form.cardMode === "uploaded" || form.cardMode === "both") && (
                    <div>
                      <label className={labelClass} htmlFor="cardUpload">
                        Upload actual card
                      </label>
                      <input
                        id="cardUpload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleCardUpload}
                        className="mt-2 block w-full rounded-md border border-dashed border-stone-400 bg-white p-4 text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      {form.cardAsset && (
                        <div className="mt-4 rounded-md border border-stone-300 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-stone-950">{form.cardAsset.name}</p>
                              <p className="text-sm text-stone-500">
                                {Math.round(form.cardAsset.size / 1024)} KB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateForm("cardAsset", null)}
                              className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-coral-700 hover:text-coral-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className={labelClass} htmlFor="galleryUpload">
                      Add photos and videos
                    </label>
                    <input
                      id="galleryUpload"
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleGalleryUpload}
                      className="mt-2 block w-full rounded-md border border-dashed border-stone-400 bg-white p-4 text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />

                    {form.gallery.length > 0 && (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {form.gallery.map((asset) => (
                          <div key={asset.id} className="rounded-md border border-stone-300 bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-stone-950">{asset.name}</p>
                                <p className="text-sm text-stone-500">{asset.kind}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeGalleryAsset(asset.id)}
                                className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:border-coral-700 hover:text-coral-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "guests" && (
                <div className="animate-rise-in space-y-6">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_150px_auto]">
                    <div>
                      <label className={labelClass} htmlFor="guestName">
                        Guest name
                      </label>
                      <input
                        id="guestName"
                        value={guestDraft.name}
                        onChange={(event) => setGuestDraft((current) => ({ ...current, name: event.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="guestContact">
                        Contact
                      </label>
                      <input
                        id="guestContact"
                        value={guestDraft.contact}
                        onChange={(event) =>
                          setGuestDraft((current) => ({ ...current, contact: event.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="guestChannel">
                        Channel
                      </label>
                      <select
                        id="guestChannel"
                        value={guestDraft.channel}
                        onChange={(event) =>
                          setGuestDraft((current) => ({
                            ...current,
                            channel: event.target.value as DeliveryChannel,
                          }))
                        }
                        className={inputClass}
                      >
                        {channels.map((channel) => (
                          <option key={channel} value={channel}>
                            {channel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addGuest}
                        className="w-full rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-stone-300 bg-white">
                    <div className="grid grid-cols-[1.1fr_1fr_110px_100px] border-b border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                      <span>Name</span>
                      <span>Contact</span>
                      <span>Channel</span>
                      <span>Status</span>
                    </div>
                    {form.guestList.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-stone-500">No guests added yet.</p>
                    ) : (
                      form.guestList.map((guest) => (
                        <div
                          key={guest.id}
                          className="grid grid-cols-[1.1fr_1fr_110px_100px] items-center gap-2 border-b border-stone-100 px-4 py-3 text-sm last:border-b-0"
                        >
                          <span className="font-semibold text-stone-950">{guest.name}</span>
                          <span className="truncate text-stone-600">{guest.contact || "-"}</span>
                          <span className="text-stone-600">{guest.channel}</span>
                          <span className="flex items-center justify-between gap-2">
                            <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                              {guest.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeGuest(guest.id)}
                              className="text-xs font-semibold text-coral-700 hover:text-coral-800"
                            >
                              Remove
                            </button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "review" && (
                <div className="animate-rise-in space-y-5">
                  {createdInvite ? (
                    <div className="rounded-lg border border-teal-700 bg-teal-50 p-5">
                      <p className="text-sm font-semibold uppercase tracking-wide text-teal-900">Invite created</p>
                      <h2 className="mt-2 text-2xl font-semibold text-stone-950">{createdInvite.title}</h2>
                      <p className="mt-3 break-all rounded-md bg-white p-3 text-sm text-stone-700">
                        {createdInvite.url}
                      </p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => copyInviteLink(createdInvite.url)}
                          className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => openShare("WhatsApp", createdInvite.payload, createdInvite.url)}
                          className="rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => openShare("Email", createdInvite.payload, createdInvite.url)}
                          className="rounded-md border border-stone-400 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                        >
                          Email
                        </button>
                        <a
                          href={createdInvite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-stone-400 px-4 py-2 text-center text-sm font-semibold text-stone-800 hover:border-teal-700"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-stone-300 bg-white p-5">
                      <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Review</p>
                      <h2 className="mt-2 text-2xl font-semibold text-stone-950">{form.title}</h2>
                      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-md bg-stone-50 p-3">
                          <dt className="font-semibold text-stone-700">Date</dt>
                          <dd className="mt-1 text-stone-950">{formatInviteDate(form.date)}</dd>
                        </div>
                        <div className="rounded-md bg-stone-50 p-3">
                          <dt className="font-semibold text-stone-700">Time</dt>
                          <dd className="mt-1 text-stone-950">{formatInviteTime(form.time)}</dd>
                        </div>
                        <div className="rounded-md bg-stone-50 p-3">
                          <dt className="font-semibold text-stone-700">Guests</dt>
                          <dd className="mt-1 text-stone-950">{form.guestList.length}</dd>
                        </div>
                        <div className="rounded-md bg-stone-50 p-3">
                          <dt className="font-semibold text-stone-700">Media</dt>
                          <dd className="mt-1 text-stone-950">{form.gallery.length} gallery items</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  {createdInvite && createdInvite.payload.guestList.length > 0 && (
                    <div className="rounded-lg border border-stone-300 bg-white p-5">
                      <h3 className="text-lg font-semibold text-stone-950">Guest sending</h3>
                      <div className="mt-4 space-y-3">
                        {createdInvite.payload.guestList.map((guest) => (
                          <div
                            key={guest.id}
                            className="flex flex-col gap-3 rounded-md border border-stone-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-semibold text-stone-950">{guest.name}</p>
                              <p className="text-sm text-stone-500">
                                {guest.channel} - {guest.status}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => shareWithGuest(createdInvite, guest)}
                              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                            >
                              Send
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md bg-coral-700 px-5 py-3 font-semibold text-white hover:bg-coral-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Creating..." : createdInvite ? "Update invite copy" : "Create invite"}
                    </button>
                    <button
                      type="button"
                      onClick={resetBuilder}
                      className="rounded-md border border-stone-400 px-5 py-3 font-semibold text-stone-800 hover:border-teal-700"
                    >
                      New invite
                    </button>
                  </div>
                </div>
              )}

              {activeTab !== "review" && (
                <div className="mt-8 flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const order: BuilderTab[] = ["details", "card", "guests", "review"];
                      setActiveTab(order[Math.max(0, order.indexOf(activeTab) - 1)]);
                    }}
                    className="rounded-md border border-stone-400 px-4 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const order: BuilderTab[] = ["details", "card", "guests", "review"];
                      setActiveTab(order[Math.min(order.length - 1, order.indexOf(activeTab) + 1)]);
                    }}
                    className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                  >
                    Continue
                  </button>
                </div>
              )}
            </form>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className={`rounded-lg border-2 p-5 shadow-sm ${themeClasses.frame}`}>
              <div className="border-b border-stone-300 pb-4">
                <p className={`text-sm font-semibold uppercase tracking-wide ${themeClasses.accent}`}>
                  {form.eventType} invitation
                </p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight text-stone-950">{previewNames}</h2>
                {form.hostName && <p className="mt-2 text-sm text-stone-600">Hosted by {form.hostName}</p>}
              </div>

              {(form.cardMode === "virtual" || form.cardMode === "both") && (
                <div className="mt-5 rounded-lg border border-stone-300 bg-white p-5">
                  <p className="text-sm uppercase tracking-wide text-stone-500">Dear {form.receiverName || "Guest"}</p>
                  <p className="mt-4 text-2xl font-semibold text-stone-950">{form.title}</p>
                  <p className="mt-4 leading-7 text-stone-700">{form.message}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className={`rounded-md p-3 ${themeClasses.band}`}>
                      <p className="font-semibold text-stone-950">Date</p>
                      <p className="mt-1 text-stone-700">{formatInviteDate(form.date)}</p>
                    </div>
                    <div className="rounded-md bg-stone-100 p-3">
                      <p className="font-semibold text-stone-950">Time</p>
                      <p className="mt-1 text-stone-700">{formatInviteTime(form.time)}</p>
                    </div>
                  </div>
                  {form.venue && <p className="mt-4 text-sm font-semibold text-stone-800">{form.venue}</p>}
                </div>
              )}

              {(form.cardMode === "uploaded" || form.cardMode === "both") && form.cardAsset && (
                <div className="mt-5 overflow-hidden rounded-lg border border-stone-300 bg-white">
                  {form.cardAsset.kind === "image" && form.cardAsset.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.cardAsset.dataUrl} alt={form.cardAsset.name} className="max-h-[420px] w-full object-contain" />
                  ) : (
                    <div className="p-5">
                      <p className="font-semibold text-stone-950">{form.cardAsset.name}</p>
                      <p className="mt-2 text-sm text-stone-500">Attached card file</p>
                    </div>
                  )}
                </div>
              )}

              {form.gallery.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {form.gallery.slice(0, 4).map((asset) => (
                    <div key={asset.id} className="overflow-hidden rounded-md border border-stone-300 bg-white">
                      {asset.kind === "image" && asset.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.dataUrl} alt={asset.name} className="h-28 w-full object-cover" />
                      ) : asset.kind === "video" && asset.dataUrl ? (
                        <video src={asset.dataUrl} className="h-28 w-full object-cover" muted controls />
                      ) : (
                        <div className="flex h-28 items-center justify-center p-3 text-center text-sm font-semibold text-stone-600">
                          {asset.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {mapPreviewUrl && (
              <section className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
                <iframe
                  src={mapPreviewUrl}
                  width="100%"
                  height="240"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </section>
            )}

            {statusMessage && (
              <p className="rounded-md border border-stone-300 bg-white p-3 text-sm text-stone-700">{statusMessage}</p>
            )}
          </aside>
        </div>

        <section id="tracking" className="mt-8 rounded-lg border border-stone-300 bg-[#fffaf2] p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-300 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">Tracking</p>
              <h2 className="mt-1 text-2xl font-semibold text-stone-950">My invitations</h2>
            </div>
            <p className="text-sm text-stone-600">{savedInvites.length} saved in this browser</p>
          </div>

          {savedInvites.length === 0 ? (
            <p className="py-6 text-sm text-stone-500">Created invites will appear here.</p>
          ) : (
            <div className="mt-5 grid gap-4">
              {savedInvites.map((invite) => {
                const analytics = invite.payload.analytics || {
                  openCount: 0,
                  sentCount: 0,
                  rsvpYes: 0,
                  rsvpNo: 0,
                };
                const sentCount = invite.payload.guestList.filter((guest) => guest.status === "Sent").length;

                return (
                  <article key={invite.id} className="rounded-lg border border-stone-300 bg-white p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                          {invite.eventType}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-stone-950">{invite.title}</h3>
                        <p className="mt-2 text-sm text-stone-600">{formatInviteDate(invite.date)}</p>
                        {invite.localOnly && (
                          <p className="mt-2 text-sm font-semibold text-coral-700">Local only</p>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-md bg-stone-50 px-3 py-2">
                          <p className="text-lg font-semibold text-stone-950">{invite.payload.guestList.length}</p>
                          <p className="text-xs uppercase tracking-wide text-stone-500">Guests</p>
                        </div>
                        <div className="rounded-md bg-teal-50 px-3 py-2">
                          <p className="text-lg font-semibold text-teal-800">{sentCount || analytics.sentCount}</p>
                          <p className="text-xs uppercase tracking-wide text-stone-500">Sent</p>
                        </div>
                        <div className="rounded-md bg-coral-100 px-3 py-2">
                          <p className="text-lg font-semibold text-coral-800">{analytics.openCount}</p>
                          <p className="text-xs uppercase tracking-wide text-stone-500">Opens</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyInviteLink(invite.url)}
                        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => openShare("WhatsApp", invite.payload, invite.url)}
                        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => openShare("Email", invite.payload, invite.url)}
                        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => refreshInviteStats(invite.id)}
                        className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 hover:border-teal-700"
                      >
                        Refresh
                      </button>
                      <a
                        href={invite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                      >
                        View
                      </a>
                    </div>

                    {invite.payload.guestList.length > 0 && (
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {invite.payload.guestList.map((guest) => (
                          <div
                            key={guest.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-stone-200 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-stone-950">{guest.name}</p>
                              <p className="text-sm text-stone-500">
                                {guest.channel} - {guest.status}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => shareWithGuest(invite, guest)}
                              className="rounded-md bg-teal-800 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-900"
                            >
                              Send
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      )}
    </main>
  );
}
