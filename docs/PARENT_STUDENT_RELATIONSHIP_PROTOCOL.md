You are essentially building:

a controlled educational relationship graph.

The relationship between:

parent,
child,
school,
teacher,
and tutor

must be verifiable and secure.

1. The Core Problem

You need to answer:

“How does the system know this adult is genuinely connected to this student?”

Because if this is weak:

strangers can monitor children,
analytics become compromised,
abuse risks increase,
and institutional trust collapses.

Especially because your platform serves minors.

2. The Correct Architectural Mindset

Do NOT think:

“parent account linked to child account.”

Think:

“guardianship authorization system.”

That subtle difference matters.

Because:

parents,
guardians,
siblings,
sponsors,
and schools

may all have different access levels.

3. Recommended Relationship Model

Your relationship system should support:

Role	Example
Parent	Biological parent
Guardian	Uncle/Aunt
Sponsor	Pays fees only
Teacher	Academic oversight
School Admin	Institutional oversight

Each relationship should have:

permissions,
verification state,
and trust score.
4. The Best Realistic Flow for Your Platform

This is the most practical and scalable approach.

STUDENT-FIRST REGISTRATION MODEL

Why?

Because:

students are the primary users,
schools onboard students,
and parents are linked afterward.
5. Recommended Parent–Child Handshake Flow
STEP 1 — Student Account Creation

Student:

signs up,
or school bulk-registers students.

The student profile contains:

full name,
grade,
school,
admission number,
parent contact info.
STEP 2 — Parent Information Capture

During onboarding:
student enters:

parent phone number,
parent email,
guardian relationship.

Example:

Parent Name: Jane Doe
Phone: +2547XXXXXXXX
Relationship: Mother

This creates:

a pending guardianship request.
STEP 3 — Parent Invitation

System sends:

SMS,
email,
or WhatsApp invitation.

Example:

Your child Brian Otieno has invited you to connect to their learning account on Adaptive CBC Learning Platform.

Accept Invitation
STEP 4 — Parent Account Creation

Parent:

creates account,
verifies phone/email,
accepts child link.

Now:

Parent ↔ Student

becomes:

verified relationship.
6. The Trust Verification Layer

Now comes the important part.

The system should NOT immediately grant full access.

You need:

multi-level verification.
7. Recommended Verification Levels
Level	Meaning
Unverified	Invitation sent
Basic Verified	OTP verified
School Verified	Confirmed by school
Institutional Verified	Documents/KYC
8. BEST APPROACH FOR KENYA

The strongest and most scalable method is:

SCHOOL-ASSISTED VERIFICATION

This is extremely powerful.

How It Works

School uploads:

student roster,
parent phone numbers,
admission numbers.

Now:
when a parent claims:

“I am Brian’s parent”

the system checks:

Phone number matches school records?

If yes:

auto-verified.

This creates:

trust,
institutional legitimacy,
and fraud reduction.
9. Parent Access Permissions

Do NOT expose everything.

Permissions should be granular.

Example Permissions
Permission	Parent
View performance	Yes
View discussions	Limited
Chat with tutors	Yes
Modify profile	Limited
Submit assignments	No
Monitor activity	Yes
10. Multi-Child Support

One parent may have:

several children.

Architecture must support:

Parent
   ↳ Child A
   ↳ Child B
   ↳ Child C

This is common in schools.

11. Multi-Parent Support

One child may have:

mother,
father,
guardian.

Architecture:

Child
   ↳ Mother
   ↳ Father
   ↳ Guardian

Each with separate permissions.

12. Recommended Database Design

You should NEVER store this as:

parent_id inside student table

That becomes limiting.

Instead:

Use a Relationship Table

Example:

UserRelationships
--------------------
id
user_id
related_user_id
relationship_type
verification_status
permissions
verified_by
created_at

This becomes:

massively scalable.
13. Relationship Types

Supported values:

PARENT
MOTHER
FATHER
GUARDIAN
SPONSOR
TEACHER
SCHOOL_ADMIN
14. Permission-Based Architecture

Do NOT hardcode logic:

if parent

Use:

RBAC + relationship permissions.

Example:

{
  "can_view_scores": true,
  "can_join_discussions": false,
  "can_pay_fees": true
}

This future-proofs the platform.

15. The Best Initial Handshake Strategy (MVP)

For Phase 1/2:

I strongly recommend:

PHONE NUMBER + OTP + SCHOOL MATCHING

Flow:

Student enters parent phone
        ↓
SMS invitation sent
        ↓
Parent verifies OTP
        ↓
School data cross-check
        ↓
Relationship approved

This is:

simple,
scalable,
affordable,
and trusted.
16. Advanced Verification (Later)

Future options:

national ID verification,
birth certificate linkage,
school-issued guardian codes,
biometric confirmation,
ministry integration.

But:

DO NOT START THERE.

Too complex early on.

17. Important Safety Rules

Since minors are involved:

You MUST:

protect student privacy,
limit adult interactions,
moderate communications,
audit relationship changes,
track guardian access logs.
18. Relationship Audit Trail

Very important.

Track:

Who linked?
Who approved?
When?
From which IP/device?

This protects against:

abuse,
disputes,
impersonation.
19. School-Centric Growth Strategy

This relationship system becomes MUCH stronger if schools participate.

Why?

Because schools already have:

parent contacts,
admission numbers,
and institutional trust.

This allows:

verified educational identity.

That is a huge advantage.

20. Recommended Long-Term Identity Architecture

Eventually your platform becomes:

Student Identity Layer
        ↓
Parent/Guardian Graph
        ↓
School Verification Layer
        ↓
Learning Intelligence Layer

This is no longer just:

“accounts.”

It becomes:

trusted educational identity infrastructure.

And that is extremely powerful long term.