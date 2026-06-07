# Live Deployment Hardening Plan

## Priority 0 — Super Admin Services & Integration Settings (BLOCKER)

Everything else depends on the super admin being able to configure platform services. Currently broken.

### Issue: "Unauthorized" on Integration Settings

**Root cause analysis:**
- `GET /integrations` at `IntegrationsController` requires `SUPER_ADMIN` role (class-level `@Roles` guard)
- `POST /integrations/smtp/test` and `POST /integrations/smtp/config` also require `SUPER_ADMIN`
- The frontend admin settings page (`admin/settings/page.tsx:125`) calls `api.get('/integrations')`
- If the JWT token is expired, missing, or the user's `role` is not `super_admin`, the guard throws 401/403

**Possible causes to check:**
1. JWT token expired — localStorage token may be stale
2. User role in token doesn't match `super_admin` — check DB `users.role` column
3. Token refresh mechanism isn't working — no refresh interceptor on the Axios client
4. The `secondaryRoles` field may be missing from the JWT payload

**Fix checklist:**
- [ ] Add Axios response interceptor to handle 401 with token refresh
- [ ] Verify super_admin user exists in DB with correct role
- [ ] Add logging to `RolesGuard` to debug role mismatches
- [ ] Test the full flow: login → get token → call `/integrations`

### Issue: Admin Settings Notifications & Security Tabs Don't Persist

- `handleSaveNotifications` (line 216) shows toast only, no API call
- `handleSaveSecurity` (line 227) shows toast only, no API call
- Backend already has `PATCH /settings/user` endpoint for this
- Fix: wire both handlers to `api.patch('/settings/user', ...)` with the correct payload structure

---

## Priority 1 — User Management Enhancements

### 1a. Fix Edit User Modal — Currently Broken

**File:** `frontend/src/app/admin/users/page.tsx:746-839`

**Problems:**
- The modal calls `PATCH /users/:id/grade` (grade endpoint) instead of `PATCH /users/:id`
- Email field is `disabled` — super admin cannot change user emails
- Role field is shown but **not actually sent** in the PATCH body
- On save, only `grade` is sent, so firstName/lastName changes are lost

**Fix:**
- Change API call to `PATCH /users/:id` with full `{ firstName, lastName, email, role, grade }`
- Remove `disabled` from email input (or show a warning)
- Send the correct DTO to the backend

### 1b. Add Password Reset Action in User Actions Menu

**Missing feature:** No way for super admin to reset a user's password.

**Backend changes needed:**
- Add `POST /users/:id/reset-password` endpoint in `UsersController`
- Add `adminResetPassword()` method in `UsersService` that:
  - Generates a random temporary password
  - Hashes and saves it
  - Returns the temp password (or emails it)
  - Logs the action

**Frontend changes needed:**
- Add "Reset Password" button in the actions dropdown (after "Unsuspend" / before "Delete")
- Show confirmation modal: "This will reset the password for {user}. The new temporary password will be displayed once."
- On confirm, call `POST /users/:id/reset-password`
- Display the temporary password in a copyable field

### 1c. Fix findAll() Institution Scoping (Data Leak)

**File:** `backend/src/modules/users/users.controller.ts:155` and `users.service.ts:75`

**Problem:** `findAll()` returns ALL non-deleted users regardless of institution. An `institution_admin` sees every user in the system.

**Fix:**
- Pass the requesting user's info to `findAll()`
- If `req.user.role === 'institution_admin'`, filter by `institutionId`
- The controller should pass `req.user` to the service

---

## Priority 2 — Phase 1: Full Mock/LocalStorage Audit Table

