# PlacementOS

## SIH 2026

Problem Statement:
**26044 — Portal for Academia–Industry collaboration for Skill Mapping, Internships and Placement**

---

## Overview

PlacementOS is a unified collaboration and placement intelligence platform bridging higher education institutions and industry. It provides a shared, verifiable ecosystem connecting four primary stakeholders:

* **Students**: Undergo standardized technical & soft skill assessments, build verified digital portfolios, discover career roadmaps, and apply to matched internships and full-time jobs.
* **Industry / Recruiters**: Define competency requirements, analyze candidate skill gaps, discover high-potential talent through weighted multi-attribute ranking, publish learning programs, and manage applicant pipelines.
* **Academicians**: Mentor students, publish academic research opportunities, and review/verify student project evidence.
* **Institutions / TPOs (Training & Placement Officers)**: Access aggregate institutional analytics, track placement drives, review student verification queues, and monitor campus placement readiness.

---

## Major Features

* **Technical & Soft Skill Assessment**: Multi-domain question bank assessing proficiency across frontend, backend, AI/ML, DevOps, and foundational soft skills.
* **Student Skill Profile**: Normalized skill records computing overall readiness, percentile tiers, and categorical proficiencies.
* **Industry Skill Gap Analysis**: Dynamic comparison between student skill profiles and job/internship role requirements, identifying missing proficiencies.
* **Job & Internship Recommendations**: Deterministic weighted matching algorithm recommending opportunities based on skill alignment.
* **Skill-Based Recruiter Candidate Ranking**: Multidimensional scoring algorithm ranking candidates based on technical skill fit, verified portfolio artifacts, academic record, and assessment performance.
* **Digital Student Portfolio**: Comprehensive showcase featuring verified projects, certificates, published internships, and coding achievements.
* **GitHub Portfolio Audit**: Repository inspection evaluating documentation, commit velocity, code structure, and test presence.
* **Evidence-Based Portfolio Verification**: Institutional and academician verification workflows gating portfolio evidence with status tracking (`PENDING`, `VERIFIED`, `REJECTED`).
* **Persistent Resume & Certificate Storage**: Multipart file upload pipeline with MIME/magic-byte validation, backed by MongoDB GridFS persistent document storage.
* **Human Mentor Discovery & Requests**: Searchable network of academic and industry mentors with structured mentorship request/session workflows.
* **Industry Learning Programs**: Company-sponsored training tracks, hackathons, and certifications with integrated student application pipelines.
* **AI Mock Interview**: Interactive interview practice engine generating role-specific behavioral and technical questions with structured evaluation.
* **AI Career Roadmap**: Personalized milestone-based learning plans tailored to student target roles and current skill proficiencies.
* **AI Career Mentor**: Context-aware career advice assisting students with skill acquisition, resume strategy, and interview preparation.
* **Aptitude Testing**: Standardized quantitative, logical, and verbal aptitude test engine with timed sessions and diagnostic scoring.
* **Interview Experience Bank**: Searchable repository of real-world interview debriefs and company questions shared across students.
* **Institution / TPO Analytics**: High-level administrative dashboard visualizing department-level readiness, average assessment scores, and placement stats.
* **Recruiter / Talent Search**: Filterable talent discovery interface allowing recruiters to query candidates by specific skill sets, universities, and experience tiers.

---

## Technology Stack

* **Frontend**:
  * React 19 (`react`, `react-dom`)
  * TypeScript (`typescript`)
  * Vite (`vite`, `@vitejs/plugin-react`)
  * Tailwind CSS (`tailwindcss`, `@tailwindcss/vite`)
  * Lucide React Icons (`lucide-react`)
  * Markdown Rendering (`react-markdown`)
  * Computer Vision / MediaPipe (`@mediapipe/tasks-vision`)
* **Backend**:
  * Node.js & Express 4 (`express`)
  * TypeScript Runtime & Bundler (`tsx`, `esbuild`)
* **Database & Document Persistence**:
  * MongoDB & Mongoose (`mongoose`)
  * MongoDB GridFS (`multer` in-memory streaming to `GridFSBucket`)
* **AI & Intelligence Engine**:
  * Google GenAI SDK (`@google/genai` with Gemini models)
* **Security & Utilities**:
  * JSON Web Tokens (`jsonwebtoken`)
  * Password Hashing (`bcryptjs`)
  * Security Headers (`helmet`)
  * Cross-Origin Resource Sharing (`cors`)
  * Environment Management (`dotenv`)

