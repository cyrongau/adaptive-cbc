# Flutter Mobile App Audit Report

**Date:** 2026-06-18
**Project:** Adaptive CBC Learning Platform
**Platform:** Flutter 3.11.5 (Dart)
**Backend API:** NestJS at `http://localhost:3002/api/v1`
**Web counterpart:** Next.js at `http://localhost:3003`

---

## 1. Executive Summary

The Flutter mobile app has **51 source files** across 3 layers (core, features, shared). Of these, **13 feature areas are fully or partially implemented** and **9 screens are placeholder "Coming Soon" pages**. Compared to the web app (~65+ fully implemented pages, 200+ API endpoints), the mobile app covers roughly **35-40% of the platform's feature surface**. The most critical gaps are in teacher/tutor tooling, admin functionality, student assignments, and the question bank ecosystem.

---

## 2. What's Implemented (Working Features)

| # | Feature | Screens | Quality | Notes |
|---|---|---|---|---|
| 1 | **Auth & Onboarding** | Onboarding, Login (student PIN + email/password + social), OTP | ✅ Full | Device approval flow, 2FA, session persistence via cookies |
| 2 | **Dashboard** | Home screen with stats grid, upcoming tasks, recent activities, streak | ✅ Full | Pull-to-refresh, role-aware |
| 3 | **Subjects** | Subject list by grade, expandable topics, "Start Practice" per topic | ✅ Full | Subject-specific icons/colors |
| 4 | **Courses** | Course catalog (enrolled + available), course detail, lesson video player, offline download | ✅ Full | Modules/lessons, video/article content |
| 5 | **Practice / Quizzes** | Setup, session (MCQ + drawing canvas), results, AI explanations, brain breaks, XP | ✅ Full | DB-backed + AI fallback modes |
| 6 | **Analytics** | Stats summary, performance trend chart, weak areas, AI recommendations | ✅ Full | Uses `fl_chart` for visuals |
| 7 | **Chat** | Conversation list, real-time messaging, typing indicators, read receipts, online presence, user search | ✅ Full | WebSocket via socket.io |
| 8 | **AI Tutor** | Conversational AI chat with markdown rendering | ✅ Full | History-aware |
| 9 | **Live Classes** | Live marketplace, student meeting view, teacher broadcast, in-meeting chat | ✅ Full | LiveKit video conferencing |
| 10 | **Parent Portal** | Dashboard, children management, report generation, performance charts, PIN reset, device approval | ✅ Full | Push alert integration |
| 11 | **Profile & Settings** | User info, push toggle, biometric toggle, logout | ✅ Full | Basic |
| 12 | **Gamification** | Badges grid, streak tracker, brain break mini-game | ✅ Full | |
| 13 | **Offline Support** | SQLite cache for GET, sync queue for POST/PUT/DELETE, connectivity indicator | ✅ Full | |

---

## 3. Placeholder Screens (Coming Soon)

All 9 screens below show only a construction icon and "Coming Soon" message. They are wired into the full-screen menu but have **zero functionality**.

| Screen | Route | Priority |
|---|---|---|
| Digital Library | `/library` | 🔴 High |
| Question Bank | `/questions` | 🔴 High |
| Learning Materials | `/materials` | 🟡 Medium |
| School Details | `/school` | 🟡 Medium |
| Teachers & Tutors | `/teachers` | 🟡 Medium |
| Reward Store | `/store` | 🟡 Medium |
| My Schedule | `/schedule` | 🟡 Medium |
| My Progress | `/progress` | 🟡 Medium |
| Leaderboard | `/leaderboard` | 🟡 Medium |

---

## 4. Critical Gaps vs Web App

### 4.1 Student-Facing Features Missing in Mobile

