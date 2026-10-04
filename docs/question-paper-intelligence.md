The better solution for Adaptive CBC is to standardize the representation of a question, while allowing the scanning engine to recognize many different paper layouts.

What you are describing is essentially a Question Paper Understanding Engine sitting between OCR/document vision and the Question Author Studio.

For a better understanding of this document please refer to docs\Gold-standard extraction test.jpeg

1. The fundamental shift

Do not build the system around:

"All examination papers must look like this."

Build it around:

"Any examination paper can be decomposed into a known set of structural elements."

For example:

DOCUMENT
 ├── Page
 │    ├── Header
 │    ├── Instruction
 │    ├── Question
 │    │    ├── Question Number
 │    │    ├── Stem
 │    │    ├── Figure
 │    │    ├── Formula
 │    │    ├── Table
 │    │    ├── Answer Choices
 │    │    └── Working Area
 │    └── Footer


Then the system maps whatever it sees on the paper into this canonical question model.

That means these can all become the same digital question structure:

A. ...
B. ...
C. ...
D. ...

or:

A. ...   B. ...   C. ...   D. ...

or:

(a) ...
(b) ...
(c) ...

or:

Explain...
Calculate...
Draw...
Show that...

without requiring the original papers to have the same formatting.

2. Your attached paper is actually a perfect test case

There are several different structures on this single page.

Question 20

It contains:

Question number
        ↓
Text stem
        ↓
Mathematical diagram
        ↓
Question
        ↓
Inline/column answer choices

The diagram contains:

triangles
rectangle
dimension labels
right-angle symbols
3 cm
8 cm
5 cm
6 cm

So this is not merely OCR.

The system needs to understand:

"This region is a mathematical figure belonging to Question 20."

Question 21

Contains:

Question stem
     ↓
Mathematical expression
     ↓
Multiple choices

And the mathematical expression contains:

6 1/4 cm
while the choices contain fractions such as:
625/16
39 1/16
36 2/16
25/4

A normal OCR pipeline could easily turn these into bad plain text.

Your digital representation should instead be capable of storing:

{
  "type": "math",
  "source": "6 1/4",
  "latex": "6\\frac{1}{4}",
  "mathml": "..."
}

Question 22

This is particularly important.

The question contains a photographic/graphical object.

Question 22

This is particularly important.

The question contains a photographic/graphical object.

Question
   ↓
Image/Figure
   ↓
Question text
   ↓
Choices

The object should not be OCR'd into oblivion.

It should become something like:
{
  "type": "figure",
  "asset": "question-22-figure.png",
  "role": "question_illustration"
}

Question 23

This is probably the easiest:

Question
     ↓
Inline text
     ↓
A. 32%      B. 70%
C. 65%      D. 68%

Question 24

This demonstrates mathematical/symbolic content:

Tom had x sheep...

and:

A. x - 6 < 36
B. x + 6 = 36
C. x - 6 = 36
D. x - 6 > 36

The <, =, > symbols need to be preserved as mathematical tokens.

Question 25

This is another mixed question:

Question
   ↓
Instruction
   ↓
Line diagram
   ↓
Instruction
   ↓
Question
   ↓
Multiple choices

So the system needs to understand that the line diagram belongs to Question 25.

3. I would introduce a "Question Paper Grammar"

This is probably the most important architectural concept for what you're building.

Instead of creating hundreds of rigid templates, create a Question Paper Grammar / Layout Ontology.

Think of it as the vocabulary the AI uses to describe examination papers.

For example:

DOCUMENT
PAGE
SECTION
QUESTION
SUBQUESTION
STEM
INSTRUCTION
TEXT_BLOCK
MATH_BLOCK
FIGURE
TABLE
DIAGRAM
FORMULA
ANSWER_CHOICES
ANSWER_CHOICE
WORKING_AREA
HEADER
FOOTER
PAGE_NUMBER
WATERMARK
MARK_ALLOCATION

