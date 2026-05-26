export type InviteEventType =
  | "Wedding"
  | "Birthday"
  | "Anniversary"
  | "Housewarming"
  | "Baby Shower"
  | "Graduation"
  | "Custom";

export type CardMode = "virtual" | "uploaded" | "both";

export type InviteTheme = "signature" | "garden" | "royal" | "midnight";

export type DeliveryChannel = "WhatsApp" | "Email" | "SMS";

export type DeliveryStatus = "Ready" | "Sent" | "Opened" | "RSVP Yes" | "RSVP No";

export type MediaKind = "image" | "video" | "file";

export type MediaAsset = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: MediaKind;
  role: "card" | "gallery";
  dataUrl?: string;
};

export type GuestRecipient = {
  id: string;
  token?: string;
  name: string;
  contact: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  lastSentAt?: string;
  lastOpenedAt?: string;
  rsvp?: "yes" | "no" | "maybe";
};

export type InviteAnalytics = {
  openCount: number;
  sentCount: number;
  rsvpYes: number;
  rsvpNo: number;
  lastOpenedAt?: string;
};

export type InvitePayload = {
  _id?: string;
  publicToken?: string;
  ownerEmail?: string;
  ownerName?: string;
  eventType: InviteEventType;
  cardMode: CardMode;
  theme: InviteTheme;
  title: string;
  receiverName: string;
  hostName: string;
  message: string;
  date: string;
  time: string;
  venue: string;
  mapLink: string;
  bride: string;
  groom: string;
  honoreeName: string;
  age: string;
  dressCode: string;
  rsvpDate: string;
  rsvpContact: string;
  registryLink: string;
  giftNote: string;
  privacy: "public" | "unlisted";
  cardAsset: MediaAsset | null;
  gallery: MediaAsset[];
  guestList: GuestRecipient[];
  analytics?: InviteAnalytics;
  createdAt?: string;
  updatedAt?: string;
};
