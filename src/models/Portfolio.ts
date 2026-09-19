import mongoose, { Schema, Model } from 'mongoose';

/**
 * ARCHITECTURE NOTE (Fix #5.1):
 * This model specifically stores "GitHub Portfolio Audit" data (GitHub URL, repository inspection,
 * AI code quality scores, strengths, recommendations, and audited projects).
 * 
 * It is NOT the unified "Digital Student Portfolio".
 * The unified Digital Student Portfolio is dynamically aggregated by `portfolioService.ts`
 * across the primary domain models: User, StudentSkillProfile, Project, Certification,
 * Internship, and Achievement.
 */
export interface IAuditedProject {
  name: string;
  language?: string;
  description?: string;
  commits?: string | number;
  stars?: number;
  status?: string;
  url?: string;
  summary?: string;
}

export interface IPortfolio {
  userId: mongoose.Types.ObjectId | string;
  githubUrl: string;
  githubUsername: string;
  qualityScore: number;
  feedback?: string;
  strengths?: string[];
  recommendations?: string[];
  auditedProjects?: IAuditedProject[];
  createdAt?: Date;
  updatedAt?: Date;
}

const AuditedProjectSchema = new Schema<IAuditedProject>({
  name: { type: String, required: true },
  language: { type: String, default: 'TypeScript' },
  description: { type: String, default: '' },
  commits: { type: Schema.Types.Mixed, default: '10+' },
  stars: { type: Number, default: 0 },
  status: { type: String, default: 'Audited' },
  url: { type: String, default: '' },
  summary: { type: String, default: '' },
});

const PortfolioSchema = new Schema<IPortfolio>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    githubUrl: { type: String, required: true },
    githubUsername: { type: String, required: true },
    qualityScore: { type: Number, default: 80 },
    feedback: { type: String, default: '' },
    strengths: [{ type: String }],
    recommendations: [{ type: String }],
    auditedProjects: [AuditedProjectSchema],
  },
  { timestamps: true }
);

export const Portfolio: Model<IPortfolio> =
  (mongoose.models.Portfolio as Model<IPortfolio>) ||
  mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
