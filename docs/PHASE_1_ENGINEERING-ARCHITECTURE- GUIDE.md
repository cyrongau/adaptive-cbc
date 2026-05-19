# **(MVP IMPLEMENTATION)**

The goal of Phase 1 is:

# **prove the core educational intelligence workflow.**

NOT to build the full ecosystem.

---

# **PHASE 1 OBJECTIVES**

Build:

1. Student revision system  
2. Question bank engine  
3. OCR ingestion pipeline  
4. AI explanations  
5. Smart search  
6. Basic analytics

---

# **12\. Phase 1 Core Features**

## **Student Features**

* Registration/Login  
* Subject selection  
* Topic revision  
* Question practice  
* AI explanations  
* Performance history

---

## **Admin Features**

* Upload papers  
* OCR extraction review  
* Question approval  
* Curriculum tagging

---

## **System Features**

* Math rendering  
* Question storage  
* Semantic search  
* Difficulty tagging

---

# **13\. Phase 1 System Architecture**

Flutter App  
    ↓  
API Gateway (NestJS)  
    ↓  
\--------------------------------  
| Auth Service                |  
| Question Service            |  
| OCR Orchestrator            |  
| Search Service              |  
| Analytics Service           |  
\--------------------------------  
    ↓  
PostgreSQL  
Redis  
Elasticsearch  
S3 Storage  
---

# **14\. Phase 1 Backend Modules**

## **A. Authentication Module**

Supports:

* students,  
* admins,  
* teachers.

Features:

* JWT authentication,  
* refresh tokens,  
* role permissions.

---

## **B. Question Engine**

Stores:

* questions,  
* answers,  
* formulas,  
* explanations,  
* difficulty,  
* competency tags.

Supports:

* MCQ,  
* structured,  
* mathematical questions.

---

## **C. OCR Ingestion Pipeline**

Workflow:

Upload  
→ OCR  
→ AI Structuring  
→ Human Verification  
→ Question Bank  
---

## **D. Search Engine**

Capabilities:

* keyword search,  
* topic filtering,  
* difficulty filtering,  
* semantic similarity.

---

## **E. Analytics Engine**

Tracks:

* attempts,  
* scores,  
* weak topics,  
* revision history.

---

# **15\. Database Design (Phase 1\)**

Core entities:

Users  
Subjects  
Topics  
Questions  
QuestionVariants  
Answers  
Attempts  
PerformanceMetrics  
Uploads  
OCRResults  
---

# **16\. Mathematical Content Handling**

This is critical.

Mathematics must use:

* LaTeX storage,  
* structured rendering,  
* formula-aware OCR.

Recommended:

* MathJax (Web)  
* Flutter Math package  
* KaTeX

Example:

a+bc\\frac{a+b}{c}ca+b​

---

# **17\. OCR & AI Extraction Pipeline**

## **Recommended Tools**

| Function | Technology |
| ----- | ----- |
| OCR | Tesseract / Google Vision |
| Math OCR | MathPix |
| Layout Detection | LayoutParser |
| AI Structuring | OpenAI models |
| Diagram Detection | OpenCV |

---

# **18\. AI Capabilities in Phase 1**

## **Included**

* AI explanations  
* Similar question generation  
* Difficulty estimation  
* Topic classification

## **Deferred**

* voice tutoring,  
* live AI classes,  
* advanced adaptive engines.

---

# **19\. Recommended Repository Structure**

/apps  
  /mobile  
  /web-admin

/services  
  /api  
  /ocr-service  
  /search-service

/packages  
  /shared-types  
  /curriculum-engine

/docs  
---

# **20\. Suggested Development Timeline**

| Phase | Duration |
| ----- | ----- |
| Architecture & Schema | 2 weeks |
| Backend Foundation | 3 weeks |
| OCR Pipeline | 3 weeks |
| Flutter MVP | 4 weeks |
| Search & Analytics | 2 weeks |
| AI Integration | 3 weeks |
| Testing & Deployment | 2 weeks |

Estimated MVP:

# **4–5 months**

with a focused engineering team.

---

# **21\. Recommended Initial Team**

## **Essential**

* Backend Engineer  
* Flutter Engineer  
* AI/OCR Engineer  
* UI/UX Designer

## **Optional Early**

* Curriculum Specialist  
* Educational Content Moderator

---

# **22\. Recommended Initial Focus**

Start with:

# **Mathematics only.**

Why?

* Highest revision demand  
* Structured content  
* Easier AI evaluation  
* Strong engagement patterns

Then expand to:

* Sciences  
* English  
* Humanities

---

# **23\. Long-Term Expansion Opportunities**

Future expansion:

* Senior Secondary  
* School SaaS dashboards  
* National mock ecosystems  
* AI-generated assessments  
* Offline learning mode  
* Regional curriculum expansion

---

# **24\. Final Strategic Positioning**

This platform should position itself as:

# **“An AI-powered educational intelligence ecosystem that transforms static revision into adaptive personalized learning.”**

That is much stronger than:

“question bank app.”

Because that framing:

* attracts investors better,  
* scales commercially,  
* and creates long-term defensibility.

