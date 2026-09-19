# PlacementOS

## Smart India Hackathon 2026

**Problem Statement ID:** 26044  
**Problem Statement:** Portal for Academia–Industry collaboration for Skill Mapping, Internships and Placement  
**Team:** Code Pirates

PlacementOS is a unified Academia–Industry collaboration and placement intelligence platform that connects students, industry, academicians, and institutions in one skill-driven ecosystem.

The platform is designed around a continuous journey:

**Assess -> Build Skill Profile -> Identify Gaps -> Learn & Practice -> Verify -> Match -> Apply -> Track**

---

## Overview

PlacementOS addresses a common gap between education, skill development, and industry requirements by connecting the complete student-to-placement lifecycle.

### Students
- Technical and soft-skill assessment
- Centralized skill profile
- Role-specific skill-gap analysis
- AI career guidance and roadmap
- AI mentor with grounded knowledge
- AI mock interview and proctoring safeguards
- Coding readiness question bank
- Digital portfolio
- Portfolio verification
- Jobs and internships
- Application tracking
- Human mentor discovery and mentorship requests
- Interview experience resources
- Career and placement analytics

### Industry / Recruiters
- Job and internship posting
- Industry learning programs
- Talent search
- Skill-based candidate ranking
- Candidate shortlisting
- Application management
- Recruiter analytics

### Academicians
- Faculty internship opportunities
- Industrial training
- Faculty development programs
- Research and consultancy opportunities
- Mentorship
- Portfolio verification
- Industry-academia collaboration

### Institutions / TPOs
- Student readiness monitoring
- Skill-gap analytics
- Placement and internship tracking
- Institution-level analytics
- Recruiter and company management
- Verification workflows
- Placement insights and reports

---

## Major Features

### 1. Technical and Soft Skill Assessment
A structured assessment framework covering technical competencies and foundational soft skills.

Technical areas include skills such as:
- Programming Fundamentals
- C++
- Java
- Python
- JavaScript
- Data Structures and Algorithms
- SQL
- DBMS
- HTML/CSS
- React
- Node.js
- MongoDB
- REST APIs
- Git/GitHub
- Cloud
- Computer Networks
- Operating Systems
- OOP
- System Design

Soft-skill areas include:
- Communication
- Teamwork
- Leadership
- Problem Solving
- Time Management
- Adaptability
- Critical Thinking
- Collaboration

Assessment results are stored using a normalized skill representation and contribute to the student's skill profile.

### 2. Student Skill Profile and Skill-Gap Analysis
PlacementOS maintains a centralized student skill profile and compares it against structured role requirements.

The platform uses a deterministic matching engine to classify skills into:
- STRONG
- NEEDS_IMPROVEMENT
- GAP
- NOT_ASSESSED

Role matching uses weighted requirements and consolidated skill aliases so the same skill is not counted multiple times.

### 3. Job and Internship Recommendation
Active opportunities are evaluated against the student's skill profile using the same centralized matching engine used by recruiter-side candidate evaluation.

Recommendations consider:
- Required skills
- Skill coverage
- Role relevance
- Match percentage
- Priority improvement areas

Application status remains separate from the calculated match score.

### 4. Recruiter Candidate Ranking
Recruiters can discover and rank candidates for a specific opportunity using the job's structured skill requirements.

Candidate ranking prioritizes:
1. Match percentage
2. Required-skill coverage
3. Strong required skills
4. Application relevance
5. Readiness information
6. Stable deterministic tie-breaking

The same centralized role-matching logic is used to keep student-side and recruiter-side match calculations consistent.

### 5. Digital Student Portfolio
The digital portfolio brings together:
- Student profile
- Education
- Skills
- Projects
- Certifications
- Internships
- Achievements
- GitHub portfolio audit
- Evidence and verification status

### 6. Evidence-Based Portfolio Verification
Portfolio evidence can be reviewed by authorized academician and institutional users.

Supported portfolio evidence includes:
- Certifications
- Projects
- Internships
- Achievements

Verification states:

```text
PENDING -> VERIFIED
PENDING -> REJECTED
REJECTED -> PENDING
```

Verification is evidence-gated and protected by role and ownership checks.

### 7. Persistent Document Storage
Resume and certificate uploads use persistent document storage with:
- MIME validation
- Magic-byte validation
- File-size limits
- Authenticated access
- Ownership checks
- MongoDB GridFS persistence

### 8. GitHub Portfolio Audit
PlacementOS can analyze a public GitHub profile/repository and produce a portfolio audit for the student's profile.

The audit is connected to the digital portfolio and can also be surfaced in recruiter candidate information.

### 9. Human Mentor Discovery
Students can discover available mentors and submit mentorship requests.

