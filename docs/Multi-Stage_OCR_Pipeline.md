This is the correct architecture.

PROPER EDUCATIONAL OCR PIPELINE
1. Upload
        ↓
2. File Validation
        ↓
3. Page Splitting
        ↓
4. Image Preprocessing
        ↓
5. OCR Extraction
        ↓
6. Layout Detection
        ↓
7. Question Segmentation
        ↓
8. Math Recognition
        ↓
9. AI Structuring
        ↓
10. Human Moderation
        ↓
11. Question Bank Storage

Each stage must:

succeed independently,
be retryable,
and have status tracking.
4. Your Current “30% Freeze” Problem

That usually means:

the frontend progress is fake/static.

Likely:

10% Upload
30% Processing
(waiting forever)

Meanwhile backend:

partially succeeded,
stored moderation record,
but extraction pipeline crashed silently.

This is VERY common.

5. The Correct OCR Architecture

STOP using OpenRouter as the direct OCR engine.

OpenRouter is good for:

reasoning,
transformation,
summarization,
semantic extraction.

NOT primary OCR.

6. Recommended OCR Stack For YOUR Project

You need:

hybrid OCR architecture.
A. Primary OCR Layer

Use:

Google Cloud Vision OCR

OR
Azure Document Intelligence

Why?
Because:

educational documents are layout-heavy,
and these systems handle:
tables,
blocks,
structure,
coordinates,
scanned quality.

far better.

B. Mathematical OCR Layer

For formulas:

Mathpix

This is extremely important.

General OCR fails badly on:

fractions,
roots,
equations,
geometry notation.

Mathpix converts:

√(a²+b²)

into:

\sqrt{a^2+b^2}

That becomes renderable and searchable.

C. AI Structuring Layer

THIS is where OpenRouter should come in.

NOT raw OCR.

Instead:
OCR extracts:

{
  "text": "...",
  "layout": "...",
  "blocks": [...]
}

Then AI transforms it into:

{
  "question_type": "mcq",
  "topic": "place value",
  "options": [...],
  "answer": "B"
}

This is the correct role for LLMs.

7. Your Pipeline Needs Job Queues

Critical.

OCR is:

asynchronous work.

Never process synchronously inside request lifecycle.

CORRECT FLOW
Upload
   ↓
Create OCR Job
   ↓
Queue Worker Picks Job
   ↓
OCR Processing
   ↓
AI Structuring
   ↓
Status Updates
   ↓
Moderation Queue
8. Recommended Queue Stack

Since you use NestJS:

Use:

BullMQ
Redis

Architecture:

API
 ↓
Queue
 ↓
Workers
 ↓
OCR Pipeline

This solves:

timeout issues,
retries,
concurrency,
failure recovery.
9. You Need Processing States

VERY important.

Your current “30%” indicates missing state management.

Recommended OCR States
UPLOADED
PREPROCESSING
OCR_RUNNING
LAYOUT_ANALYSIS
QUESTION_SEGMENTATION
AI_STRUCTURING
AWAITING_MODERATION
COMPLETED
FAILED
10. Your Frontend Must Reflect REAL Backend Progress

Do NOT fake percentages.

Instead:
poll backend:

GET /ocr-jobs/:id/status

Return:

{
  "stage": "QUESTION_SEGMENTATION",
  "progress": 65
}

Now:
frontend becomes accurate.

11. The Missing Preview Problem

You mentioned:

“there's no preview”

That means:

extracted assets are not being persisted.

You should save:

page images,
extracted blocks,
segmented questions,
detected diagrams.
Recommended Storage Structure
/uploads/originals/
/uploads/pages/
/uploads/questions/
/uploads/diagrams/
/uploads/ocr-json/

This becomes VERY useful later.

12. IMPORTANT:
DO NOT OCR ENTIRE PDFs AT ONCE

Huge mistake.

Instead:

Correct Strategy
PDF
 ↓
Split Into Pages
 ↓
Process Pages Independently

Benefits:

parallel processing,
retries,
fault isolation,
scalability.
13. Educational Documents Need Layout Detection

This is critical.

A test paper is NOT plain text.

You must detect:

question boundaries,
option alignment,
numbering,
diagrams,
tables,
marks allocation.
Recommended Tools

Use:

LayoutParser
DocTR
Detectron2

These are MUCH better for:

document structure understanding.
14. Your AI Prompting Is Probably Wrong

Another likely issue.

If you send:

"Extract all questions from this paper"

you get unstable results.

Instead:

structured extraction prompts.

Example:

{
  "task": "Extract MCQ questions",
  "rules": [
    "Detect numbering",
    "Extract options",
    "Ignore headers",
    "Preserve math notation"
  ]
}

Much more reliable.

15. HUMAN-IN-THE-LOOP MODERATION IS ESSENTIAL

Do NOT trust fully automated extraction.

Your moderation UI should allow:

correction,
re-tagging,
question splitting,
formula correction,
topic assignment.

Your AI should:

assist moderators,

not replace them.

16. Recommended Educational OCR Microservice

You should separate this ENTIRE system.

Create:

/services/ocr-service

Written in:

Python

Why?
Because:

OCR ecosystem is Python-dominant,
AI tooling is stronger,
document processing libraries are mature.
17. Recommended OCR Service Architecture
FastAPI
   ↓
Celery Workers
   ↓
Redis Queue
   ↓
OCR Engines
   ↓
AI Structuring
   ↓
PostgreSQL
18. BEST IMPLEMENTATION STRATEGY FOR YOU

This is what I would do.

MVP OCR FLOW
STEP 1

Upload paper.

STEP 2

Split PDF into pages.

STEP 3

Generate image previews.

STEP 4

OCR each page independently.

STEP 5

Extract raw text.

STEP 6

Detect question blocks.

STEP 7

Send ONLY question blocks to AI.

STEP 8

Store structured JSON.

STEP 9

Moderator verifies extraction.

19. Your MOST Important Long-Term Asset

Your OCR system is not just ingestion.

It becomes:

educational data infrastructure.

Over time you accumulate:

structured curriculum content,
question intelligence,
educational embeddings,
topic relationships,
competency mappings.

That becomes:

the backbone of the platform.

So investing properly here is absolutely worth it.

20. My Direct Recommendation

For your exact platform:

Component	Recommendation
OCR Engine	Google Vision
Math OCR	Mathpix
AI Structuring	OpenRouter/OpenAI
Queue System	BullMQ + Redis
OCR Service	Python FastAPI
Storage	S3/MinIO
Layout Detection	LayoutParser
Frontend Status	Real-time job polling
Moderation	Human-assisted
21. Final Critical Advice

Do NOT optimize for:

“fully automated AI extraction.”

Optimize for:

reliable semi-automated educational digitization.

Because educational documents are:

messy,
inconsistent,
low-quality,
handwritten sometimes,
mathematically complex,
and visually irregular.

Your goal is:

scalable reliability.

Not flashy automation.

That mindset will save you months of pain later.