---

## Architecture

```text
Student
   ↓
Assessment (Technical, Soft Skills, Aptitude)
   ↓
Skill Profile (Normalized Proficiencies & Scores)
   ↓
Skill Gap (Role Requirement Delta Analysis)
   ↓
Opportunities (Targeted Jobs & Learning Programs)
   ↓
Recruiter Matching (Multi-Attribute Candidate Ranking)
   ↓
Portfolio (Projects, Certifications, Experience, Resumes)
   ↓
Verification (College Verifier & Academician Review)
   ↓
Institutional Insights (TPO Analytics & Placement Metrics)
```

### Role-Based Access Control (RBAC)

The platform enforces strict role boundaries across all API routes and client views:

* `student`: Access to assessments, portfolio management, resume upload, job applications, mentorship requests, and AI career tools.
* `industry`: Access to candidate search, job postings, learning programs, application review, and candidate ranking.
* `academician`: Access to mentorship management, student verification queues, and academic opportunity publishing.
* `institution`: Access to campus TPO analytics, institutional verification workflows, student directory, and placement analytics.

---

## AI Implementation

PlacementOS maintains clear architectural boundaries between deterministic algorithms and generative AI:

* **Deterministic Matching Engines**: Skill gap analysis, job recommendations, and candidate ranking operate on deterministic, mathematical weighted scoring (based on required skills, preferred skills, verification status, and assessment tiers). These algorithms are transparent, auditable, and free of non-deterministic hallucination.
* **Generative AI (Gemini)**: Google GenAI (`@google/genai`) powers generative capabilities where contextual synthesis is required:
  * **AI Career Mentor**: Provides contextual career navigation, study roadmaps, and domain insights.
  * **AI Mock Interview**: Generates tailored scenario-based questions and evaluates candidate responses with constructive feedback.
  * **AI Career Roadmap**: Formulates progressive learning milestones targeted at specific industry specializations.
  * **Resume & Certification Parsing**: Assists with structured entity extraction from uploaded documents.

---

## Security Architecture

PlacementOS is hardened with enterprise-grade defensive measures verified via automated security regression suites:

* **JWT Bearer Authentication**: Authoritative token extraction strictly from `Authorization: Bearer <token>` headers; query parameter token leakage is rejected.
* **Role-Based Authorization**: Every sensitive API endpoint enforces strict middleware checks against authenticated user roles.
* **Object-Level Authorization & IDOR Defense**: All document mutations, profile views, and file downloads strictly enforce user/tenant ownership or authorized recruiter/verifier relationships.
* **Mass-Assignment Protection**: Update endpoints strictly whitelist allowable fields; role escalation, ownership reassignment, and verification status forging are blocked.
* **Production CORS Enforcement**: Strict origin whitelisting in production environments; prevents unauthorized cross-origin requests.
* **Fail-Closed JWT Secret Validation**: Rejects insecure defaults, short keys, and placeholder secrets in production mode.
* **Security Headers**: HTTP security headers configured via `helmet` with `X-Powered-By` header stripped.
* **Payload Limits**: Strict 1MB JSON body payload limits to mitigate denial-of-service attempts.
* **Authentication Rate Limiting**: In-memory IP-keyed sliding-window rate limiting protecting authentication routes from brute-force attempts.
* **Secure File Upload & Storage**: Multiphase validation checking MIME types, file sizes, and binary magic-bytes (PDF, PNG, JPEG, DOCX) prior to GridFS persistence.
* **Evidence-Gated Verification**: Student portfolio artifacts require verifiable institutional credentials and audit records.
* **Production Error Sanitization**: Internal database error details, stack traces, and storage exceptions are masked into safe, generic responses (`Internal server error`, `Storage unavailable`, `File upload error`) in production mode.

---

## Local Setup

### Prerequisites

* **Node.js**: v18.0.0 or higher (or Bun v1.0+)
* **MongoDB**: Local MongoDB server or MongoDB Atlas cluster URI
* **Gemini API Key**: From Google AI Studio (for AI interview & mentoring features)

### 1. Clone & Install Dependencies

```bash
# Using npm
npm install

# Or using bun
bun install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
# Required for Gemini AI features
GEMINI_API_KEY=your_gemini_api_key_here

# Application URL
APP_URL=http://localhost:3000

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/placementos

# JWT Secret (minimum 32 random characters for production)
JWT_SECRET=your-secure-random-jwt-secret-min-32-chars

# Production CORS Whitelist (comma-separated, optional for local dev)
CORS_ORIGINS=http://localhost:3000

# Secret college invite code for TPO registration
TPO_INVITE_CODE=college-tpo-secret-code

# Document Upload & Storage Settings
MAX_FILE_SIZE_MB=10
FILE_STORAGE_MODE=gridfs
```

