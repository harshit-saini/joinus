import type { GuestRecipient, InvitePayload } from "./invite-types";

export function getEmbedMapUrl(mapLink: string): string {
  if (!mapLink) {
    return "";
  }

  try {
    if (mapLink.includes("/embed")) {
      return mapLink;
    }

    const coordMatch = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const [, lat, lng] = coordMatch;
      return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }

    return mapLink.replace("/maps/", "/maps/embed/");
  } catch {
    return mapLink;
  }
}

export function formatInviteDate(date: string): string {
  if (!date) {
    return "Date to be announced";
  }

  const parts = date.split("-").map(Number);
  const parsed =
    parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatInviteTime(time: string): string {
  if (!time) {
    return "Time to be announced";
  }

  const [hourValue, minuteValue] = time.split(":").map(Number);
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) {
    return time;
  }

  const date = new Date();
  date.setHours(hourValue, minuteValue, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function buildGuestInviteUrl(baseUrl: string, guest?: GuestRecipient): string {
  if (!guest) {
    return baseUrl;
  }

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}guest=${encodeURIComponent(guest.token || guest.id)}`;
}

export function buildShareMessage(invite: Pick<InvitePayload, "title" | "date" | "venue">, url: string): string {
  const date = invite.date ? ` on ${formatInviteDate(invite.date)}` : "";
  const venue = invite.venue ? ` at ${invite.venue}` : "";
  return `You are invited to ${invite.title}${date}${venue}. Open your invitation: ${url}`;
}
