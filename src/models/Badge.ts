import mongoose, { Schema, Model } from 'mongoose';

export interface IBadge {
  userId?: mongoose.Types.ObjectId | string;
  title: string;
  description: string;
  icon?: string;
  earnedAt?: string;
}

const BadgeSchema = new Schema<IBadge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Award' },
    earnedAt: { type: String, default: () => new Date().toLocaleDateString() },
  },
  { timestamps: true }
);

export const Badge: Model<IBadge> =
  (mongoose.models.Badge as Model<IBadge>) || mongoose.model<IBadge>('Badge', BadgeSchema);
