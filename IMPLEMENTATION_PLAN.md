# Adaptive CBC - Implementation Plan

## Overview
This document outlines all fixes, features, and improvements needed for the Adaptive CBC Learning Platform.

---

## Phase 1: Critical Bug Fixes

### 1.1 Dashboard 404 Errors
**Issue:** Student, Parent, Tutor, Teacher dashboards display 404 errors.
**Root Cause:** Need to investigate route structure in `(dashboard)/` route group.
**Tasks:**
- [ ] 1.1.1 Audit all dashboard routes in `frontend/src/app/(dashboard)/`
- [ ] 1.1.2 Verify layout.tsx route matching and role-based redirects
- [ ] 1.1.3 Fix missing or misconfigured route pages
- [ ] 1.1.4 Test each role's dashboard access after login
- [ ] 1.1.5 Add proper loading states and error boundaries

### 1.2 "+ Add Institution" Button Not Working
**Issue:** Button in Admin 'Institutions' module does nothing.
**Tasks:**
- [ ] 1.2.1 Review `frontend/src/app/admin/institutions/page.tsx`
- [ ] 1.2.2 Create institution creation modal/form component
- [ ] 1.2.3 Connect to backend `POST /institutions` endpoint
- [ ] 1.2.4 Add form validation (name, code, type, location, grades)
- [ ] 1.2.5 Handle success/error states with toasts
- [ ] 1.2.6 Refresh institution list after creation

---

## Phase 2: Role & Workflow Restructuring

### 2.1 Teacher Registration Flow Change
**Issue:** Teachers should NOT register directly. They are created by institutional admins.
**Tasks:**
- [ ] 2.1.1 Remove `teacher` option from public registration page
- [ ] 2.1.2 Update registration page to only allow: student, parent, tutor, institution_admin
- [ ] 2.1.3 Add backend validation to prevent direct teacher registration
- [ ] 2.1.4 Update seeder scripts to reflect new flow
- [ ] 2.1.5 Update documentation/comments

### 2.2 Institutional Admin Registration & KYC Flow
**Issue:** Institution admins need a registration -> KYC -> admin approval workflow.
**Tasks:**
- [ ] 2.2.1 Create institution admin registration form with:
  - Personal details (name, email, phone)
  - Institution details (name, type, location, expected grades)
  - KYC document upload (ID, school registration certificate, etc.)
- [ ] 2.2.2 Create backend endpoint for institution admin application submission
- [ ] 2.2.3 Add KYC document storage (MinIO integration)
- [ ] 2.2.4 Create admin review interface for institution applications
- [ ] 2.2.5 Add approval/rejection workflow with email notifications
- [ ] 2.2.6 Create pending applications list in admin dashboard
- [ ] 2.2.7 Add status tracking (pending -> under_review -> approved/rejected)

### 2.3 Teacher Creation by Institution Admin
**Issue:** Teachers are created/added by their institutional admins.
**Tasks:**
- [ ] 2.3.1 Create "Add Teacher" form in institution management
- [ ] 2.3.2 Teacher creation fields: name, email, subjects, streams/grades
- [ ] 2.3.3 Auto-generate temporary password + invite email
- [ ] 2.3.4 Backend endpoint for institution admin to create teachers
- [ ] 2.3.5 Teacher onboarding flow (set password, complete profile)
- [ ] 2.3.6 Teacher listing within institution detail view
- [ ] 2.3.7 Teacher role assignment and permission management

### 2.4 Dual Role Support (Teacher + Tutor)
**Issue:** Teachers can also be public tutors with marketplace access.
**Tasks:**
- [ ] 2.4.1 Update User entity to support multiple roles (array or role mapping)
- [ ] 2.4.2 Create role context switching mechanism in dashboard
- [ ] 2.4.3 Allow teachers to "Enable Tutor Mode" from settings
- [ ] 2.4.4 Tutor-specific features: course materials, marketplace, public classes
- [ ] 2.4.5 Legacy tutor migration: existing tutors can be added as teachers
- [ ] 2.4.6 Update sidebar to show role-specific items based on active role
- [ ] 2.4.7 Update backend guards to check for role presence in array
- [ ] 2.4.8 Database migration for existing users

---

## Phase 3: Content Moderation Enhancement

### 3.1 View Content Action
**Issue:** Admins can only Approve/Reject without viewing content first.
**Tasks:**
- [ ] 3.1.1 Add "View" action button to content moderation table
- [ ] 3.1.2 Create content preview modal/dialog component
- [ ] 3.1.3 Display full content details in preview:
  - Title, description, author info
  - Content body/text rendering
  - Attached files/images preview
  - Submission date, category, tags
