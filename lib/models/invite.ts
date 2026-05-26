import mongoose, { Document, Model, Schema } from "mongoose";

import type { InviteAnalytics, InvitePayload } from "../invite-types";

type InviteDocument = Omit<
  InvitePayload,
  "_id" | "createdAt" | "updatedAt" | "analytics"
> & {
  analytics: InviteAnalytics;
};

export interface IInvite extends InviteDocument, Document {
  _id: mongoose.Types.ObjectId;
}

const MediaAssetSchema = new Schema(
  {
    id: { type: String, required: true },
    token: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "" },
    size: { type: Number, default: 0 },
    kind: { type: String, enum: ["image", "video", "file"], default: "file" },
    role: { type: String, enum: ["card", "gallery"], default: "gallery" },
    dataUrl: { type: String, default: "" },
  },
  { _id: false },
);

const GuestRecipientSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    contact: { type: String, default: "" },
    channel: {
      type: String,
      enum: ["WhatsApp", "Email", "SMS"],
      default: "WhatsApp",
    },
    status: {
      type: String,
      enum: ["Ready", "Sent", "Opened", "RSVP Yes", "RSVP No"],
      default: "Ready",
    },
    lastSentAt: { type: String, default: "" },
    lastOpenedAt: { type: String, default: "" },
    rsvp: { type: String, enum: ["yes", "no", "maybe", ""], default: "" },
  },
  { _id: false },
);

const InviteSchema = new Schema(
  {
    publicToken: { type: String, required: true, unique: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    ownerName: { type: String, default: "" },
    eventType: {
      type: String,
      enum: [
        "Wedding",
        "Birthday",
        "Anniversary",
        "Housewarming",
        "Baby Shower",
        "Graduation",
        "Custom",
      ],
      required: true,
      default: "Wedding",
    },
    cardMode: {
      type: String,
      enum: ["virtual", "uploaded", "both"],
      default: "both",
    },
    theme: {
      type: String,
      enum: ["signature", "garden", "royal", "midnight"],
      default: "signature",
    },
    title: { type: String, required: true },
    receiverName: { type: String, default: "" },
    hostName: { type: String, default: "" },
    message: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    venue: { type: String, default: "" },
    mapLink: { type: String, default: "" },
    bride: { type: String, default: "" },
    groom: { type: String, default: "" },
    honoreeName: { type: String, default: "" },
    age: { type: String, default: "" },
    dressCode: { type: String, default: "" },
    rsvpDate: { type: String, default: "" },
    rsvpContact: { type: String, default: "" },
    registryLink: { type: String, default: "" },
    giftNote: { type: String, default: "" },
    privacy: {
      type: String,
      enum: ["public", "unlisted"],
      default: "unlisted",
    },
    cardAsset: { type: MediaAssetSchema, default: null },
    gallery: { type: [MediaAssetSchema], default: [] },
    guestList: { type: [GuestRecipientSchema], default: [] },
    analytics: {
      openCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      rsvpYes: { type: Number, default: 0 },
      rsvpNo: { type: Number, default: 0 },
      lastOpenedAt: { type: String, default: "" },
    },
  },
  {
    minimize: false,
    timestamps: true,
  },
);

export default (mongoose.models.Invite as Model<IInvite>) ||
  mongoose.model<IInvite>("Invite", InviteSchema);