| Page/File | Mock Source | Required API | Status |
|---|---|---|---|
| `authStore.ts:172` | OTP accepts `123456`/`000000` unconditionally | Real OTP via backend | ❌ |
| `authStore.ts:210` | Fallback email `parent@adaptivecbc.com` | Proper phone-to-email lookup | ❌ |
| `dashboard/page.tsx:146-147` | Teacher stats `"—"` for Active Classes, Pending Reviews | Extend `/analytics/dashboard` for teachers | ❌ |
| `children/page.tsx:85-87` | Hardcoded 85%, 17 days, 24 | Real parent summary endpoint | ❌ |
| `children/page.tsx:29` | Comment `// mock properties for ui matching` | Remove or make real | ❌ |
| `practice.controller.ts:113` | Fallback quiz hardcoded questions | Remove when AI is configured | ⚠️ |
| `ai-assistant.service.ts:90` | Dummy AI response when no API key | Remove when API key is set | ⚠️ |
| `email.service.ts:59` | Falls back to console.log | Requires SMTP config | ⚠️ |
| `database.seeder.ts:25-132` | 7 hardcoded demo users | Remove in production | ⚠️ |

Storage audit:

| File | Storage | Data | Target |
|---|---|---|---|
| `authStore.ts` | `localStorage` | token, refreshToken, user | HTTP-only cookies |
| `api.ts` | `localStorage` | token for Bearer header | Cookie or zustand store |
| `verify-otp/page.tsx` | `localStorage` | token, user | Cookie/store |
| `admin-login/page.tsx` | `localStorage` | token, user | Cookie/store |
| `author-studio/create/page.tsx:330` | `sessionStorage` | Draft questions | Backend draft API |
| `author-studio/import/page.tsx:131` | `sessionStorage` | Imported questions | Backend draft API |

---

## Priority 3 — Phase 2: Auth Overhaul

### Backend
- [ ] Add OTP entity + service (generate, store, verify, expire)
- [ ] Add `POST /auth/send-otp` endpoint
- [ ] Add `POST /auth/verify-otp` endpoint (server-side validation)
- [ ] Add HTTP-only cookie support for JWT
  - `res.cookie('accessToken', token, { httpOnly: true, sameSite: 'strict', secure: true })`
  - Update `JwtStrategy` to extract from both `Authorization` header and cookies
  - Add `cookie-parser` middleware
- [ ] Add refresh token rotation interceptor
- [ ] Add logout session invalidation
- [ ] Update roles to include `secondaryRoles` in JWT payload

### Frontend
- [ ] Remove all `localStorage.getItem/setItem/removeItem` for auth data
- [ ] Update `api.ts` interceptor — remove localStorage token reading, add `withCredentials: true`
- [ ] Update `authStore.ts` — remove localStorage persistence, add `initialize()` that calls `/users/profile` on mount
- [ ] Remove mock OTP logic (codes `123456`, `000000`, `654321`)
- [ ] Fix `forgotPassword` — remove hardcoded email fallback
- [ ] Add proper 401 response interceptor with token refresh

---

## Priority 4 — Phase 3: Live Dashboards

### Student Dashboard (`dashboard/page.tsx`)
- ✅ Already largely live via `/analytics/dashboard`
- [ ] Verify all empty states show "No data yet" (already implemented in most places)

### Teacher/Tutor Dashboard (`dashboard/page.tsx:142-373`)
- [ ] Replace `"—"` placeholders for Active Classes and Pending Reviews
- [ ] Backend: Extend `AnalyticsService.getDashboardData()` to return teacher-specific stats:
  - `teacherCourseCount` — count of courses where the user is the creator
  - `teacherStudentCount` — distinct students enrolled in the teacher's courses
  - `pendingReviewsCount` — count of questions with status `PENDING_REVIEW` by the teacher
  - `scheduledLessonsCount` — count of upcoming `SCHEDULED` lessons for the teacher

### Parent/Children Page (`children/page.tsx`)
- [ ] Remove hardcoded stat cards (lines 85-87)
- [ ] Add backend aggregate endpoint: `GET /analytics/parent/summary` returning:
  - `totalChildren` — count of verified relationships
  - `averageProgress` — average weekly progress across all children
  - `totalStreaks` — sum of streak days
  - `topicsMastered` — total topics with >80% success rate
- [ ] Remove mock `weeklyProgress`/`subjects` fallback — fetch from real analytics data

### Admin Dashboard
- [ ] Verify platform-stats endpoint returns correct data
- [ ] Add institution-scoped metrics for institution_admin (not just platform-wide)

---

## Priority 5 — Phase 4: Backend Support System

New module: `backend/src/modules/support/`