| Feature | Web Status | Mobile Status | Impact |
|---|---|---|---|
| **Question Bank** (browse, filter, submit answers, drawing canvas, skip) | ✅ Full (507 lines) | ❌ Placeholder | Students can't practice via question bank on mobile |
| **Attempt History** (per-question stats, first attempt tracking, XP breakdown) | ✅ Full (238 lines) | ❌ Missing entirely | No performance review on mobile |
| **Assignments** (view, submit, auto-grading, per-answer evaluation) | ✅ Full (770 lines) | ❌ Missing entirely | Students can't see or submit assignments |
| **Assignment Submissions** (file upload, drawing canvas answers) | ✅ Full | ❌ Missing | No assignment flow at all |
| **Games & Tournaments** (brain break games, tournaments, leaderboard) | ✅ Full (328 lines) | ❌ Missing | Only brain break within practice exists |
| **School Management** (school info, join requests, Q&A with teachers) | ✅ Full (608 lines) | ❌ Placeholder | Students can't interact with school |
| **Teachers & Tutors** (view teachers, Q&A system) | ✅ Full (570 lines) | ❌ Placeholder | Can't find/contact teachers |
| **Store / Rewards** (browse, cart, checkout, orders) | ✅ Full (1215 lines) | ❌ Placeholder | No e-commerce on mobile |
| **Digital Library** (browse/upload papers, ratings, download) | ✅ Full (679 lines) | ❌ Placeholder | No paper access on mobile |
| **My Schedule** (weekly timetable, lesson creation) | ✅ Full (503 lines) | ❌ Placeholder | No schedule view on mobile |
| **Leaderboard** (global/school, badges, tournaments) | ✅ Full (448 lines) | ❌ Placeholder | No competitive features on mobile |
| **Materials** (browse/upload/download) | ✅ Full (425 lines) | ❌ Placeholder | No material access on mobile |
| **Settings** (profile, notifications, security, parent invite, join school) | ✅ Full (395 lines) | ❌ Partial | Profile exists but limited |
| **Support Tickets** (create, view, chat-based support) | ✅ Full (567 lines) | ❌ Missing entirely | No support system on mobile |

### 4.2 Teacher / Tutor Features Missing in Mobile

| Feature | Web Status | Mobile Status | Impact |
|---|---|---|---|
| **Author Studio** (create/edit questions, diagrams, AI enhancement) | ✅ Full (1855 lines) | ❌ Missing entirely | Teachers can't author content on mobile |
| **Question Moderation** (moderation queue, AI quality scoring, approve/reject) | ✅ Full (500 lines) | ❌ Missing | No content moderation |
| **Answer Reviews** (pending/reviewed drawing canvas attempts) | ✅ Full (287 lines) | ❌ Missing | Can't review student drawings |
| **My Courses** (CRUD courses, modules, lessons, resources) | ✅ Full (80KB) | ❌ Missing | Can't manage courses on mobile |
| **Assignments** (create, AI generate, grade, evaluate answers) | ✅ Full (770 lines) | ❌ Missing | Can't create/grade assignments |
| **Students** (manage class students, view progress) | ✅ Full (248 lines) | ❌ Missing | Can't manage students |
| **Classes** (CRUD classes, timetable slots, class codes) | ✅ Full (399 lines) | ❌ Missing | Can't manage classes |
| **Financial Hub** (wallet, transactions, withdrawals) | ✅ Full (542 lines) | ❌ Missing | No financial tools |
| **Store** (manage own products as seller) | ✅ Full (1215 lines) | ❌ Missing | No seller tools |
| **KYC** (tutor verification, document upload) | ✅ Full (167 lines) | ❌ Missing | No tutor verification flow |
| **Diagrams** (upload/generate diagrams for questions) | ✅ Full (749 lines) | ❌ Missing | No diagram tooling |

### 4.3 Admin Features Missing in Mobile

| Feature | Web Status | Mobile Status | Impact |
|---|---|---|---|
| **Admin Dashboard** (platform stats) | ✅ Full (330 lines) | ❌ Missing | No admin oversight on mobile |
| **User Management** (list, filter, suspend, promote) | ✅ Full (1223 lines) | ❌ Missing | Can't manage users |
| **KYC Applications** (approve/reject) | ✅ Full (263 lines) | ❌ Missing | No KYC management |
| **Institution Management** (create/edit) | ✅ Full (239 lines) | ❌ Missing | No institution admin |
| **Financial Oversight** (stats, manage withdrawals) | ✅ Full (493 lines) | ❌ Missing | No financial admin |
| **Store Management** (products, featured, approve) | ✅ Full (487 lines) | ❌ Missing | No store admin |
| **Content Moderation** (papers, questions) | ✅ Full (586 lines) | ❌ Missing | No content admin |
| **Admin Analytics** (platform metrics, curriculum coverage, AI usage) | ✅ Full (548 lines) | ❌ Missing | No analytics |
| **Reports** (generate parameterized reports) | ✅ Full (634 lines) | ❌ Missing | No report generation |
| **Support Queue** (manage tickets, search users) | ✅ Full (549 lines) | ❌ Missing | No admin support |
| **Admin Settings** (platform config, integrations, logo, email/SMS/MPesa tests) | ✅ Full (1263 lines) | ❌ Missing | No platform configuration |
| **Join Requests** (review/approve/reject) | ✅ Full (223 lines) | ❌ Missing | No enrollment management |

