# Adaptive CBC Authentication & Access Control Architecture

## Parent-Governed and Institution-Governed Student Identity Framework

### Objective

Create a secure, child-friendly authentication system that eliminates dependence on email addresses for learners while maintaining enterprise-grade account security through Parent Oversight and Institutional Oversight.

The architecture must support:

1. Public learners (non-school students)
2. School-affiliated learners
3. Parent oversight
4. School oversight
5. Device trust
6. Risk-based authentication
7. Account migration from public learner to institutional learner

---

# Core Identity Principles

The platform shall recognize three primary identity authorities:

### Student Identity

Represents the learner.

Student identities should never be considered primary security authorities.

Students are learning users, not security administrators.

### Parent Identity

Represents the legal guardian.

Parent identities serve as the security authority for public learners.

Parents control:

* Account recovery
* Device approvals
* Subscription management
* Child account oversight
* Security alerts

### Institution Identity

Represents a verified school.

Institution identities serve as the security authority for school learners.

Institutions control:

* Admission verification
* School enrollment
* School transfers
* Student account validation
* Device management policies

---

# Authentication Levels

## Level 1: Student Authentication

Purpose:
Daily access to learning content.

Methods:

* Admission Number + PIN
* Username + PIN
* QR Login + PIN

No OTP required.

No email required.

No password required.

---

## Level 2: Parent Authentication

Purpose:
Sensitive account operations.

Methods:

* Email + Password
* Phone + OTP
* Authenticator Application

Required for:

* Account recovery
* Device approval
* PIN reset
* Subscription purchases
* Student account linking

---

## Level 3: Institution Authentication

Purpose:
School administration.

Methods:

* Email + Password
* MFA Required

Required for:

* Student admission verification
* Enrollment approval
* Student transfer approvals
* Institution-level account management

---

# Public Learner Registration Workflow

## Step 1

Student registers using:

* First Name
* Last Name
* Grade
* Username
* Child PIN

No email required.

No password required.

---

## Step 2

Student enters:

* Parent Email
* Parent Phone

System attempts Parent Match.

---

## Step 3

If parent exists:

Automatically attach learner profile to parent account.

Status:

PARENT_VERIFIED

---

## Step 4

If parent does not exist:

Generate Parent Invitation.

Status:

PARENT_PENDING

Parent receives:

* Email invitation
* SMS invitation

---

## Step 5

Parent completes registration.

System links student automatically.

Status:

PARENT_VERIFIED

---

# Parent Approval Protocol

Every child account must have one verified parent authority.

Minimum parent verification:

* Verified phone number
  OR
* Verified email

Preferred:

* Both verified

Parent becomes recovery authority.

Students cannot remove parent relationships.

Only verified parents may:

* Reset PINs
* Approve new devices
* Recover accounts

---

# Child Authentication Protocol

Child login consists of:

Identifier:

* Username
  OR
* Admission Number

Credential:

* 4-digit PIN
  or
* 6-digit PIN

Example:

Admission Number: ADM-1257
PIN: 4281

---

# Device Trust Framework

Every successful login generates:

Trusted Device Record

Fields:

* Device ID
* Device Fingerprint
* Browser Signature
* OS Signature
* Last Login Timestamp
* Risk Score

---

# Trusted Device Policy

If:

Known Device
+
Correct PIN

Allow access immediately.

No OTP.

No interruption.

---

# New Device Policy

If:

Unknown Device

System enters:

PENDING_APPROVAL

Student receives:

"Your parent or school must approve this device."

---

# Public Student Device Approval

Approval authority:

Parent

Workflow:

1. Student attempts login.
2. New device detected.
3. Parent receives OTP.
4. Parent approves device.
5. Device becomes trusted.

Device trust duration:

365 days

---

# School Student Device Approval

Approval authority:

Institution

Workflow:

1. Student logs in.
2. Unknown device detected.
3. School administrator notification generated.
4. School approves device.
5. Device becomes trusted.

Alternative:

Teacher approval permissions may be delegated.

---

# School Enrollment Workflow

Public learner searches school.

Student submits:

JOIN SCHOOL REQUEST

School receives request.

School verifies:

* Student Name
* Admission Number
* Grade

If approved:

Student status changes to:

SCHOOL_MANAGED

---

# Identity Migration Protocol

When student joins a school:

Previous Identifier:

Username

New Identifier:

Admission Number

System maintains both identifiers.

Admission Number becomes primary login identifier.

Username remains secondary identifier.

No data migration required.

No account recreation required.

Single user record maintained.

---

# School Authentication Model

School students login using:

Admission Number
+
PIN

No email required.

No password required.

No OTP required.

Only trusted devices may authenticate.

---

# Risk-Based Authentication Engine

Every login receives a risk score.

Factors:

* Device trust
* Geolocation change
* IP reputation
* Login frequency
* Device age
* Failed login attempts

Risk Categories:

LOW
MEDIUM
HIGH
CRITICAL

---

## LOW RISK

Trusted device.

Known location.

Known behaviour.

Action:

Grant access.

---

## MEDIUM RISK

New browser.

New device.

Action:

Require Parent Approval
OR
School Approval

---

## HIGH RISK

Country change.

Multiple failed attempts.

Device anomaly.

Action:

Lock student session.

Require authority verification.

---

## CRITICAL RISK

Credential stuffing detected.

Bot activity detected.

Account takeover indicators detected.

Action:

Immediate account lock.

Notify:

* Parent
* Institution
* Security logs

---

# PIN Security Standards

Never store raw PINs.

Store:

Argon2id Hash

Requirements:

4 digits minimum
6 digits preferred

Maximum attempts:

5 attempts

After 5 failures:

Temporary lock:

15 minutes

Escalating lock periods thereafter.

---

# Account Recovery Protocol

Students cannot recover accounts independently.

Recovery authorities:

Public Student:

Verified Parent

School Student:

Verified Parent
OR
Institution

Recovery process:

1. Identity verification.
2. OTP verification.
3. PIN reset.
4. Device review.

---

# Access Control Hierarchy

LEVEL 1
Student

Permissions:

* Learning
* Assessments
* Progress Tracking

---

LEVEL 2
Parent

Permissions:

* Child Management
* Security Management
* Billing
* Recovery

---

LEVEL 3
Teacher

Permissions:

* Classroom Management
* Progress Monitoring

---

LEVEL 4
School Administrator

Permissions:

* Student Verification
* Enrollment Approval
* Device Approval
* Institution Management

---

LEVEL 5
Platform Administrator

Permissions:

* Global System Management

---

# Security Design Principle

Students should never carry the burden of platform security.

Security ownership belongs to:

1. Parents
2. Institutions
3. Platform Administrators

Students should only remember:

* Admission Number or Username
* Simple PIN

All advanced security controls should operate transparently through parent and institution oversight.