Then add attributes.

For example:

ANSWER_CHOICES
    orientation:
        horizontal
        vertical
        grid

    style:
        lettered
        numbered
        unlabelled

    layout:
        inline
        columns
        rows

This allows you to recognize:

Inline MCQ

A. 10   B. 20   C. 30   D. 40

as:

{
  "type": "multiple_choice",
  "layout": "inline"
}

while:

Vertical MCQ

A. 10
B. 20
C. 30
D. 40

becomes:

{
  "type": "multiple_choice",
  "layout": "vertical"
}

And: 

Two-column MCQ

A. 10              B. 20

C. 30              D. 40

becomes:

{
  "type": "multiple_choice",
  "layout": "grid",
  "columns": 2
}

The question itself is the same regardless of presentation.

4. The system should have two different concepts

This distinction will make your architecture much stronger.

A. Physical representation

What the paper actually looks like.

x = 4

A. 10       B. 12
C. 14       D. 16

The scanner needs to understand:

coordinates
columns
bounding boxes
lines
fonts
images
spatial relationships
reading order

B. Semantic representation

What the question actually means.

{
  "question_type": "multiple_choice",
  "stem": "If x = 4, what is ...?",
  "choices": [
    {"label": "A", "content": "10"},
    {"label": "B", "content": "12"},
    {"label": "C", "content": "14"},
    {"label": "D", "content": "16"}
  ]
}

The first layer is layout intelligence.

The second is question intelligence.

This separation is critical.

5. I would make the pipeline look like this

                 SCANNED PAPER
                       │
                       ▼
             ┌───────────────────┐
             │ Image Preprocessor│
             └─────────┬─────────┘
                       │
             perspective correction
             rotation/de-skew
             de-warping
             noise removal
             contrast enhancement
                       │
                       ▼
             ┌───────────────────┐
             │ Page Understanding│
             │      Engine       │
             └─────────┬─────────┘
                       │
             ┌─────────┴──────────┐
             ▼                    ▼
       Layout Analysis       Visual Analysis
             │                    │
             │                    ├── figures
             │                    ├── diagrams
             │                    ├── tables
             │                    └── handwriting
             │
             ├── columns
             ├── question regions
             ├── answer regions
             ├── headers
             ├── footers
             └── working areas
                       │
                       ▼
             ┌───────────────────┐
             │ Question Boundary │
             │     Detection     │
             └─────────┬─────────┘
                       │
              Q20 │ Q21 │ Q22 │ ...
                       │
                       ▼
             ┌───────────────────┐
             │ Selective OCR /   │
             │ Math Recognition  │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ Question Semantic │
             │   Classification  │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ Canonical Question│
             │       Model       │
             └─────────┬─────────┘
                       │
                       ▼
             ┌───────────────────┐
             │ Question Author   │
             │      Studio       │
             └─────────┬─────────┘
                       │
                HUMAN VALIDATION
                       │
                       ▼
             ┌───────────────────┐
             │ Question Library  │
             └───────────────────┘

6. And importantly: don't OCR the entire page

This ties directly into the OCR-cost strategy we discussed for Adaptive CBC.

Your first operation shouldn't be:

Send entire page to Google Cloud Vision OCR.

Instead:

Stage 1 — Vision/layout detection

Determine:

┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Q20                                 │
│ ┌──────────────┐                    │
│ │    FIGURE    │                    │
│ └──────────────┘                    │
│ Question text                       │
│ A...       B...                     │
│ C...       D...                     │
├─────────────────────────────────────┤
│ Q21                                 │
│ Question text                       │
│ A...       B...                     │
│ C...       D...                     │
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘

Only after identifying the regions do you decide what requires OCR.

7. Selective OCR becomes extremely powerful

For example, Question 22's image doesn't need OCR.

Question 20's diagram needs visual extraction, not normal OCR.

Question 21's mathematical expression needs math recognition.

Question 23 needs ordinary OCR.

