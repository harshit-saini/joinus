// lib/models/Invite.ts
import mongoose, { Schema, Document } from 'mongoose';


export interface IInvite extends Document {
eventType: string;
title?: string;
message?: string;
date?: string;
bride?: string;
groom?: string;
createdAt: Date;
}


const InviteSchema = new Schema<IInvite>({
eventType: { type: String, required: true },
title: { type: String },
message: { type: String },
date: { type: String },
bride: { type: String },
groom: { type: String },
createdAt: { type: Date, default: Date.now },
});


// Prevent model overwrite during hot reloads in development
export default (mongoose.models.Invite as mongoose.Model<IInvite>) || mongoose.model<IInvite>('Invite', InviteSchema);