import mongoose, { Schema, Model } from 'mongoose';

export interface ITopicItem {
  id: string;
  title: string;
  completed: boolean;
  resourceType?: string;
}

export interface IRoadmapPhase {
  weekNum: number;
  phase: string;
  title: string;
  description: string;
  topics: ITopicItem[];
  targetQuestions: number;
  solvedQuestions: number;
  easyTarget: number;
  mediumTarget: number;
  hardTarget: number;
  resources?: string[];
  estimatedTimeline?: string;
}

export interface IRoadmap {
  userId?: mongoose.Types.ObjectId | string;
  targetRole: string;
  degree?: string;
  company?: string;
  phases: IRoadmapPhase[];
  generatedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const TopicItemSchema = new Schema<ITopicItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    resourceType: { type: String, default: 'Concept & Problem Practice' },
  },
  { _id: false }
);

const RoadmapPhaseSchema = new Schema<IRoadmapPhase>(
  {
    weekNum: { type: Number, required: true },
    phase: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topics: [TopicItemSchema],
    targetQuestions: { type: Number, default: 15 },
    solvedQuestions: { type: Number, default: 0 },
    easyTarget: { type: Number, default: 5 },
    mediumTarget: { type: Number, default: 8 },
    hardTarget: { type: Number, default: 2 },
    resources: [{ type: String }],
    estimatedTimeline: { type: String, default: '1 Week' },
  },
  { _id: false }
);

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetRole: { type: String, required: true },
    degree: { type: String, default: '' },
    company: { type: String, default: '' },
    phases: [RoadmapPhaseSchema],
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Roadmap: Model<IRoadmap> =
  (mongoose.models.Roadmap as Model<IRoadmap>) ||
  mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);