Question 24 needs:

OCR + mathematical symbol recognition

Question 25 needs:

OCR + diagram extraction

So your engine can make decisions like:

Region 1 → TEXT → OCR
Region 2 → FIGURE → crop
Region 3 → MATH → Math OCR
Region 4 → OPTIONS → OCR + structure
Region 5 → WORKING AREA → ignore

This is much cheaper and more accurate than treating the entire page as text.

8. You need a "Region Classifier"

I'd give every detected page region a classification.

Something like:

enum RegionType {
  header,
  footer,
  question,
  questionNumber,
  instruction,
  text,
  mathematics,
  figure,
  diagram,
  table,
  answerChoices,
  answerChoice,
  workingArea,
  pageNumber,
  watermark,
  handwriting,
  unknown,
}

And each region gets coordinates:

{
  "type": "figure",
  "bbox": {
    "x": 182,
    "y": 124,
    "width": 410,
    "height": 175
  },
  "confidence": 0.97
}

Now your system knows where something is, not merely what words it contains.

9. Question boundary detection is the real heart of the system

This is actually more important than OCR.

You want to answer:

"Where does Question 20 start and where does Question 20 end?"

For example:

20. Creative Arts and Sports learners...
       │
       ├── diagram
       │
       ├── What is the total area...
       │
       ├── A. 72cm²
       ├── B. 96cm²
       ├── C. 48cm²
       └── D. 66cm²

21. The sides of a square...

The engine learns that:

20

starts a question and:

21

starts another.

But don't rely only on sequential numbering.

Some papers will contain:

SECTION A

1.
2.
3.

SECTION B

1(a)
1(b)
1(c)

Others:

Question 1

(i)
(ii)
(iii)

Others:

Q1.

Others:

1)

So question-number detection should be one signal among several, not the entire algorithm.

10. Create a "Paper Layout Profile"

This is where your idea of a mapped/stored format becomes very useful.

Instead of storing one rigid template, store a layout profile.

For example:

{
  "profile": "kenya_primary_exam_v1",

  "page": {
    "orientation": "portrait"
  },

  "regions": {
    "header": true,
    "footer": true,
    "working_area": true
  },

  "question": {
    "number_patterns": [
      "20.",
      "21.",
      "22."
    ],

    "reading_order": "top_to_bottom"
  },

  "choices": {
    "labels": ["A", "B", "C", "D"],
    "supported_layouts": [
      "inline",
      "2_column",
      "vertical"
    ]
  }
}

But don't make this mandatory.

The AI can use it as a prior.

11. Think of the profiles as "recognition hints"

You could have:

Layout Profiles
│
├── Kenya Primary
├── Kenya Junior Secondary
├── KCSE
├── IGCSE
├── International GCSE
├── School Internal Examination
├── Teacher Generated Test
├── University Examination
└── Unknown / Generic

But an unknown paper can still be processed.

The profile simply tells the engine:

"These patterns are more likely."

It shouldn't say:

"Anything different is invalid."

12. The canonical question model

This is the part I would spend serious architectural effort on.

Something like:

{
  "id": "question_uuid",

  "source": {
    "document_id": "...",
    "page": 5,
    "question_number": "20"
  },

  "subject": "Mathematics",

  "grade": "Grade 6",

  "question_type": "multiple_choice",

  "content": [
    {
      "type": "text",
      "value": "Creative Arts and Sports learners drew a pattern..."
    },
    {
      "type": "figure",
      "asset_id": "figure_uuid"
    },
    {
      "type": "text",
      "value": "What is the total area of the pattern?"
    }
  ],

  "choices": [
    {
      "label": "A",
      "content": "72 cm²"
    },
    {
      "label": "B",
      "content": "96 cm²"
    },
    {
      "label": "C",
      "content": "48 cm²"
    },
    {
      "label": "D",
      "content": "66 cm²"
    }
  ],

  "marks": null,

  "topic": null,

  "subtopic": null,

  "difficulty": null,

  "learning_outcome": null,

  "source_confidence": 0.94,

  "validation_status": "needs_review"
}