> **Important**: Never commit `.env` or expose secrets, passwords, or API keys in source control.

### 3. Seed Initial Data (Optional)

Initialize the question banks and mock mentors:

```bash
# Seed skill assessment questions
npx tsx scripts/seedSkillQuestions.ts

# Seed aptitude assessment questions
npx tsx scripts/seedAptitudeQuestions.ts

# Seed default mentor profiles
npx tsx scripts/seedMentors.ts
```

### 4. Run Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`.

### 5. Build for Production

```bash
# Compile Vite frontend bundle and bundle TypeScript server
npm run build

# Start production server
npm run start
```

---

## Project Structure

```text
├── index.html                 # Main HTML entry point
├── package.json               # Dependencies and build scripts
├── server.ts                  # Express server entry point, API router mounting & middleware
├── vite.config.ts             # Vite configuration with Tailwind CSS plugin
├── routes/                    # Express REST API Route Controllers
│   ├── academician.ts         # Academician opportunities, mentorship, and reviews
│   ├── aptitude.ts            # Aptitude test sessions and questions
│   ├── auth.ts                # Authentication (register, login, JWT issuance)
│   ├── authMiddleware.ts      # JWT Bearer token authentication middleware
│   ├── authRateLimiter.ts     # IP-based rate limiting for authentication
│   ├── badges.ts              # Gamified badges and achievement endpoints
│   ├── certifications.ts      # Certificate upload, GridFS storage, and parsing
│   ├── errorHandler.ts        # Production-safe error handling and masking
│   ├── experiences.ts         # Interview experience sharing and retrieval
│   ├── files.ts               # Authenticated file streaming from GridFS
│   ├── geminiClient.ts        # Resilient Gemini AI client wrapper with failover
│   ├── interviews.ts          # AI Mock Interview session management
│   ├── mentor.ts              # AI Career Mentor conversational endpoints
│   ├── mentorship.ts          # Human mentor discovery, requests, and scheduling
│   ├── portfolio.ts           # Student portfolio, project, and GitHub audit routes
│   ├── recruiters.ts          # Job postings, candidate search, and ranking
│   ├── resume.ts              # Resume upload, ATS analysis, and storage
│   ├── roadmap.ts             # AI-generated career roadmap routes
│   ├── securityConfig.ts      # CORS, JWT secret validation, and rate limits
│   ├── skills.ts              # Skill assessments, results, and profiles
│   ├── students.ts            # Student profile, job applications, learning programs
│   ├── tpo.ts                 # Training & Placement Officer institutional analytics
│   └── verification.ts        # Evidence-gated portfolio item verification
├── src/                       # Frontend React Application Source
│   ├── App.tsx                # Primary application component with role routing
│   ├── main.tsx               # React application DOM entry point
│   ├── components/            # Modular UI components by stakeholder domain
│   ├── context/               # Global state contexts (AuthContext, etc.)
│   ├── constants/             # Application-wide constants and enumerations
│   ├── db/                    # MongoDB connection lifecycle management
│   ├── models/                # Mongoose database schemas and TypeScript models
│   ├── services/              # Client and server utility services (fileStorage GridFS)
│   ├── types/                 # Shared TypeScript interfaces, types, and enums
│   └── utils/                 # Client helper functions and formatters
└── scripts/                   # Automated Security Regression Tests & Seeders
    ├── test-final-security-regression.ts    # Comprehensive final regression test suite
    ├── test-production-security.ts          # Production security & hardening validation
    ├── test-idor-authorization.ts           # Object-level authorization & IDOR suite
    ├── test-role-authorization.ts           # Strict RBAC role barrier tests
    ├── test-mass-assignment.ts              # Mass-assignment protection test suite
    ├── test-portfolio-verification.ts       # Evidence verification workflow tests
    ├── test-mentorship-workflow.ts          # Mentorship lifecycle validation
    ├── test-learning-program-workflow.ts    # Learning program lifecycle tests
    ├── seedSkillQuestions.ts                # Technical skill assessment seeder
    ├── seedAptitudeQuestions.ts             # Aptitude test question seeder
    └── seedMentors.ts                       # Mentor directory seeder
```
