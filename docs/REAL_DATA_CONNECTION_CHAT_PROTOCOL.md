Phase 1: Audit And Stabilize

Inventory all mocked data in frontend pages.
Inventory all localStorage / sessionStorage usage.
Map every page to the backend endpoint it should use.
Classify gaps as:
endpoint exists, frontend not wired
endpoint missing
endpoint exists but returns incomplete data
frontend-only temporary state that needs backend persistence
Deliverable: a tracking document/table of pages, mock sources, required backend APIs, and status.

Phase 2: Authentication And Session Ownership

Replace frontend localStorage token/session storage with backend-managed auth.
Move JWT/session handling to HTTP-only cookies or a backend session endpoint.
Update Axios/API client to rely on cookies/session, not stored tokens.
Replace mocked OTP behavior with backend-owned OTP/session verification.
Add logout/session invalidation on backend.
Verify role-based routing still works for student, parent, teacher, tutor, institution admin, and super admin.
Deliverable: no localStorage for auth/session, backend-controlled login lifecycle.

Phase 3: Live Dashboards

Replace student dashboard mocked metrics with /analytics/dashboard.
Add real recent activity from practice/revision sessions.
Add real upcoming tasks from assignments and lessons.
Replace teacher/tutor dashboard placeholder metrics with:
course count
student count
pending reviews
scheduled lessons
Replace parent dashboard/children views with real child progress and relationships.
Ensure empty states say “No data yet” rather than inventing data.
Deliverable: all role dashboards use live backend data only.

Phase 4: Backend Support System

Add support_tickets entity.
Add support_ticket_messages or timeline/comments entity.
Add ticket categories, priorities, statuses, assignment fields.
Add user endpoint to create support tickets.
Add admin endpoint to list, assign, update, and resolve tickets.
Add notifications when ticket status changes.
Deliverable: real support ticket backend.

Phase 5: Support Page

Build user support page with:
ticket creation form
category selector
priority selector
optional attachment support through MinIO
ticket history
Add concise help/explainer sections for essential tasks.
Add admin support queue page.
Allow super admin/admin to open ticket conversation from a received ticket.
Deliverable: support UX for users and admins.

Phase 6: Chat Module

Add chat_conversations entity.
Add chat_messages entity.
Define conversation types:
teacher/tutor to student
support ticket chat
admin-initiated support conversation
Enforce permissions:
teachers/tutors can message assigned/enrolled students
students cannot directly initiate super admin chats
support chat starts from a ticket/admin action
Add REST endpoints first.
Optionally add WebSocket live updates after REST is stable.
Add in-app notifications for new messages.
Deliverable: backend chat foundation plus frontend inbox/conversation UI.

Phase 7: MinIO And File Ownership

Audit all file upload/storage paths.
Move remaining local filesystem uploads to MinIO.
Store MinIO object keys, not just public URLs.
Generate presigned URLs through backend.
Add attachment support for:
support tickets
chat messages
learning resources
avatars/products where still needed
Deliverable: no production-critical uploads relying on local disk.

Phase 8: Remove Frontend Temporary Storage

Replace sessionStorage draft handoff in author-studio import/create flow.
Add backend draft/import job persistence.
Replace any frontend-only draft state that should survive refresh.
Leave only harmless UI preferences in browser storage if needed, never auth/session/business data.
Deliverable: no business-critical process depends on browser storage.

Phase 9: Communication Expansion

Keep existing notification/email/SMS systems.
Add chat as a fourth communication channel.
Define communication routing:
in-app notification for all important events
email for account/support/invite events
SMS for urgent/account events
chat for human conversations
Add communication preferences later if needed.
Deliverable: communication architecture documented and implemented in code.

Phase 10: Verification And Deployment Hardening

Run full frontend build.
Run backend typecheck/build.
Test role flows:
student
parent
teacher/tutor
institution admin
super admin
Test empty database behavior.
Test MinIO upload/download.
Test ticket creation and admin response.
Test chat permissions.
Add seed data only for development, never as production fallback.
Deliverable: deployable app with no mocked production user data.

Recommended First Sprint
I suggest we start with these smaller tasks:

Create docs/LIVE_DEPLOYMENT_HARDENING_PLAN.md.
Complete mock/localStorage audit table.
Finish the live student dashboard endpoint and UI replacement.
Add support ticket backend entities/controllers/services.
Add basic support page for ticket creation.
Run builds after each slice.
That keeps the work understandable and gives us real, shippable progress after each phase.