Notice something important:

The original physical layout is no longer important.

You can later render that question into:

your Adaptive CBC mobile UI
a web test
a PDF
a printable exam
a quiz
a revision exercise
a flashcard
an AI-generated variation
13. Don't flatten everything into plain text

This is another major architectural decision.

Your question content should be a rich document tree.

For example:

{
  "content": [
    {
      "type": "paragraph",
      "children": [
        {
          "type": "text",
          "value": "The sides of a square measures "
        },
        {
          "type": "math",
          "latex": "6\\frac{1}{4}"
        },
        {
          "type": "text",
          "value": " cm. What is its area?"
        }
      ]
    }
  ]
}

This gives you future flexibility.

14. Figures should be first-class objects

Don't simply store:

[IMAGE]

Store:

{
  "type": "figure",
  "id": "fig_abc",
  "asset": "...",
  "figure_type": "geometry_diagram",
  "question_id": "...",
  "bbox": {},
  "extraction_method": "cropped_from_source",
  "confidence": 0.98
}

And potentially:

{
  "semantic_elements": [
    {
      "type": "line",
      "label": "AB"
    },
    {
      "type": "dimension",
      "value": "8 cm"
    },
    {
      "type": "right_angle"
    }
  ]
}

You don't need to reconstruct every diagram into SVG on day one.

Preserve the original figure first.

Later you can build diagram understanding/reconstruction.

15. Formulae deserve their own representation

For mathematics, I'd support:

plain text
LaTeX
MathML
rendered image

For example:

{
  "type": "math",
  "source": "25/4",
  "latex": "\\frac{25}{4}",
  "display_mode": false
}

This becomes extremely useful when Adaptive CBC eventually generates new questions.

16. Multiple-choice recognition should be its own subsystem

I would explicitly create an:

MCQ Structure Detector

It recognizes:

Pattern A

A. xxx
B. xxx
C. xxx
D. xxx

Pattern B

A. xxx     B. xxx
C. xxx     D. xxx

Pattern C

A. xxx   B. xxx   C. xxx   D. xxx

Pattern D

(a) xxx
(b) xxx
(c) xxx
(d) xxx

Pattern E

1. xxx
2. xxx
3. xxx
4. xxx

And importantly:

Do not determine choices purely by proximity.

Combine:

label pattern
+
spatial alignment
+
font/style similarity
+
baseline alignment
+
language model
+
question context

That makes the detection much more robust.

17. Your system should also recognize "negative space"

This is surprisingly important.

Look at the image you supplied.

The right-hand side says:

WORKING AREA

That should not become part of Question 20–25.

Likewise, there are handwritten calculations.

Your system needs to distinguish:

Printed content

from:

Student handwriting

and:

Paper/background

This is why a pure OCR approach will struggle.

Your document vision layer should classify:

PRINTED_TEXT
HANDWRITING
FIGURE
PAPER_ARTIFACT
TABLE
QUESTION
WORKING_AREA

This would also allow you eventually to process completed examination scripts, not just blank question papers.

18. I would introduce confidence at every level

For example:

Question detection       99%
Text OCR                 97%
Figure detection         99%
MCQ detection            96%
Math recognition         84%
Topic classification     91%

Then calculate an overall confidence.

For example:

Question 21
──────────────────────────
Question boundary   99%
Text                98%
Math                86%
Choices             99%
──────────────────────────
Overall             94%

Anything below your threshold gets sent to the Question Author Studio.

19. This makes the Question Author Studio much more powerful

Instead of the Author Studio simply being:

"Edit OCR text."

it becomes:

Question Author Studio

SOURCE PAPER
      │
      ▼
AI EXTRACTION
      │
      ▼
STRUCTURED QUESTION
      │
      ▼
AUTHOR REVIEW