### Entities
```
SupportTicket:
  - id: UUID (PK)
  - userId: UUID (FK -> users)
  - subject: string
  - description: text
  - category: enum (technical|billing|account|feature_request|other)
  - priority: enum (low|medium|high|critical)
  - status: enum (open|assigned|in_progress|resolved|closed)
  - assignedTo: UUID nullable (FK -> users)
  - attachmentKey: string nullable (MinIO key)
  - createdAt: timestamp
  - updatedAt: timestamp

SupportTicketMessage:
  - id: UUID (PK)
  - ticketId: UUID (FK -> support_tickets)
  - userId: UUID (FK -> users)
  - message: text
  - attachmentKey: string nullable
  - createdAt: timestamp
```

### Endpoints
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/support/tickets` | JWT | Create support ticket |
| GET | `/support/tickets` | JWT | User's own tickets |
| GET | `/support/tickets/:id` | JWT | Ticket detail with messages |
| POST | `/support/tickets/:id/messages` | JWT | Add message to ticket |
| POST | `/support/tickets/:id/attachments` | JWT | Upload attachment (MinIO) |
| GET | `/support/admin/tickets` | Admin | All tickets (filterable) |
| PATCH | `/support/admin/tickets/:id/status` | Admin | Update ticket status |
| PATCH | `/support/admin/tickets/:id/assign` | Admin | Assign ticket to admin |

### Notifications
- Ticket created → notification to all admins
- Ticket updated → notification to ticket creator
- New message → notification to other participant(s)

---

## Priority 6 — Phase 5: Support Page UX

### User Support Page (`/support`)
- [ ] Ticket creation form: subject, description, category, priority, file attachment
- [ ] Ticket history list with status badges (color-coded)
- [ ] Ticket detail view with message thread + reply form
- [ ] Help/explainer section (collapsible):
  - "How to practice effectively"
  - "How to join a school"
  - "How to create a course"
  - "How to track your progress"
  - "How to reset your password"

### Admin Support Queue (`/admin/support`)
- [ ] List all tickets with filters: status, priority, category, date range
- [ ] Assign to self or other admin
- [ ] Status workflow: open → in_progress → resolved → closed
- [ ] Ticket detail with full conversation + reply
- [ ] Unresolved ticket count badge in admin nav

---

## Priority 7 — Phase 6: Chat Module

New module: `backend/src/modules/chat/`

### Entities
```
ChatConversation:
  - id: UUID (PK)
  - type: enum (teacher_student|support)
  - participantIds: UUID[] (array of user IDs)
  - ticketId: UUID nullable (FK -> support_tickets, for support conversations)
  - createdAt: timestamp
  - updatedAt: timestamp

ChatMessage:
  - id: UUID (PK)
  - conversationId: UUID (FK -> chat_conversations)
  - senderId: UUID (FK -> users)
  - message: text
  - attachmentKey: string nullable
  - readAt: timestamp nullable
  - createdAt: timestamp
```

### Conversation Types & Permissions
| Type | Who can create | Who can participate | Rules |
|---|---|---|---|
| `teacher_student` | Teacher/Tutor | Teacher + enrolled students | Teacher initiates only |
| `support` | System (auto on ticket) | User + assigned admin | Created from ticket |
| `admin_initiated` | Super admin | Admin + any user | Proactive support |

### REST Endpoints
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/chat/conversations` | JWT | Create conversation |
| GET | `/chat/conversations` | JWT | List my conversations |
| GET | `/chat/conversations/:id` | JWT | Get conversation with messages |
| POST | `/chat/conversations/:id/messages` | JWT | Send message |
| PATCH | `/chat/conversations/:id/messages/:msgId/read` | JWT | Mark as read |

### WebSocket (Phase 6b)
- `ChatGateway` with Socket.IO
- Events: `new_message`, `message_read`, `conversation_updated`
- Join room per conversation ID

### Frontend Chat UI
- [ ] `/inbox` — conversation list with last message preview + unread badge
- [ ] Conversation view — message bubbles, timestamps, read receipts
- [ ] Message input — text + optional file attachment (MinIO)
- [ ] Chat bubble icon in navbar with unread count
- [ ] In-app notification for new messages