- [ ] 3.1.4 Add approve/reject buttons within the preview modal
- [ ] 3.1.5 Add rejection reason input field
- [ ] 3.1.6 Connect to backend API for actual content data

---

## Phase 4: Reports & PDF Generation

### 4.1 Reports Download Functionality
**Issue:** Download button in reports module is non-functional.
**Tasks:**
- [ ] 4.1.1 Install PDF generation library (recommend: `@react-pdf/renderer` or `pdfkit`)
- [ ] 4.1.2 Create branded PDF template system with:
  - Adaptive CBC logo and branding
  - Color scheme (primary green #006a34, secondary blue #455f88)
  - Header with logo, report title, date
  - Footer with page numbers, copyright
  - Professional typography
- [ ] 4.1.3 Implement report data fetching from backend
- [ ] 4.1.4 Create PDF templates for each report type:
  - Enrollment Report
  - Performance Report
  - Activity Report
  - Usage Report
- [ ] 4.1.5 Add Excel export support (recommend: `exceljs`)
- [ ] 4.1.6 Add CSV export support
- [ ] 4.1.7 Connect download buttons to actual generation endpoints
- [ ] 4.1.8 Add download progress/loading states

### 4.2 Certificate Templates
**Issue:** Need branded certificates for various achievements.
**Tasks:**
- [ ] 4.2.1 Course Completion Certificate template
- [ ] 4.2.2 Grade 6 Graduation Certificate template
- [ ] 4.2.3 Grade 9 Completion Certificate template
- [ ] 4.2.4 Certificate design elements:
  - Branded border/frame
  - Institutional logo + platform logo
  - Student name, achievement details
  - Date, signatures (digital)
  - Unique certificate ID/QR code for verification
- [ ] 4.2.5 Backend endpoint for certificate generation
- [ ] 4.2.6 Certificate download from student dashboard
- [ ] 4.2.7 Certificate verification page (public URL with cert ID)

### 4.3 Report Card Templates
**Issue:** Need branded academic report forms.
**Tasks:**
- [ ] 4.3.1 Termly Report Card template
  - Student info, grade, term, year
  - Subject-wise performance (CBC competency ratings)
  - Teacher remarks
  - Class teacher signature
  - Principal signature
- [ ] 4.3.2 Year Report Form template
  - Annual summary
  - Progress across terms
  - Overall performance trends
  - Recommendations
- [ ] 4.3.3 Backend endpoints for report card generation
- [ ] 4.3.4 Integration with student progress data
- [ ] 4.3.5 Download from parent and student dashboards

---

## Phase 5: Email Notification System

### 5.1 Email Infrastructure
**Issue:** No email service implemented.
**Tasks:**
- [ ] 5.1.1 Install email service (recommend: `@nestjs-modules/mailer` + `nodemailer`)
- [ ] 5.1.2 Configure SMTP settings (environment variables)
- [ ] 5.1.3 Create email template engine (Handlebars or MJML)
- [ ] 5.1.4 Set up branded email template base layout:
  - Header with Adaptive CBC logo
  - Footer with contact info, social links
  - Consistent color scheme
  - Responsive design

### 5.2 Email Templates
**Tasks:**
- [ ] 5.2.1 Welcome Email (new user registration)
- [ ] 5.2.2 OTP Verification Email
- [ ] 5.2.3 Password Reset Email
- [ ] 5.2.4 Account Approval Email (institution admin)
- [ ] 5.2.5 Account Rejection Email (institution admin)
- [ ] 5.2.6 Teacher Invitation Email (with temp password)
- [ ] 5.2.7 Course Enrollment Confirmation
- [ ] 5.2.8 Assignment Notification
- [ ] 5.2.9 Report Card Available Notification
- [ ] 5.2.10 Certificate Issued Notification
- [ ] 5.2.11 KYC Status Update Email
- [ ] 5.2.12 System Maintenance Notification

---

## Phase 6: Branding & Settings

### 6.1 System Branding Settings Section
**Issue:** Need centralized branding management under admin settings.
**Tasks:**
- [ ] 6.1.1 Create "Branding" tab in admin settings page
- [ ] 6.1.2 Branding settings form with:
  - Site Logo upload (SVG, PNG - max 2MB)
  - Favicon upload (ICO, PNG - 32x32, 16x16)
  - App Icon upload (various sizes for PWA)
  - Primary color picker
  - Secondary color picker
  - Platform name customization
  - Footer text customization
- [ ] 6.1.3 File upload handling with preview
- [ ] 6.1.4 Backend endpoint for branding settings CRUD
- [ ] 6.1.5 Store branding in database + MinIO for files
- [ ] 6.1.6 Create branding context/provider for frontend
- [ ] 6.1.7 Apply dynamic branding across all pages
- [ ] 6.1.8 Update favicon and meta tags dynamically

### 6.2 Brand Logo Upload Guide
**Current State:** Logo is a Lucide icon (Sparkles).
**Tasks:**
- [ ] 6.2.1 Create `/public/branding/` directory structure
- [ ] 6.2.2 Document file requirements:
  - Logo: SVG preferred, PNG fallback, transparent background, min 200px height
  - Favicon: ICO format, 32x32 and 16x16
  - App Icon: PNG, 192x192 and 512x512
- [ ] 6.2.3 Create upload instructions for manual placement
- [ ] 6.2.4 Alternative: Admin UI upload (see 6.1)

---

## Phase 7: UI/UX Improvements

### 7.1 Minimizable Dashboard Sidebar
**Issue:** Sidebar cannot be collapsed/minimized.
**Tasks:**
- [ ] 7.1.1 Add collapse/expand toggle button to sidebar
- [ ] 7.1.2 Collapsed state shows only icons (no text labels)
- [ ] 7.1.3 Smooth animation using Framer Motion
- [ ] 7.1.4 Persist collapse state in localStorage
- [ ] 7.1.5 Tooltip on hover when collapsed
- [ ] 7.1.6 Update main content area width on toggle
- [ ] 7.1.7 Apply to both dashboard and admin sidebars
- [ ] 7.1.8 Mobile: sidebar becomes overlay drawer

### 7.2 Admin Profile Page
**Issue:** Missing admin profile page.
**Tasks:**
- [ ] 7.2.1 Create `frontend/src/app/admin/profile/page.tsx`
- [ ] 7.2.2 Profile sections:
  - Avatar upload/change
  - Personal info (name, email, phone)
  - Role and permissions display
  - Activity log
  - Security settings (password change, 2FA)
  - Notification preferences
- [ ] 7.2.3 Connect to backend user profile endpoints
- [ ] 7.2.4 Add edit functionality with save/cancel

### 7.3 Admin Navbar Avatar with Dropdown
**Issue:** Missing user avatar and dropdown in admin navbar.
**Tasks:**
- [ ] 7.3.1 Add user avatar to admin navbar header
- [ ] 7.3.2 Create dropdown menu with:
  - User name and role display
  - My Profile link
  - Settings link
  - Sign Out button
- [ ] 7.3.3 Avatar with initials fallback (no image)
- [ ] 7.3.4 Dropdown animation
- [ ] 7.3.5 Close on outside click
- [ ] 7.3.6 Match admin dark theme styling

---

## Phase 8: Integration & Testing

### 8.1 Backend API Integration
**Tasks:**
- [ ] 8.1.1 Connect content moderation to backend API
- [ ] 8.1.2 Connect reports to backend analytics API
- [ ] 8.1.3 Connect admin settings to backend
- [ ] 8.1.4 Connect institution management to backend
- [ ] 8.1.5 Add proper error handling across all modules
- [ ] 8.1.6 Add loading states for all async operations

### 8.2 Testing
**Tasks:**
- [ ] 8.2.1 Test all dashboard routes for each role
- [ ] 8.2.2 Test institution admin registration flow
- [ ] 8.2.3 Test teacher creation by institution admin
- [ ] 8.2.4 Test dual role switching
- [ ] 8.2.5 Test content moderation with view action
- [ ] 8.2.6 Test PDF generation for all templates
- [ ] 8.2.7 Test email delivery for all templates
- [ ] 8.2.8 Test branding settings persistence
- [ ] 8.2.9 Test sidebar collapse/expand
- [ ] 8.2.10 Test admin profile page
- [ ] 8.2.11 Test admin navbar dropdown
- [ ] 8.2.12 Cross-browser testing
- [ ] 8.2.13 Mobile responsiveness testing

---

## File Creation/Modification Map

### New Files to Create

#### Frontend Components
```
frontend/src/components/ui/
  - modal.tsx
  - dropdown-menu.tsx
  - avatar.tsx
  - badge.tsx
  - button.tsx
  - input.tsx
  - select.tsx
  - textarea.tsx
  - file-upload.tsx
  - tooltip.tsx
  - sidebar.tsx (extracted)
  - navbar.tsx (extracted)

frontend/src/components/layout/
  - dashboard-sidebar.tsx
  - admin-sidebar.tsx
  - dashboard-navbar.tsx
  - admin-navbar.tsx
  - branding-provider.tsx

frontend/src/components/certificates/
  - course-completion.tsx
  - grade6-graduation.tsx
  - grade9-completion.tsx

frontend/src/components/reports/
  - termly-report-card.tsx
  - year-report-form.tsx
  - enrollment-report.tsx
  - performance-report.tsx
  - activity-report.tsx
  - usage-report.tsx

frontend/src/components/email-templates/
  - base-template.tsx
  - welcome-email.tsx
  - otp-email.tsx
  - password-reset-email.tsx
  - approval-email.tsx
  - rejection-email.tsx
  - teacher-invite-email.tsx

frontend/src/components/institutions/
  - create-institution-modal.tsx
  - institution-detail.tsx
  - add-teacher-modal.tsx

frontend/src/components/content/
  - content-preview-modal.tsx

frontend/src/hooks/
  - useBranding.ts
  - useSidebar.ts
  - useRole.ts

frontend/src/types/
  - user.ts
  - institution.ts
  - content.ts
  - report.ts
  - certificate.ts
  - branding.ts
  - email.ts
```

#### Backend Files
```
backend/src/modules/
  - email/
    - email.module.ts
    - email.service.ts
    - email.controller.ts
    - templates/ (handlebars templates)
  - certificates/
    - certificates.module.ts
    - certificates.service.ts
    - certificates.controller.ts
    - certificates.entity.ts
  - reports/
    - reports.module.ts
    - reports.service.ts
    - reports.controller.ts
  - branding/
    - branding.module.ts
    - branding.service.ts
    - branding.controller.ts
    - branding.entity.ts
  - content-moderation/
    - content-moderation.module.ts
    - content-moderation.service.ts
    - content-moderation.controller.ts
    - content.entity.ts
```

### Files to Modify

#### Frontend
```
frontend/src/app/(dashboard)/layout.tsx - Sidebar collapse, role updates
frontend/src/app/admin/layout.tsx - Sidebar collapse, navbar avatar
frontend/src/app/admin/institutions/page.tsx - Add institution button
frontend/src/app/admin/content/page.tsx - View action, API integration
frontend/src/app/admin/reports/page.tsx - Download functionality
frontend/src/app/admin/settings/page.tsx - Branding tab
frontend/src/app/register/page.tsx - Remove teacher option
frontend/src/app/(dashboard)/profile/page.tsx - Actual profile page
frontend/src/store/authStore.ts - Multi-role support
frontend/src/lib/api.ts - New endpoints
frontend/tailwind.config.js - Dynamic branding support
frontend/next.config.js - Image domains for branding
```

#### Backend
```
backend/src/modules/users/entities/user.entity.ts - Multi-role support
backend/src/modules/auth/auth.service.ts - Registration validation
backend/src/modules/auth/guards/roles.guard.ts - Array role checking
backend/src/modules/institutions/institutions.controller.ts - Teacher creation
backend/src/modules/kyc/kyc.service.ts - Institution admin KYC
backend/src/app.module.ts - New module imports
backend/.env.example - Email SMTP config
```

---

## Priority Order

1. **P0 - Critical:** Dashboard 404 fixes, Add Institution button
2. **P1 - High:** Role restructuring (teacher flow, institution admin KYC, dual roles)
3. **P2 - High:** Content moderation view action, Reports download
4. **P3 - Medium:** PDF templates, Certificates, Report cards
5. **P4 - Medium:** Email system, Branding settings
6. **P5 - Low:** Sidebar minimization, Admin profile, Admin navbar avatar

---

## Estimated Timeline

| Phase | Estimated Days | Dependencies |
|-------|---------------|--------------|
| Phase 1: Bug Fixes | 2-3 days | None |
| Phase 2: Role Restructuring | 5-7 days | Phase 1 |
| Phase 3: Content Moderation | 1-2 days | Phase 1 |
| Phase 4: Reports & PDF | 4-5 days | Phase 1 |
| Phase 5: Email System | 3-4 days | Phase 2, 4 |
| Phase 6: Branding | 2-3 days | Phase 4 |
| Phase 7: UI/UX | 2-3 days | None (parallel) |
| Phase 8: Testing | 3-4 days | All phases |
| **Total** | **22-31 days** | |

---

## Notes & Considerations

1. **Database Migrations:** Role changes (single -> array) will require careful migration strategy for existing users.
2. **Backwards Compatibility:** Legacy tutors who become teachers need smooth transition.
3. **File Storage:** MinIO is already configured - use for all uploads (KYC, branding, certificates).
4. **Security:** KYC documents contain sensitive data - ensure proper access controls.
5. **Performance:** PDF generation can be resource-intensive - consider queue system for bulk operations.
6. **Email Provider:** Consider transactional email service (SendGrid, AWS SES, Mailgun) for production.
7. **Certificate Verification:** Public verification endpoint needed for authenticity checks.
8. **Branding Caching:** Brand settings should be cached to avoid DB calls on every request.

---

## Checklist Summary

```
[x] Phase 1: Critical Bug Fixes (2-3 days) - COMPLETED
    [x] 1.1 Dashboard 404 Errors
        - Created /dashboard root page (overview)
        - Created /settings page for dashboard users
        - Created /analytics page for teachers
        - Fixed admin sidebar routes to point to /admin/* paths
        - Added admin redirect from (dashboard) layout to /admin/dashboard
        - Fixed role labels in sidebar and navbar for all user types
    [x] 1.2 Add Institution Button
        - Added modal state management
        - Created institution creation form with validation
        - Connected to POST /institutions endpoint
        - Added loading states and error handling
        - Auto-refresh institution list after creation

[x] Phase 2: Role & Workflow Restructuring (5-7 days) - COMPLETED
    [x] 2.1 Teacher Registration Flow Change
        - Removed teacher option from direct registration
        - Backend validation blocks teacher role registration
        - Registration page now has role selector: student, parent, tutor, institution_admin
    [x] 2.2 Institutional Admin Registration & KYC Flow
        - Institution admin registration with KYC application form
        - Institution details: name, type, county, address, phone
        - Account created inactive with kycStatus: 'pending'
        - Admin KYC review page at /admin/kyc-applications
        - Approve/reject workflow with rejection reason
        - Pending approval dashboard for institution admins
        - Limited sidebar for pending admins
    [x] 2.3 Teacher Creation by Institution Admin
        - POST /users/teachers/create endpoint
        - Auto-generates temporary password
        - Teacher linked to institution
    [x] 2.4 Dual Role Support (Teacher + Tutor)
        - secondaryRoles array field in User entity
        - Endpoints for adding/removing secondary roles
        - RolesGuard checks both primary and secondary roles

[x] Phase 2.5: Institutional Admin Dashboard Sanitization
    [x] Role-based sidebar: super_admin gets platform modules, institution_admin gets institution modules
    [x] Institution admin sidebar: Dashboard, My Institution, Teachers, Students, Analytics, Reports, Settings
    [x] Super admin sidebar: Dashboard, Users, KYC Applications, KYC Verification, Institutions, Content, Analytics, Reports, Settings
    [x] Created /admin/institution - Institution details and settings management
    [x] Created /admin/teachers - Teacher management with "Add Teacher" modal
    [x] Created /admin/students - Student listing and filtering
    [x] Created /admin/profile - Admin profile page with edit and password change
    [x] Updated /admin/settings - Institution-level settings for institution_admin, platform settings for super_admin
    [x] Updated /admin/analytics - Institution-specific analytics for institution_admin
    [x] Added admin navbar avatar with dropdown menu (profile, settings, sign out)
    [x] Institution admin auto-redirect to /dashboard if KYC not approved

[ ] Phase 3: Content Moderation Enhancement (1-2 days)
    [ ] 3.1 View Content Action

[ ] Phase 4: Reports & PDF Generation (4-5 days)
    [ ] 4.1 Reports Download Functionality
    [ ] 4.2 Certificate Templates
    [ ] 4.3 Report Card Templates

[ ] Phase 5: Email Notification System (3-4 days)
    [ ] 5.1 Email Infrastructure
    [ ] 5.2 Email Templates

[ ] Phase 6: Branding & Settings (2-3 days)
    [ ] 6.1 System Branding Settings Section
    [ ] 6.2 Brand Logo Upload Guide

[ ] Phase 7: UI/UX Improvements (2-3 days)
    [ ] 7.1 Minimizable Dashboard Sidebar
    [ ] 7.2 Admin Profile Page
    [ ] 7.3 Admin Navbar Avatar with Dropdown

[ ] Phase 8: Integration & Testing (3-4 days)
    [ ] 8.1 Backend API Integration
    [ ] 8.2 Testing
```