The reviewer sees something like:

┌─────────────────────────────────────────────┐
│ SOURCE                    DIGITAL QUESTION │
│                                             │
│ [original paper crop]    Question 20       │
│                          ─────────────      │
│                          Creative Arts...   │
│                                             │
│                          [diagram]          │
│                                             │
│                          What is the total  │
│                          area...?           │
│                                             │
│                          ○ A 72 cm²         │
│                          ○ B 96 cm²         │
│                          ○ C 48 cm²         │
│                          ○ D 66 cm²         │
└─────────────────────────────────────────────┘

And beside every extracted element:

✓ High confidence
⚠ Review
✕ Extraction failed

The human can correct it.

20. Then the AI can enrich the question

Once the question has been extracted, another intelligence layer can classify it.

For this paper:

Subject
  Mathematics

Grade
  Grade 6

Strand
  Measurement and Geometry

Sub-strand
  Area

Concept
  Area of composite shapes

Question type
  Multiple Choice

Cognitive level
  Application

Difficulty
  Medium

Skills
  Addition
  Area of rectangle
  Area of triangle

  Question 23 might become:

  Subject:
Mathematics

Strand:
Numbers

Topic:
Fractions / Percentages

Concept:
Converting fractions to percentages

And so on.

This is where your Adaptive CBC curriculum ontology becomes extremely valuable.

21. Do not make categorization dependent on the source paper

This is another crucial distinction.

The paper may say:

Mathematics

But your system should independently determine:

Grade 6
↓
Mathematics
↓
Measurement
↓
Area
↓
Area of composite figures

That means your library isn't organized according to:

"Page 5 of Test Paper X."

It becomes:

QUESTION LIBRARY

Mathematics
 ├── Grade 4
 ├── Grade 5
 ├── Grade 6
 │    ├── Numbers
 │    ├── Measurement
 │    │    ├── Length
 │    │    ├── Area
 │    │    ├── Volume
 │    │    └── Time
 │    ├── Geometry
 │    └── Data

 Then each question can have multiple tags.

22. The library should preserve provenance

Never lose the original source.

For every question:

Question
   │
   ├── Digital representation
   │
   ├── Source document
   │
   ├── Source page
   │
   ├── Original question number
   │
   ├── Original figure
   │
   ├── Extraction metadata
   │
   └── Validation history

So you can always answer:

"Where did this question come from?"

This becomes important for copyright, auditing, teacher review, duplicate detection and question provenance.

23. You can eventually build a "Question Fingerprint"

This is where the system becomes genuinely intelligent.

For every extracted question, generate a fingerprint based on:

semantic meaning
+
question structure
+
mathematical concepts
+
entities
+
figures
+
answer structure

Then you can detect:

Exact duplicate

Same question

Near duplicate

Calculate the area of the rectangle...

VS.

Find the area of the rectangle...

Conceptual duplicate

Different wording
Same mathematical skill

That allows the Adaptive CBC library to avoid filling itself with hundreds of copies of essentially the same question.

24. I would therefore divide the entire system into these engines
1. Document Preprocessing Engine

rotation
de-skew
de-warp
crop
denoise
perspective correction

2. Layout Intelligence Engine

page segmentation
columns
regions
reading order
question boundaries
headers
footers
working areas

3. Content Recognition Engine

OCR
math recognition
table recognition
symbol recognition

4. Visual Extraction Engine

figures
diagrams
charts
photos
geometry

5. Question Structure Engine

question
subquestion
stem
choices
instructions
marks
answer

6. Question Intelligence Engine

subject
grade
strand
sub-strand
topic
skill
difficulty
cognitive level
competency

7. Question Normalization Engine

Converts everything into your canonical schema.

8. Question Quality Engine

Checks:

missing text
bad OCR
incorrect math
duplicate choices
missing figure
ambiguous question
incorrect numbering

9. Human Review Engine

Your Question Author Studio.

10. Question Library