### 4.4 Parent Features Missing in Mobile

| Feature | Web Status | Mobile Status | Impact |
|---|---|---|---|
| **Store** (browse, purchase) | ✅ Full | ❌ Placeholder | Can't shop on mobile |
| **Digital Library** (browse) | ✅ Full | ❌ Placeholder | Can't access library |
| **Course Hub** (browse courses, timetable) | ✅ Full (707 lines) | ❌ Missing | No course browsing for parents |
| **Settings** (profile, security) | ✅ Full (395 lines) | ❌ Partial | Only basic profile exists |

---

## 5. Feature Comparison Matrix

```
Feature                          Web          Mobile        Gap
─────────────────────────────────────────────────────────────
Auth & Onboarding                ✅ FULL       ✅ FULL       ─
Dashboard (role-aware)           ✅ FULL       ✅ FULL       ─
Subjects by Grade                ✅ FULL       ✅ FULL       ─
Courses (browse/enroll)          ✅ FULL       ✅ FULL       ─
Course Detail & Lessons          ✅ FULL       ✅ FULL       ─
Lesson Video Player              ✅ FULL       ✅ FULL       ─
Adaptive Practice                ✅ FULL       ✅ FULL       ─
Practice: Drawing Canvas         ✅ FULL       ✅ PARTIAL    Mobile uses signature pkg
Practice: AI Explanations        ✅ FULL       ✅ FULL       ─
Practice: Brain Breaks           ✅ FULL       ✅ FULL       ─
Analytics & Stats                ✅ FULL       ✅ FULL       ─
Chat / Messaging                 ✅ FULL       ✅ FULL       ─
AI Tutor (Socratic)              ✅ FULL       ✅ FULL       ─
Live Classes (video)             ✅ FULL       ✅ FULL       ─
Parent Portal                    ✅ FULL       ✅ FULL       ─
Profile & Settings               ✅ FULL       ⚠️ PARTIAL   Web has more settings
Gamification / Badges            ✅ FULL       ✅ FULL       ─
Offline Support                  ❌ N/A        ✅ FULL       Mobile advantage

────────── CRITICAL GAPS ──────────

Question Bank                    ✅ FULL       ❌ PLACEHOLDER
Attempt History                  ✅ FULL       ❌ MISSING
Assignments (view/submit)        ✅ FULL       ❌ MISSING
Assignment Grading               ✅ FULL       ❌ MISSING
Author Studio (questions)        ✅ FULL       ❌ MISSING
Question Moderation              ✅ FULL       ❌ MISSING
Answer Reviews                   ✅ FULL       ❌ MISSING
My Courses (teacher CRUD)        ✅ FULL       ❌ MISSING
Classes (teacher CRUD)           ✅ FULL       ❌ MISSING
Students (teacher mgmt)          ✅ FULL       ❌ MISSING
Financial Hub                    ✅ FULL       ❌ MISSING
Teacher Store                    ✅ FULL       ❌ MISSING
KYC Verification                 ✅ FULL       ❌ MISSING
Diagrams                         ✅ FULL       ❌ MISSING
School / Institution             ✅ FULL       ❌ PLACEHOLDER
Teachers & Tutors                ✅ FULL       ❌ PLACEHOLDER
Digital Library                  ✅ FULL       ❌ PLACEHOLDER
Store / E-commerce               ✅ FULL       ❌ PLACEHOLDER
Materials                        ✅ FULL       ❌ PLACEHOLDER
Schedule / Timetable             ✅ FULL       ❌ PLACEHOLDER
Progress Tracking                ✅ FULL       ❌ PLACEHOLDER
Leaderboard                      ✅ FULL       ❌ PLACEHOLDER
Games & Tournaments              ✅ FULL       ❌ MISSING
Support Tickets                  ✅ FULL       ❌ MISSING
Settings (full)                  ✅ FULL       ❌ PARTIAL

────────── ADMIN FEATURES ──────────

Admin Dashboard                  ✅ FULL       ❌ MISSING
User Management                  ✅ FULL       ❌ MISSING
KYC Applications                 ✅ FULL       ❌ MISSING
Institution Management           ✅ FULL       ❌ MISSING
Financial Oversight              ✅ FULL       ❌ MISSING
Store Management                 ✅ FULL       ❌ MISSING
Content Moderation               ✅ FULL       ❌ MISSING
Admin Analytics                  ✅ FULL       ❌ MISSING
Reports                          ✅ FULL       ❌ MISSING
Support Queue                    ✅ FULL       ❌ MISSING
Admin Settings                   ✅ FULL       ❌ MISSING
Join Requests                    ✅ FULL       ❌ MISSING
```

