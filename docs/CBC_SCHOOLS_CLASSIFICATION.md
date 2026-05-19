Here’s a clean JSON schema sketch you can use for registering institutions under this adaptive CBC learning system. It distinguishes Category A-Basic Education (Pre-Primary → JSS) and Category B (Senior Secondary), with pathway-specific tagging for Category B.

{
  "institution": {
    "id": "string", 
    "name": "string",
    "location": {
      "county": "string",
      "sub_county": "string",
      "ward": "string"
    },
    "category": "A | B",
    "levels": {
      "pre_primary": {
        "available": true,
        "classes": ["PP1", "PP2"]
      },
      "primary": {
        "available": true,
        "grades": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
      },
      "junior_secondary": {
        "available": true,
        "grades": ["Grade 7", "Grade 8", "Grade 9"]
      },
      "senior_secondary": {
        "available": true,
        "grades": ["Grade 10", "Grade 11", "Grade 12"],
        "pathways": [
          {
            "name": "STEM",
            "subjects": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"]
          },
          {
            "name": "Arts & Sports Science",
            "subjects": ["Visual Arts", "Performing Arts", "Physical Education", "Music"]
          },
          {
            "name": "Social Sciences & Humanities",
            "subjects": ["History", "Geography", "Business Studies", "Languages"]
          }
        ]
      }
    },
    "facilities": {
      "labs": ["Science Lab", "Computer Lab"],
      "sports": ["Football Field", "Basketball Court"],
      "library": true
    },
    "registration": {
      "moe_code": "string",
      "ownership": "Public | Private"
    }
  }
}

🔑 Key Features
category field:

"A" → Institutions offering Pre-Primary to Junior Secondary.

"B" → Institutions offering Senior Secondary (Grades 10–12).

Pathway tagging (only for Category B):

Each pathway has a name and subjects array.

Allows flexible expansion if MOE adds new pathways later.

Facilities block:

Helps track infrastructure readiness (labs, sports, library).

Useful for adaptive learning features like resource-based recommendations.

👉 This schema gives you a scalable backbone: most schools will register under Category A, while specialized Senior Secondary institutions will register under Category B with pathway tagging.