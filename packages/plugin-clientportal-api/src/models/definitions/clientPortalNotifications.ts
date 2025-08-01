import { Document, Schema } from "mongoose";
import { field } from "./utils";

export interface ICPNotification {
  title?: string;
  content?: string;
  link?: string;
  receiver?: string;
  notifType?: "engage" | "system";
  clientPortalId: string;
  eventData?: any | null;
  groupId?: string;
  type?: string;
}

export interface ICPNotificationDocument extends ICPNotification, Document {
  _id: string;
  createdUser?: string;
  receiver: string;
  createdAt: Date;
  isRead: boolean;
  type?: string;
}

export const cpNotificationSchema = new Schema({
  _id: field({ pkey: true }),
  title: field({ type: String }),
  link: field({ type: String, optional: true }),
  content: field({ type: String }),
  createdUser: field({ type: String }),
  receiver: field({ type: String, index: true }),
  createdAt: field({
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // 30 days
  }),
  isRead: field({
    type: Boolean,
    default: false,
  }),
  notifType: field({
    type: String,
  }),
  clientPortalId: field({
    type: String,
    index: true,
  }),
  eventData: field({
    type: Schema.Types.Mixed,
    optional: true,
  }),
  groupId: field({
    type: String,
    optional: true,
  }),
  type: field({
    type: String,
  }),
});

cpNotificationSchema.index(
  { createdAt: 1, receiver: 1, clientPortalId: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);