The mentorship workflow supports:
- Mentor discovery
- Mentor profile viewing
- Request submission
- Accept / reject
- Student and mentor request history
- Mentee management

Privacy controls ensure that private account information is not exposed through public mentor discovery.

### 10. Industry Learning Programs
Industry users can publish structured learning programs and students can:
- Discover programs
- Apply
- Track application status
- Follow selection workflows

Supported application states include:

```text
APPLIED
UNDER_REVIEW
SELECTED
REJECTED
```

Program capacity is enforced during selection rather than incorrectly blocking applications.

### 11. AI Mock Interview
The AI mock interview generates role-oriented interview questions and provides structured evaluation.

The current prototype also includes browser-supported proctoring safeguards:
- Tab-switch detection
- Page refresh / unload termination
- Eye-contact monitoring
- Eye contact below 50% continuously for 3 seconds as one violation
- Multiple-proctoring-violation handling
- Browser-supported connected-device signals

Three actual proctoring violations terminate the interview. A tab-switch or refresh event can terminate an interview independently.

Connected-device detection is limited by browser capabilities and is not represented as complete physical hardware monitoring.

### 12. Coding Readiness
Coding Readiness includes a database-backed coding problem dataset with public and hidden test cases.

Current dataset characteristics include:
- 43 coding questions
- Public and hidden test cases
- Coverage across arrays, strings, searching and sorting, hashing, stacks and queues, linked lists, trees, recursion/backtracking, and dynamic programming
- Hidden test cases are not exposed through the student question API

The current development stage keeps the existing execution interface while the sandboxed execution layer is being integrated separately. Untrusted code is not intended to run directly inside the Node.js application process.

### 13. Aptitude Testing
Aptitude assessment supports quantitative, logical, and verbal question categories with session-based testing and scoring.

### 14. Interview Experience Bank
A searchable repository of interview experiences and preparation-oriented content helps students learn from previous interview patterns.

### 15. AI Career Roadmap
Gemini-powered roadmap generation provides personalized learning milestones based on a student's target role and current skill profile.

### 16. AI Career Mentor
The AI Mentor combines:
- Persistent conversation history
- Student memory
- Hybrid retrieval
- Grounded knowledge from the PlacementOS RAG knowledge base
- Gemini response generation

The mentor is designed to provide context-aware career assistance while reducing reliance on unsupported model-only answers.

---

## What Makes PlacementOS Different

PlacementOS is not limited to a job board, assessment tool, learning portal, or institutional dashboard.

Its core differentiation is the connected workflow:

```text
ASSESS
   |
   v
BUILD SKILL PROFILE
   |
   v
IDENTIFY SKILL GAPS
   |
   v
LEARN & PRACTICE
   |
   v
VERIFY EVIDENCE
   |
   v
MATCH OPPORTUNITIES
   |
   v
APPLY & SHORTLIST
   |
   v
TRACK PLACEMENT
```

The same platform connects the student journey with recruiter workflows and institution-level insights.

---

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- React Markdown
- MediaPipe Tasks Vision

### Backend
- Node.js
- Express.js
- TypeScript
- REST APIs

### Database and Storage
- MongoDB Atlas
- Mongoose
- MongoDB GridFS
- In-memory multipart handling for secure upload streaming

### AI
- Google GenAI SDK
- Gemini models
- Gemini embeddings
- Hybrid RAG retrieval
- AI Mentor
- AI Career Roadmap
- AI Mock Interview
- Resume and document analysis

### Security
- JWT
- bcryptjs
- Helmet
- CORS configuration
- Request validation
- Rate limiting
- Ownership and IDOR protection
- Mass-assignment protection

### Development and Deployment
- Git
- GitHub
- Postman
- VS Code
- Figma
- Vercel
- Render

---

## System Architecture

```text
                         USER PORTALS
     +--------------+--------------+--------------+--------------+
     |   STUDENT    |   INDUSTRY   |  ACADEMICIAN | INSTITUTION  |
     +--------------+--------------+--------------+--------------+
                                  |
                                  v
                     React + TypeScript Frontend
                                  |
                                  v
                       Node.js + Express Backend
               Authentication | RBAC | REST APIs | Validation
                                  |
        +-------------------------+--------------------------+
        |                         |                          |
        v                         v                          v
  Skill Engine             Placement Engine          Portfolio &
  Assessment               Role Match / Ranking       Verification
  Skill Profile             Recommendations            Evidence
  Gap Analysis              Applications
        |                         |                          |
        +-------------------------+--------------------------+
                                  |
                                  v
                            MongoDB Atlas
                    +-------------+-------------+
                    |                           |
                    v                           v
             Operational Data             RAG Knowledge
          Users / Skills / Jobs /         RAGKnowledge
          Applications / Portfolio        KnowledgeChunk
                    |                           |
                    |                           v
                    |                  Gemini Embeddings
                    |                           |
                    |                           v
                    |                   Hybrid Retrieval
                    |                Vector + Keyword Search
                    |                           |
                    +---------------------------+
                                                |
                                                v
                                           Gemini AI
                                                |
                                                v
                                    AI Mentor / AI Guidance
```