---

## 6. Architecture Comparison

| Aspect | Web (Next.js) | Mobile (Flutter) |
|---|---|---|
| **State Management** | Zustand stores | Provider (ChangeNotifier) |
| **Routing** | Next.js App Router + middleware auth guard | GoRouter with ShellRoute + redirect guards |
| **HTTP Client** | Axios with interceptors | Dio with cookie jar + offline interceptors |
| **Auth** | Cookie-based (JWT in httpOnly cookies) | Cookie-based (PersistCookieJar) |
| **Real-time** | Socket.IO client | socket_io_client |
| **Video** | LiveKit JS SDK | livekit_client |
| **Offline** | ❌ Not implemented | ✅ SQLite cache + sync queue |
| **Charts** | Chart.js / Recharts | fl_chart |
| **Maps** | ❌ N/A | ❌ N/A |
| **Push Notifications** | ❌ Not implemented | ✅ FCM + local notifications |
| **AI Integration** | Direct API calls | Direct API calls |
| **File Upload** | Standard FormData | Dio FormData |
| **Image Caching** | Next.js Image | cached_network_image |

---

## 7. Recommended Priority for Implementation

### Phase 1 — High Priority (Student Essentials)
These are the features students need most for daily use:

1. **Question Bank** (`/questions`) — Browse/filter questions, submit answers (MCQ + drawing canvas), skip, view results. This is the most-used study feature.
2. **Assignments** (`/assignments`) — View pending/completed assignments, submit answers, see grades and comments.
3. **Attempt History** (`/progress` or dedicated page) — Per-question stats, first-attempt accuracy, XP tracking.
4. **Leaderboard** (`/leaderboard`) — Global and school leaderboards, badges display.

### Phase 2 — Medium Priority (Teacher Essentials)
Mobile access for teachers to manage content on-the-go:

1. **Author Studio Lite** — View questions, edit basic fields, approve/reject pending questions.
2. **Answer Reviews** — View pending drawing canvas submissions, mark correct/incorrect.
3. **Assignments Management** — Create assignments, view submissions, grade.
4. **Class Management** — View classes, add/remove students.

### Phase 3 — Lower Priority (Admin, Placeholder Screens)

1. **Digital Library** — Browse and view papers.
2. **Store** — Browse products (read-only for students).
3. **Schedule** — View weekly timetable.
4. **Materials** — Browse materials.
5. **School** — View school info.
6. **Teachers** — View teachers list.
7. **All Admin pages** — Admin dashboard, user management, settings, etc.

---

## 8. Notable Observations

1. **Mobile has offline support, web does not.** The Flutter app's SQLite cache and sync queue is a significant architectural advantage. This should be preserved and potentially enhanced.

2. **Drawing canvas differs between platforms.** Web uses tldraw (full-featured whiteboard), mobile uses the `signature` package (basic signature pad). They are not interchangeable — mobile drawing answers may need a different review workflow.

3. **The web app has no push notification support.** Mobile has FCM integration that could serve as a reference for adding it to the web.

4. **The mobile app shares the same backend API** as the web app — all new mobile features just need UI implementation without backend changes (the endpoints already exist).

5. **Missing file:** `DrawingCanvas.tsx` exists on web but mobile's `signature` package produces simpler outputs. Consider adding a proper whiteboard widget for mobile (e.g., `flutter_draw` or custom `CustomPainter`).

6. **The mobile app's full-screen menu** lists 17 navigation items, but only 8 lead to functional pages — the remaining 9 are "Coming Soon" placeholders.

---

## 9. File Count Summary

| Area | Web | Mobile |
|---|---|---|
| Total source files | ~200+ | 51 |
| Fully implemented pages | ~65+ | ~20 |
| Placeholder pages | 2 | 9 |
| Unique API endpoints consumed | ~200+ | ~60 |
| Service/providers | ~20 | 11 |
| Shared components/widgets | ~50+ | 2 |
| Mobile-only features | 0 | Offline support, push notifications |