The final validated knowledge base.

25. And this gives you a much better architecture than "OCR scanning"

I'd actually rename the capability internally.

Instead of:

OCR Question Scanner

call it something like:

Question Paper Intelligence Engine

or:

Question Extraction & Intelligence Engine

because OCR is only one component.

The real pipeline is:

SCAN
 ↓
UNDERSTAND
 ↓
SEGMENT
 ↓
EXTRACT
 ↓
STRUCTURE
 ↓
NORMALIZE
 ↓
CLASSIFY
 ↓
VALIDATE
 ↓
INDEX
 ↓
LEARN

26. The most important architectural principle

Your database should not care how the original paper was formatted.

For example, these four:

A. 10   B. 20   C. 30   D. 40

A. 10
B. 20
C. 30
D. 40

A. 10       B. 20
C. 30       D. 40

and even:

(i) 10
(ii) 20
(iii) 30
(iv) 40

should ultimately map into:

{
  "question_type": "multiple_choice",
  "choices": [
    {"label": "A", "content": "10"},
    {"label": "B", "content": "20"},
    {"label": "C", "content": "30"},
    {"label": "D", "content": "40"}
  ]
}

The layout is metadata.

The question structure is the canonical truth.

27. One more thing: this can dramatically reduce your OCR costs

Your earlier idea of using OCR sparingly becomes even more powerful with this architecture.

You don't need:

Whole page
   ↓
Google Vision OCR

Youcan do:

Image
 ↓
Cheap/local vision preprocessing
 ↓
Layout detection
 ↓
Question regions
 ↓
Content classification
 ├── text → OCR
 ├── math → Math OCR
 ├── figure → crop
 ├── table → table extraction
 ├── handwriting → ignore/optional
 └── decorative → ignore

So if a page contains 50% diagrams, whitespace and working areas, you're not paying to OCR all of that unnecessarily.

28. I would build the first version around your exact example

Rather than attempting to solve every possible examination format immediately, use this page as a gold-standard extraction test.

Your first extraction target should be:

Q20
 ├── text
 ├── geometry figure
 ├── dimensions
 ├── math symbols
 └── 4 choices

Q21
 ├── text
 ├── fraction
 └── 4 choices

Q22
 ├── text
 ├── photographic figure
 └── 4 choices

Q23
 ├── text
 └── 4 choices

Q24
 ├── text
 ├── variable
 ├── inequality symbols
 └── 4 choices

Q25
 ├── text
 ├── line diagram
 └── 4 choices

And simultaneously prove that the engine can correctly ignore:

WORKING AREA
handwritten calculations
page number
"3RD Preview/Grade 6"
"Mathematics"
paper folds
shadows
stains

If your architecture can reliably do that, you've solved the difficult foundational problem.

The architecture I would recommend for Adaptive CBC

Ultimately, I see the system as:

                         ┌─────────────────────┐
                         │   SCANNED PAPER     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │ QUESTION PAPER            │
                    │ UNDERSTANDING ENGINE      │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼──────────────────────┐
          │                       │                      │
          ▼                       ▼                      ▼
   Layout Intelligence     Visual Intelligence     Text Intelligence
          │                       │                      │
     columns                  figures                  OCR
     regions                  diagrams                math
     questions                tables                  symbols
     reading order            charts
          │                       │                      │
          └───────────────────────┼──────────────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │ QUESTION STRUCTURE        │
                    │ ENGINE                    │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ CANONICAL QUESTION MODEL  │
                    └─────────────┬─────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
          Question Intelligence           Quality/Confidence
                   │                             │
             CBC mapping                   validation
             topic                         ambiguity
             skill                         extraction errors
             difficulty
                   │                             │
                   └──────────────┬──────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │ QUESTION AUTHOR STUDIO    │
                    │ Human-in-the-loop         │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ ADAPTIVE CBC QUESTION     │
                    │ LIBRARY                   │
                    └───────────────────────────┘