---

## RAG Architecture

PlacementOS uses a database-first RAG approach.

The canonical RAG knowledge source is maintained in MongoDB through the `RAGKnowledge` collection. Vectorized retrieval chunks are stored separately in `KnowledgeChunk`.

```text
RAG Dataset
    |
    v
RAGKnowledge
    |
    v
KnowledgeChunk
    |
    +---- Gemini Embeddings
    |
    v
Hybrid Retrieval
(Vector + Keyword)
    |
    +---- Student Memory
    |
    +---- Recent Conversation Context
    |
    v
Structured Gemini Prompt
    |
    v
AI Mentor Response
```

### RAG Knowledge Categories

The knowledge base is designed to contain curated information such as:
- Technical knowledge
- Interview preparation
- Interview experiences
- Career guidance
- Job-role knowledge
- Aptitude and reasoning
- Soft skills
- Project guidance
- Resume and portfolio guidance
- Learning and placement strategy

The source dataset is stored separately from private operational information.

### Private Context

The following remain private operational context rather than shared RAG corpus:
- Student memory
- Conversation history
- Student skill profile
- Resumes
- Certificates
- Applications
- Other ownership-protected records

### RAG Quality and Guardrails

The RAG implementation includes:
- Hybrid semantic and keyword retrieval
- Embedding-dimension validation
- Source and metadata filtering
- Context limits
- Prompt-injection guardrails
- Private-data isolation
- Retrieval evaluation
- Hit@K
- Precision@K
- MRR
- Recall where a defensible denominator is available

---

## Security Architecture

PlacementOS includes application-level security controls across authentication, authorization, document access, and data handling.

### Authentication
- JWT Bearer authentication
- Query-token authentication rejected
- Production JWT secret validation

### Authorization
- Role-based access control
- Student ownership checks
- Recruiter and verifier relationship checks
- Object-level authorization
- IDOR protection
- Verification-role enforcement

### Request Protection
- Explicit update-field allowlists
- Input validation
- Payload limits
- Authentication rate limiting
- Production CORS allowlisting

### File Protection
- MIME validation
- Binary magic-byte validation
- File-size limits
- Authenticated GridFS access
- Ownership and relationship checks

### Production Hardening
- Helmet security headers
- Safe production error responses
- Internal stack traces and storage/database details masked from clients

---

## AI Design Principles

PlacementOS separates deterministic business logic from generative AI.

### Deterministic Components
The following are handled through explicit, repeatable algorithms:
- Skill-gap classification
- Opportunity matching
- Recruiter candidate ranking
- Requirement consolidation
- Portfolio verification states
- Application states

### Generative AI Components
Gemini is used where contextual synthesis is appropriate:
- AI Career Mentor
- AI Career Roadmap
- AI Mock Interview
- Resume and document analysis
- Contextual career guidance

This separation makes the core matching and workflow decisions auditable and predictable.

---

## Local Setup

### Prerequisites

- Node.js 18 or higher
- npm
- MongoDB Atlas or a compatible MongoDB deployment
- Google Gemini API key

### 1. Install Dependencies

```bash
git clone <your-repository-url>
cd <project-directory>
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
APP_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
TPO_INVITE_CODE=your_secure_invite_code
MAX_FILE_SIZE_MB=10
FILE_STORAGE_MODE=gridfs
```

Use the project's `.env.example` as the authoritative list of environment variables required by the current codebase.

Never commit `.env`, API keys, passwords, JWT secrets, or other credentials.

### 3. Seed Data

Examples of available seed commands include:

```bash
npx tsx scripts/seedSkillQuestions.ts
npx tsx scripts/seedAptitudeQuestions.ts
npx tsx scripts/seedMentors.ts
```

For the RAG knowledge base:

```bash
npm run seed:rag
npm run ingest:knowledge
```

For the coding dataset:

```bash
npm run test:coding-dataset
npm run seed:coding
```

### 4. Run the Application

```bash
npm run dev
```

### 5. Production Build

```bash
npm run build
npm run start
```

---

## RAG Dataset Structure

The RAG source dataset is maintained as seed files under:

```text
data/
  rag/
    placementos_rag_dataset_batch1.json
    placementos_rag_dataset_batch2.json
```

The seeding pipeline discovers RAG dataset files dynamically so future batches can be added without changing the core ingestion architecture.

The database flow is:

```text
JSON Dataset
     |
     v
RAGKnowledge Collection
     |
     v
Embedding / Knowledge Ingestion
     |
     v
KnowledgeChunk Collection
     |
     v
Hybrid Retrieval
```

---

## Coding Dataset

The coding readiness dataset is database-backed rather than embedded in the production UI.

Current dataset coverage includes:
- Arrays
- Strings
- Searching and sorting
- Hashing
- Stack and queue
- Linked list
- Trees
- Recursion and backtracking
- Dynamic programming

Each coding problem can contain:
- Public test cases
- Hidden test cases
- Difficulty
- Category
- Constraints
- Problem statement
- Expected solution metadata

Hidden test cases are filtered from student-facing APIs.

---

## Testing and Quality

The project includes focused regression suites for important workflows and security boundaries.

Examples include:
- Role authorization tests
- Mass-assignment tests
- IDOR authorization tests
- Production security tests
- Final security regression tests
- Portfolio verification tests
- Mentorship workflow tests
- Learning program workflow tests
- RAG dataset validation
- Hybrid retrieval tests
- RAG guardrail tests
- RAG evaluation cases
- Coding dataset validation
- Coding API security tests
- Mock interview proctoring rule tests

Run the relevant scripts from the project's `package.json`.

---

## Project Structure

```text
PlacementOS/
|
├── routes/
|   ├── academician.ts
|   ├── aptitude.ts
|   ├── auth.ts
|   ├── authMiddleware.ts
|   ├── authRateLimiter.ts
|   ├── badges.ts
|   ├── certifications.ts
|   ├── errorHandler.ts
|   ├── experiences.ts
|   ├── files.ts
|   ├── geminiClient.ts
|   ├── interviews.ts
|   ├── mentor.ts
|   ├── mentorship.ts
|   ├── portfolio.ts
|   ├── recruiters.ts
|   ├── resume.ts
|   ├── roadmap.ts
|   ├── securityConfig.ts
|   ├── skills.ts
|   ├── students.ts
|   ├── tpo.ts
|   ├── verification.ts
|   └── ...
|
├── src/
|   ├── components/
|   ├── context/
|   ├── db/
|   ├── lib/
|   ├── models/
|   ├── services/
|   ├── types/
|   └── utils/
|
├── data/
|   └── rag/
|
├── scripts/
|   ├── seedSkillQuestions.ts
|   ├── seedAptitudeQuestions.ts
|   ├── seedMentors.ts
|   ├── seedRAGKnowledge.ts
|   ├── seedCodingQuestions.ts
|   ├── ingestKnowledgeBase.ts
|   ├── evaluate-rag-retrieval.ts
|   ├── test-rag-foundation.ts
|   ├── test-rag-dataset.ts
|   ├── test-rag-guardrails.ts
|   ├── test-hybrid-retrieval.ts
|   ├── test-portfolio-verification.ts
|   ├── test-mentorship-workflow.ts
|   ├── test-learning-program-workflow.ts
|   ├── test-role-authorization.ts
|   ├── test-mass-assignment.ts
|   ├── test-idor-authorization.ts
|   ├── test-production-security.ts
|   ├── test-final-security-regression.ts
|   ├── test-coding-dataset.ts
|   └── test-coding-api-security.ts
|
├── server.ts
├── package.json
├── vite.config.ts
└── README.md
```

---

## Development Status

PlacementOS is an active prototype developed for Smart India Hackathon 2026.

The current project includes:
- Multi-role portal architecture
- Technical and soft-skill assessment
- Centralized skill profiles
- Deterministic skill-gap analysis
- Student opportunity recommendations
- Recruiter candidate ranking
- Digital portfolio
- GitHub portfolio audit
- Persistent document storage
- Evidence-based portfolio verification
- Human mentor discovery and requests
- Industry learning programs
- AI Mentor with RAG and conversational memory
- RAG evaluation and guardrails
- AI mock interview proctoring safeguards
- Database-backed coding questions and public/hidden test cases

The coding execution provider is being integrated separately from the database-backed coding question and test-case layer.

---

## Repository Description

**Unified Academia-Industry platform connecting skill assessment, gap analysis, AI career guidance, verified portfolios, mentorship, opportunities, recruitment, and institutional placement analytics.**

---

## Team

**Team Name:** Code Pirates  
**Project:** PlacementOS  
**Hackathon:** Smart India Hackathon 2026

---

## Vision

PlacementOS aims to transform placement preparation from disconnected activities into a continuous skill-to-opportunity ecosystem where students can assess their capabilities, understand their gaps, improve through guided learning, build verified evidence, discover suitable opportunities, connect with mentors and industry, and move toward placement with stronger institutional support.

**PlacementOS — Connecting Skills to Opportunities**