---

## Priority 8 — Phase 7: MinIO Migration

### Upload paths currently on local `diskStorage`

| Path | Controller | Current | Target |
|---|---|---|---|
| Institution logos | `institutions.controller.ts` `uploadLogo()` | `diskStorage` | `MinioService.uploadFile('logos', ...)` |
| Institution banners | `institutions.controller.ts` `uploadBanner()` | `diskStorage` | `MinioService.uploadFile('banners', ...)` |
| User avatars | `users.controller.ts` `uploadAvatar()` | `diskStorage` | `MinioService.uploadFile('avatars', ...)` |
| Course resources | `courses.controller.ts` | `diskStorage` | `MinioService.uploadFile('resources', ...)` |
| Library OCR uploads | `digital-library.controller.ts` | `diskStorage` | `MinioService.uploadFile('library', ...)` |
| KYC documents | `institutions.controller.ts` `uploadDocument()` | `diskStorage` | `MinioService.uploadFile('kyc', ...)` |
| Support ticket attachments | (new) | — | `MinioService.uploadFile('support', ...)` |
| Chat message attachments | (new) | — | `MinioService.uploadFile('chat', ...)` |

### Implementation pattern
```typescript
// Instead of:
const avatarUrl = `/uploads/avatars/${file.filename}`;
await this.usersService.update(req.user.id, { avatar: avatarUrl });

// Use:
const { objectName, url } = await this.minioService.uploadFile('avatars', filename, buffer, mimetype);
await this.usersService.update(req.user.id, { avatar: url, avatarKey: objectName });
```

---

## Priority 9 — Phase 8: Remove Frontend Temporary Storage

- [ ] Replace `sessionStorage` draft handoff in author-studio:
  - Add `POST /questions/draft` — save draft (creates question with `DRAFT` status)
  - Add `GET /questions/draft/:id` — retrieve draft
  - Update `create/page.tsx:330` — call backend instead of `sessionStorage`
  - Update `import/page.tsx:131` — call backend instead of `sessionStorage`
- [ ] Keep only harmless UI preferences in localStorage (theme, sidebar collapse state)

---

## Priority 10 — Phase 9: Communication Expansion

Document and implement communication channel routing:

| Event | In-App | Email | SMS | Chat |
|---|---|---|---|---|
| New chat message | ✅ | — | — | ✅ |
| Support ticket update | ✅ | ✅ | — | ✅ |
| Account created | ✅ | ✅ | — | — |
| Password reset | — | ✅ | — | — |
| New assignment | ✅ | — | — | — |
| Upcoming lesson | ✅ | — | ✅ (urgent) | — |
| KYC approved/rejected | ✅ | ✅ | — | — |

---

## Priority 11 — Phase 10: Verification

- [ ] Run `npm run build` on frontend
- [ ] Run `npm run build` on backend
- [ ] Test all role flows with empty database
- [ ] Test MinIO upload/download for each upload path
- [ ] Test ticket creation + admin response workflow
- [ ] Test chat permissions (teacher→student ✓, student→admin ✗, admin→any ✓)
- [ ] Remove/disable seed data in production
- [ ] Verify all empty states render correctly

---

## Sprint Plan

### Sprint 0 (CRITICAL — do first)
1. Fix "Unauthorized" on integration settings (add Axios refresh interceptor, debug role check)
2. Fix Edit User modal to call correct endpoint with all fields
3. Add password reset action in user management
4. Fix `findAll()` institution scoping
5. Wire notification & security settings to backend API

### Sprint 1
6. Create OTP entity + backend endpoints
7. Add HTTP-only cookie support + remove localStorage auth
8. Fix teacher/tutor dashboard real metrics

### Sprint 2
9. Support ticket backend module (entities + endpoints)
10. Support ticket frontend pages (user + admin)

### Sprint 3
11. Chat module backend (entities + endpoints)
12. Chat frontend inbox UI

### Sprint 4
13. MinIO migration for remaining uploads
14. Remove sessionStorage from author-studio
15. Communication routing documentation

### Sprint 5
16. Full build verification
17. Role flow testing
18. Seed data cleanup
