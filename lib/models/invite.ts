// lib/models/Invite.ts
import mongoose, { Schema, Document } from 'mongoose';


export interface IInvite extends Document {
eventType: 'Birthday' | 'Wedding';
receiverName?: string;
title?: string;
message?: string;
date?: string;
time?: string;
venue?: string;
mapLink?: string;
bride?: string;
groom?: string;
createdAt: Date;
}


const InviteSchema = new Schema<IInvite>({
eventType: { type: String, required: true },
receiverName: { type: String },
title: { type: String },
message: { type: String },
date: { type: String },
time: { type: String },
venue: { type: String },
mapLink: { type: String },
bride: { type: String },
groom: { type: String },
createdAt: { type: Date, default: Date.now },
});


// Prevent model overwrite during hot reloads in development
export default (mongoose.models.Invite as mongoose.Model<IInvite>) || mongoose.model<IInvite>('Invite', InviteSchema);