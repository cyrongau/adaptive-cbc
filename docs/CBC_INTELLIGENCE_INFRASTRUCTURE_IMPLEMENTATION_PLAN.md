Question Author Studio — CBC Educational Intelligence Infrastructure
The Architectural Pivot
The platform is shifting from an OCR-centric automatic extraction system to a Human-Centered Authoring + AI-Assisted Intelligence platform.

IMPORTANT

This is a fundamental architectural shift. OCR is demoted from "core engine" to "optional drafting assistant." The Question Author Studio becomes the heart of the entire platform. Every downstream feature — adaptive learning, practice, exams, analytics, AI tutoring — depends on the structured educational content created here.

Current State (What Exists)
Component	Status	Notes
Question entity	⚠️ Partial	Has 6 question types, basic difficulty, but no strands, sub-strands, learning outcomes, Bloom's taxonomy, marks, solution_steps, or estimated_time
Subject entity	✅ Exists	Has name, code, applicableGrades
Topic entity	⚠️ Basic	Has name, code, subject relation — but no strands, sub-strands, or CBC curriculum hierarchy
PastPaper + PaperQuestion	✅ Exists	OCR-extracted questions tied to uploaded papers
Exam + ExamAttempt	✅ Exists	Can create exams from question IDs
PracticeSession + PracticeAnswer	✅ Exists	Practice sessions linked to questions
OCR Service (Python)	✅ Exists	Full pipeline: validation → splitting → preprocessing → OCR → segmentation → AI structuring
Governance / Quota	✅ Exists	Tiered quota enforcement, usage tracking
Frontend Library Page	✅ Exists	OCR upload, question review, moderation
Question Author Studio	❌ Missing	This is what we are building
CBC Curriculum Taxonomy	❌ Missing	No strands, sub-strands, learning outcomes, competencies in DB
AI Assistant Layer	❌ Missing	No question enhancement, solution generation, variation generation
Diagram Studio	❌ Missing	No AI-powered diagram cleanup/vectorization
Content Versioning	❌ Missing	No edit history or rollback
Target Architecture
Teacher / Tutor / Curriculum Designer
        │
        ▼
┌──────────────────────────────────┐
│    QUESTION AUTHOR STUDIO        │
│  ┌────────────────────────────┐  │
│  │ Structured Question Builder│  │  ← Human-first creation
│  │ (8+ question types)        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ AI Assistant Sidebar       │  │  ← Enhancement, not replacement
│  │ • Enhance wording          │  │
│  │ • Generate solution        │  │
│  │ • Map competencies         │  │
│  │ • Create variations        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ OCR Import (optional)      │  │  ← Drafting assistant only
│  │ • Upload → Draft → Review  │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Diagram & Media Studio     │  │  ← AI cleanup, vectorize
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Table & Data Builder       │  │  ← Statistical/graph questions
│  └────────────────────────────┘  │
└──────────────────────────────────┘
        │
        ▼ (Structured + moderated)
┌──────────────────────────────────┐
│        QUESTION BANK             │  ← Proprietary educational data
│   (Draft → Review → Published)   │
└──────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────┐
│  Adaptive Learning │ Practice    │
│  Exams │ Analytics │ AI Tutoring │
└──────────────────────────────────┘
User Review Required
WARNING

Breaking Changes to Question Entity: The existing Question entity will be significantly expanded. The current PaperQuestion entity (OCR-extracted) will become a staging entity that feeds into a Moderation Queue before becoming a formal Question.

IMPORTANT

New Database Tables: This plan introduces new tables for the CBC taxonomy (Strands, Sub-strands, Learning Outcomes) based on the KICD Curriculum Designs. We will map this structure starting from Grade 4 upwards.

IMPORTANT

Content Scope: Teachers will be able to select whether their authored content is Publicly Available (platform-wide) or Institution Scoped (private to their school).

Open Questions
(None currently - the architecture direction has been finalized based on the Education Intelligence Protocol.)

Proposed Changes
Phase 1 — CBC Curriculum Taxonomy Backbone
This is the foundation. Without a proper curriculum hierarchy, nothing can be properly tagged or aligned.

[NEW] 
cbc-taxonomy.entity.ts
Create a curriculum module with structured CBC entities:

typescript
// New entities:
@Entity('cbc_strands')
class CbcStrand {
  id: uuid
  name: string              // e.g., "Number", "Measurement"
  code: string              // e.g., "MATH-S1"
  subjectId: string         // → Subject
  applicableGrades: int[]   // [4, 5, 6]
  description?: string
  sortOrder: number
  isActive: boolean
}
@Entity('cbc_sub_strands')
class CbcSubStrand {
  id: uuid
  name: string              // e.g., "Whole Numbers"
  code: string              // e.g., "MATH-S1-SS1"
  strandId: string          // → CbcStrand
  applicableGrades: int[]
  description?: string
  sortOrder: number
  isActive: boolean
}
@Entity('cbc_learning_outcomes')
class CbcLearningOutcome {
  id: uuid
  description: string       // e.g., "Learner should be able to add 4-digit numbers"
  code: string              // e.g., "MATH-S1-SS1-LO1"
  subStrandId: string       // → CbcSubStrand
  grade: number
  competencies: string[]    // CBC core competencies
  sortOrder: number
}
@Entity('cbc_competencies')
class CbcCompetency {
  id: uuid
  name: string              // e.g., "Communication", "Critical Thinking"
  code: string
  category: enum            // CBC_CORE | SUBJECT_SPECIFIC
  description?: string
}
[NEW] 
curriculum.module.ts
[NEW] 
curriculum.service.ts
[NEW] 
curriculum.controller.ts
CRUD endpoints for taxonomy management. We will acquire the necessary CBC Curriculum data from the KICD official regular curriculum designs (https://kicd.ac.ke/cbc-materials/curriculum-designs/regular-curriculum-designs/) and write a seeding script to populate the Database with standard Subjects, Grades, Strands, Sub-strands, and Learning Outcomes.

Phase 2 — Structured Question Model Expansion
[MODIFY] 
question.entity.ts
Expand the Question entity to match the protocol's structured educational object:

diff
// New QuestionType values:
+ FILL_BLANK = 'fill_blank',
+ DIAGRAM_LABELING = 'diagram_labeling',
+ PRACTICAL = 'practical',
+ COMPREHENSION = 'comprehension',
+ TABLE_INTERPRETATION = 'table_interpretation',
+ GRAPH_ANALYSIS = 'graph_analysis',
// New QuestionStatus values:
+ DRAFT = 'draft',
+ PENDING_REVIEW = 'pending_review',
+ APPROVED = 'approved',
+ FLAGGED = 'flagged',
// New columns:
+ strandId: string              // → CbcStrand
+ subStrandId: string           // → CbcSubStrand
+ learningOutcomeId: string     // → CbcLearningOutcome
+ marks: number                 // Point value
+ estimatedTimeSeconds: number  // Expected solving time
+ bloomsTaxonomy: enum          // REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE
+ solutionSteps: jsonb          // [{step: 1, text: "...", media?: "..."}]
+ questionMedia: jsonb          // [{type: 'image'|'diagram'|'table', url, alt}]
+ tableData: jsonb              // Structured table for data questions
+ rawData: jsonb                // Raw dataset for statistical questions
+ sourceType: enum              // MANUAL | OCR_IMPORTED | AI_GENERATED | CLONED
+ sourceId: string              // Original question ID if cloned/imported
+ version: number               // Auto-incrementing version
+ scope: enum                   // PUBLIC | INSTITUTION
+ institutionId: string         // NULL if scope is PUBLIC
+ moderationStatus: enum        // DRAFT | PENDING | APPROVED | PUBLISHED | FLAGGED | ARCHIVED
+ moderatedBy: string
+ moderatedAt: timestamp
+ moderationNotes: string
+ isAiGenerated: boolean        // Flag for AI-generated content
+ aiGenerationModel: string     // Which model generated it
[NEW] 
question-version.entity.ts
typescript
@Entity('question_versions')
class QuestionVersion {
  id: uuid
  questionId: string        // → Question
  version: number
  snapshot: jsonb            // Full question state at this version
  changedBy: string
  changeReason?: string
  createdAt: timestamp
}
[MODIFY] 
questions.service.ts
Add createStructured() method that accepts the full protocol schema
Add updateWithVersioning() that creates a version snapshot before updating
Add findByCurriculum() that filters by strand → sub-strand → learning outcome
Add changeStatus() for moderation workflow transitions
Add cloneQuestion() for creating variations
Add search by Bloom's taxonomy level, marks range, estimated time
[MODIFY] 
questions.controller.ts
Add POST /questions/structured — create from studio
Add GET /questions/curriculum-tree — hierarchical browse
Add PUT /questions/:id/status — moderation state changes
Add GET /questions/:id/versions — version history
Add POST /questions/:id/clone — clone for variations
Phase 3 — Question Author Studio Frontend
This is the core UI — the professional content creation workspace.

[NEW] 
page.tsx
Question Author Studio Dashboard — overview of authored questions, stats, quick-create.

[NEW] 
page.tsx
Multi-Step Question Creation Wizard:

*   **Scope Selection:** Toggle between `Publicly Available` and `Institution Scoped`.
*   **Math Editor:** Integration of **MathLive** for intuitive WYSIWYG LaTeX math editing for equations and formulas.
*   **Curriculum Mapping:** Cascading dropdowns (Subject → Grade → Strand → Sub-strand → Outcome).
*   **AI Side Panel:** Context-aware assistant to rewrite, generate distractors, and map difficulty.
  → Media upload (images, diagrams)
  → Type-specific inputs:
    • MCQ: Option builder with correct answer toggle
    • Fill-blank: Blank position marker
    • Matching: Left/right column pairs
    • True/False: Statement + toggle
    • Table: Interactive table builder
    • Graph: Raw data input + chart preview
    • Diagram labeling: Image + label overlay
Step 3: Solution & Explanation
  → Correct answer (auto-filled for MCQ)
  → Step-by-step solution builder
  → Explanation rich text
  → Marking scheme
  → Hints (optional)
Step 4: Classification & Metadata
  → Difficulty (Easy/Medium/Hard)
  → Marks allocation
  → Estimated time
  → Bloom's taxonomy level (with helper tooltips)
  → Competency tags (from CBC taxonomy, multi-select)
  → AI-assisted auto-classification (optional button)
Step 5: Review & Submit
  → Full question preview (student view)
  → Validation warnings
  → Save as Draft / Submit for Review
[NEW] 
page.tsx
Question Editor — edit existing questions with version tracking.

[NEW] 
page.tsx
OCR Import Page — moved from library page, clearly labeled as "Import from Scan (Draft)".

Phase 4 — AI Assistant Layer
NOTE

The AI assistant operates on small, focused tasks — never full document reasoning. Each AI feature is a discrete, cacheable operation.

[NEW] 
ai-assistant.service.ts
typescript
class AIAssistantService {
  // A. Question Enhancement
  async enhanceWording(questionText: string, targetGrade: number): Promise<string>
  async simplifyLanguage(questionText: string, targetGrade: number): Promise<string>
  async alignWithCBC(questionText: string, strand: string): Promise<string>
  // B. Solution Generation
  async generateSolution(question: Question): Promise<SolutionSteps[]>
  async generateExplanation(question: Question): Promise<string>
  async generateMarkingScheme(question: Question): Promise<string>
  async generateHints(question: Question, count: number): Promise<string[]>
  // C. Competency Mapping
  async suggestCurriculum(questionText: string, subject: string, grade: number):
    Promise<{strand, subStrand, learningOutcome, bloomsLevel, competencies}>
  // D. Variation Generator
  async generateVariation(question: Question, difficultyShift: 'easier'|'harder'|'same'):
    Promise<Partial<Question>>
  async generateRandomizedValues(question: Question): Promise<Partial<Question>>
}
Each of these methods:

Calls OpenRouter with a focused, bounded prompt (< 500 tokens input)
Uses tiered models (small for classification, medium for explanations)
Caches results in Redis with question content hash as key
Returns structured JSON, never raw text
[NEW] 
ai-assistant.controller.ts
POST /questions/ai/enhance — improve wording
POST /questions/ai/solve — generate solution
POST /questions/ai/classify — suggest curriculum mapping
POST /questions/ai/variations — generate variants
All endpoints are quota-governed under GovernanceServiceType.AI_EXPLANATION
Phase 5 — OCR Demotion to Drafting Assistant
[MODIFY] 
page.tsx
Remove OCR as the primary action from the library page
Keep "Upload Resource" for document library (notes, past papers as PDFs)
Move "Scan Document" to the Author Studio's import page
[MODIFY] 
page.tsx
OCR import workflow becomes:

Upload scan → OCR extracts "best effort" draft
Each extracted question populates the Question Builder form in draft state
Teacher must review and edit each question individually
Teacher clicks "Confirm & Save" which creates a Question with sourceType: OCR_IMPORTED
All questions enter moderation pipeline as PENDING_REVIEW
IMPORTANT

The critical design change: OCR output never goes directly into the published question bank. It always passes through the structured builder form for human verification.

Existing OCR Service — No changes needed
The Python OCR service pipeline remains intact. Only the frontend workflow and backend save logic change to enforce the human-review requirement.

Phase 6 — Diagram & Illustration Studio
[NEW] 
page.tsx
Teacher uploads rough sketch / phone photo / hand-drawn figure
AI cleans, redraws, vectorizes using image generation API
Teacher reviews generated diagram
Save to media library for use in questions
Subject-specific templates (biology cell, physics circuits, geometry shapes)
[NEW] 
diagram.service.ts
POST /questions/diagrams/enhance — upload image → AI cleanup → return enhanced version
POST /questions/diagrams/vectorize — convert raster → SVG
POST /questions/diagrams/label — AI auto-label diagram elements
All operations are asynchronous (queue-based), cached permanently
Phase 7 — Content Moderation & Quality Pipeline
[MODIFY] 
questions.service.ts
Moderation workflow:

DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED
              ↓                ↓
          FLAGGED          ARCHIVED
Teachers create in DRAFT
Submit moves to PENDING_REVIEW
Admins / Senior Teachers approve → APPROVED
Publishing makes available for practice/exams → PUBLISHED
Flagging returns to author with notes → FLAGGED
[NEW] 
moderation page
Admin moderation dashboard:

Queue of questions pending review
Side-by-side view: question preview + curriculum alignment check
Approve / Flag / Reject actions with notes
AI-assisted quality scoring (grammar, difficulty consistency, curriculum alignment)
Phase 8 — Analytics & Intelligence Layer
[MODIFY] 
analytics.controller.ts
New analytics endpoints:

Content creation metrics (questions per teacher, per subject, per week)
Curriculum coverage heatmap (which strands/sub-strands have gaps)
Question quality distribution (difficulty spread, Bloom's taxonomy spread)
AI usage analytics (enhancement calls, solution generations, cache hit rates)
File Structure Summary
backend/src/modules/
├── curriculum/                    [NEW — Phase 1]
│   ├── entities/
│   │   └── cbc-taxonomy.entity.ts
│   ├── curriculum.module.ts
│   ├── curriculum.service.ts
│   └── curriculum.controller.ts
├── questions/
│   ├── entities/
│   │   ├── question.entity.ts     [MODIFY — Phase 2]
│   │   └── question-version.entity.ts  [NEW — Phase 2]
│   ├── services/
│   │   ├── ai-assistant.service.ts    [NEW — Phase 4]
│   │   └── diagram.service.ts         [NEW — Phase 6]
│   ├── controllers/
│   │   └── ai-assistant.controller.ts [NEW — Phase 4]
│   ├── questions.service.ts       [MODIFY — Phase 2, 7]
│   └── questions.controller.ts    [MODIFY — Phase 2]
frontend/src/app/(dashboard)/
├── author-studio/                 [NEW — Phase 3]
│   ├── page.tsx                   (Dashboard)
│   ├── create/page.tsx            (Question Builder Wizard)
│   ├── [id]/page.tsx              (Question Editor)
│   ├── import/page.tsx            (OCR Import — Phase 5)
│   ├── diagrams/page.tsx          (Diagram Studio — Phase 6)
│   └── moderation/page.tsx        (Admin Moderation — Phase 7)
├── library/
│   └── page.tsx                   [MODIFY — Phase 5: remove OCR prominence]
Verification Plan
Automated Tests
bash
# Phase 1: Verify curriculum taxonomy CRUD
curl -X POST /api/curriculum/strands -d '{"name":"Number","subjectId":"...","applicableGrades":[4,5,6]}'
curl -X GET /api/curriculum/tree?subjectId=...&grade=5
# Phase 2: Verify structured question creation
curl -X POST /api/questions/structured -d '{...full protocol schema...}'
curl -X GET /api/questions/:id/versions
curl -X PUT /api/questions/:id/status -d '{"status":"pending_review"}'
# Phase 4: Verify AI assistant
curl -X POST /api/questions/ai/classify -d '{"questionText":"What is 2+2?","subject":"Mathematics","grade":4}'
Manual Verification
Author Studio Wizard: Create a question through all 5 steps, verify it saves correctly with full curriculum mapping
OCR Import Flow: Upload a document, verify extracted questions populate as editable drafts in the builder
Moderation Pipeline: Submit a question → verify it appears in admin queue → approve → verify it's published
AI Assistant: Use "Enhance" button on a rough question → verify improved wording → verify it's cached on repeat
Version History: Edit a question → verify previous version is preserved → rollback and verify
Implementation Priority & Estimates
Phase	Description	Priority	Estimated Effort
Phase 1	CBC Curriculum Taxonomy	🔴 Critical	2-3 days
Phase 2	Question Model Expansion	🔴 Critical	2-3 days
Phase 3	Author Studio Frontend	🔴 Critical	5-7 days
Phase 4	AI Assistant Layer	🟡 High	3-4 days
Phase 5	OCR Demotion	🟡 High	1-2 days
Phase 6	Diagram Studio	🟢 Medium	3-4 days
Phase 7	Content Moderation	🟡 High	2-3 days
Phase 8	Analytics & Intelligence	🟢 Medium	2-3 days
Total estimated effort: ~20-29 working days

Phases 1-3 form the MVP and should be completed first as a block.