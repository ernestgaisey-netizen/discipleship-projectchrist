# DisciplePath — Migration Map
## Node.js/Express → PHP Laravel · DisciplePath.jsx → React Router SPA

---

## Part 1 — Backend Route Comparison

Every Express route from `disciplepath_backend.js` mapped to its Laravel equivalent.

Legend: ✅ Direct replacement · 🔄 Renamed/restructured · ➕ New in Laravel · ❌ Removed

### Authentication (`/api/v1/auth/`)

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/auth/register` | POST | `/v1/auth/register` | POST | ✅ Same contract |
| 2 | `/api/v1/auth/login` | POST | `/v1/auth/login` | POST | 🔄 Returns Sanctum token instead of JWT pair; adds `mfa_required` path |
| 3 | `/api/v1/auth/refresh` | POST | *(removed)* | — | ❌ Sanctum tokens are long-lived; no refresh cycle needed |
| 4 | `/api/v1/auth/logout` | POST | `/v1/auth/logout` | POST | ✅ Revokes Sanctum token |
| 5 | `/api/v1/auth/me` | GET | `/v1/auth/me` | GET | ✅ |
| 6 | `/api/v1/auth/me` | PATCH | `/v1/auth/profile` | PUT | 🔄 Path renamed; adds `bio`, `timezone` fields |
| 7 | `/api/v1/auth/change-password` | POST | `/v1/auth/password` | PUT | 🔄 Path shortened |
| 8 | `/api/v1/auth/forgot-password` | POST | `/v1/auth/forgot-password` | POST | ✅ Now sends real email via Laravel Mail |
| 9 | `/api/v1/auth/reset-password` | POST | `/v1/auth/reset-password` | POST | ✅ Full token verification via Laravel Password Broker |
| — | *(not in original)* | — | `/v1/auth/mfa/verify-login` | POST | ➕ TOTP second-factor step |
| — | *(not in original)* | — | `/v1/auth/mfa/setup` | GET | ➕ Returns QR code + secret |
| — | *(not in original)* | — | `/v1/auth/mfa/enable` | POST | ➕ Verifies code, activates MFA |
| — | *(not in original)* | — | `/v1/auth/mfa/disable` | POST | ➕ Deactivates MFA |

**Auth architecture change**: Node.js issued a short-lived JWT (15 min) plus a long-lived refresh token (30 days) stored hashed in a `refresh_tokens` table and rotated on use. Laravel Sanctum issues a single long-lived API token stored in `personal_access_tokens`. The `dp_token` localStorage key replaced `pc_token`.

---

### Courses (`/api/v1/courses/`)

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/courses` | GET | `/v1/courses` | GET | ✅ Adds `?level=` and `?search=` filters |
| 2 | `/api/v1/courses/:id` | GET | `/v1/courses/{id}` | GET | ✅ Includes user progress if authenticated |
| 3 | `/api/v1/courses` | POST | `/v1/courses` | POST | ✅ Admin only |
| 4 | `/api/v1/courses/:id` | PUT | `/v1/courses/{id}` | PUT | ✅ Admin only |
| 5 | `/api/v1/courses/:id` | DELETE | `/v1/courses/{id}` | DELETE | ✅ Admin only |
| — | *(not in original)* | — | `/v1/courses/{id}/thumbnail` | POST | ➕ Multipart thumbnail upload |
| — | *(not in original)* | — | `/v1/courses/{id}/enroll` | POST | ➕ Moved from enrollments prefix |
| — | *(not in original)* | — | `/v1/courses/{id}/unenroll` | DELETE | ➕ Moved from enrollments prefix |
| — | *(not in original)* | — | `/v1/courses/{id}/enrollment-status` | GET | ➕ |
| — | *(not in original)* | — | `/v1/courses/{courseId}/progress` | GET | ➕ Per-module progress + percentage |

---

### Modules (`/api/v1/modules/`)

The Node.js backend defined a modules route file in `app.js` (`app.use('/api/v1/modules', moduleRoutes)`) but the controller was not included in the source file. Laravel implements all module operations:

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/modules` | POST | `/v1/courses/{courseId}/modules` | POST | 🔄 Course-scoped URL |
| 2 | `/api/v1/modules/:id` | PUT | `/v1/modules/{id}` | PUT | ✅ |
| 3 | `/api/v1/modules/:id` | DELETE | `/v1/modules/{id}` | DELETE | ✅ |
| — | *(not in original)* | — | `/v1/modules/{id}/duplicate` | POST | ➕ |
| — | *(not in original)* | — | `/v1/modules/reorder` | POST | ➕ Bulk order update |
| — | *(not in original)* | — | `/v1/modules/{id}/materials` | POST | ➕ Protected file upload |

---

### Exams (`/api/v1/exams/`)

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/exams/:moduleId` | GET | `/v1/exams/module/{moduleId}` | GET | 🔄 Path clarified; both strip `correct_answer` |
| 2 | `/api/v1/exams/:examId/submit` | POST | `/v1/exams/{examId}/submit` | POST | ✅ Same gating logic via `ExamGradingService` |
| 3 | `/api/v1/exams/:examId/attempts` | GET | `/v1/exams/{examId}/attempts` | GET | ✅ |
| — | *(not in original)* | — | `/v1/exams/module/{moduleId}/question-bank` | GET | ➕ Admin: full questions with answers |
| — | *(not in original)* | — | `/v1/exams/{examId}/questions` | POST | ➕ Admin CRUD |
| — | *(not in original)* | — | `/v1/exams/questions/{id}` | PUT/DELETE | ➕ Admin CRUD |
| — | *(not in original)* | — | `/v1/exams/questions/{id}/approve` | POST | ➕ Approve AI-generated question |
| — | *(not in original)* | — | `/v1/exams/questions/{id}/reject` | POST | ➕ Reject AI-generated question |

**Exam gating change**: Node.js called `CALL sp_check_exam_gate(user_id, exam_id)` — a MySQL stored procedure — to unlock the next module. Laravel replaces this with `ExamGradingService::grade()` which updates `module_progress` directly in PHP, eliminating the stored procedure dependency.

---

### Enrollments (`/api/v1/enrollments/`)

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/enrollments` | GET | `/v1/my-enrollments` | GET | 🔄 Path renamed |
| 2 | `/api/v1/enrollments` | POST | `/v1/courses/{id}/enroll` | POST | 🔄 Course-scoped URL |
| 3 | `/api/v1/enrollments/:courseId` | DELETE | `/v1/courses/{id}/unenroll` | DELETE | 🔄 Course-scoped URL |

---

### Progress (`/api/v1/progress/`)

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/progress` | GET | `/v1/dashboard` | GET | 🔄 Renamed; returns fuller stats |
| 2 | `/api/v1/progress/:moduleId` | POST | `/v1/progress/{moduleId}/complete` | POST | 🔄 Action made explicit in path |
| — | *(not in original)* | — | `/v1/progress/{moduleId}/start` | POST | ➕ Explicit `in_progress` state |

---

### AI (`/api/v1/ai/`)

| # | Node.js / Express | Method | Laravel Endpoint | Method | Notes |
|---|-------------------|--------|-----------------|--------|-------|
| 1 | `/api/v1/ai/generate-quiz` | POST | `/v1/ai/generate-questions` | POST | 🔄 Renamed; **now saves to DB as `pending`** instead of returning raw JSON. Admin must approve each question. |
| 2 | `/api/v1/ai/recommendations` | POST | `/v1/ai/recommendations` | GET | 🔄 POST → GET (idempotent read) |
| 3 | `/api/v1/ai/summarize-module` | POST | `/v1/ai/summarize/{moduleId}` | GET | 🔄 POST with body → GET with path param |

**Critical security change on AI questions**: The original `generate-quiz` returned generated questions directly in the response as raw JSON — there was no persistence and no admin gate. The Laravel implementation saves all generated questions with `status=pending`. Students never see pending questions. An admin must explicitly call `POST /v1/exams/questions/{id}/approve` for each question before it appears in any student exam.

---

### Admin (`/api/v1/admin/`)

The original admin routes file was referenced in `app.js` but its implementation was not included in the source. All admin functionality is new in Laravel:

| Laravel Endpoint | Method | Description |
|-----------------|--------|-------------|
| `/v1/admin/dashboard` | GET | ➕ Aggregate stats |
| `/v1/admin/stats` | GET | ➕ Trend charts (enrollments/30d, pass rate) |
| `/v1/admin/users` | GET | ➕ Paginated with role/search filter |
| `/v1/admin/users/{id}` | GET/POST/PUT | ➕ User CRUD |
| `/v1/admin/users/{id}/deactivate` | PATCH | ➕ |
| `/v1/admin/users/{id}/reactivate` | PATCH | ➕ |
| `/v1/badges` | GET/POST | ➕ Badge management |
| `/v1/badges/{id}` | PATCH/DELETE | ➕ |
| `/v1/admin/pending-content` | GET | ➕ Moderation queue |
| `/v1/admin/posts/{id}/moderate` | POST | ➕ approve/reject |
| `/v1/admin/comments/{id}/moderate` | POST | ➕ approve/reject |
| `/v1/admin/audit-logs` | GET | ➕ |
| `/v1/admin/exception-logs` | GET | ➕ |
| `/v1/admin/exception-logs/{id}/resolve` | PATCH | ➕ |

---

### Entirely New Route Groups (no equivalent in Node.js)

| Group | Endpoints | Why added |
|-------|-----------|-----------|
| **Certificates** | `/v1/certificates`, `/v1/certificates/verify/{code}`, `/v1/certificates/{id}/download`, `/v1/certificates/issue` | PDF certificates with `barryvdh/laravel-dompdf` |
| **Notifications** | `/v1/notifications`, `/unread-count`, `/mark-all-read`, `/{id}/read`, `/{id}` DELETE, `/broadcast` | In-app notification system |
| **Community** | `/v1/community/posts` (CRUD), `/comments` (CRUD), `/like/{type}/{id}`, `/report` | Community discussion board |
| **Mentorship** | 14 endpoints covering profiles, requests, sessions, goals, action points | Full mentorship workflow |
| **Files** | `/v1/upload/avatar`, `/v1/files/{path}` | Avatar upload, auth-gated file serving |
| **Health** | `/api/health` | Moved out of `/v1` prefix; no auth required |

---

### Infrastructure Replaced

| Node.js Stack | Laravel Equivalent |
|---------------|-------------------|
| `jsonwebtoken` (JWT, 15 min + 30 day refresh) | Laravel Sanctum (long-lived API token in `personal_access_tokens`) |
| `bcryptjs` | Laravel `Hash::make()` (bcrypt) |
| `express-validator` | Laravel Form Request validation |
| `mysql2` raw queries + transactions | Eloquent ORM + DB transactions |
| `multer` file uploads | Laravel `$request->file()` + Storage disk |
| `nodemailer` / SendGrid | Laravel Mail with SMTP |
| `winston` logger + `logs/` files | Laravel `Log` facade + `storage/logs/` |
| `express-rate-limit` | Laravel `ThrottleRequests` middleware |
| `ioredis` / Redis (cache) | Not required (Hostinger-compatible file cache) |
| AWS S3 (media) | Local filesystem (`storage/app/public/`) |
| `helmet` security headers | Laravel `TrustProxies` + server-level |
| MySQL stored proc `sp_check_exam_gate` | `ExamGradingService::grade()` (pure PHP) |
| `morgan` HTTP logging | Laravel audit log + `ExceptionLogService` |
| Docker / docker-compose | Hostinger shared hosting (no containers) |

---

## Part 2 — Frontend Component Map

Every component and page from `DisciplePath.jsx` (the original 662KB monolith) mapped to its new file.

### Global Assets

| DisciplePath.jsx | New File | Change |
|-----------------|----------|--------|
| `const CSS` (inline `<style>` injection, ~380 lines) | `resources/js/styles/disciplepath.css` | Extracted to standalone CSS file imported in `main.jsx`; CSS custom properties renamed from `--navy` → `--dp-navy` etc. |
| Google Fonts import (inside CSS string) | `resources/views/app.blade.php` `<head>` | Loaded at the HTML level instead of via JS injection |
| `renderContent(raw)` utility | Used inline via `dangerouslySetInnerHTML={{ __html: ... }}` in `ModulePage.jsx` | No standalone file; logic is trivial |

---

### Layout Components

| DisciplePath.jsx | New File | Change |
|-----------------|----------|--------|
| `NavBar({user, nav, logout, glass})` | `resources/js/layouts/Navbar.jsx` | Converted `nav()` state calls to `<Link>` / `useNavigate()`. Sticky positioning preserved. |
| `NotificationBell({nav})` | Merged into `Navbar.jsx` | Bell icon with unread count badge is part of the navbar component |
| `UserMenu({user, nav, logout})` | Merged into `Navbar.jsx` | Avatar dropdown is part of the navbar component |
| *(no footer in original)* | `resources/js/layouts/Footer.jsx` | ➕ New: scripture quote, navigation links, copyright |

---

### Shared / Common Components

| DisciplePath.jsx | New File | Change |
|-----------------|----------|--------|
| `ScriptureParticles()` | Kept only in `HomePage.jsx` inline | Removed from all other pages (performance) |
| *(inline spinner `<div className="spin">`)* | `resources/js/components/common/Loader.jsx` | ➕ Extracted to reusable component |
| *(inline modal pattern repeated ~8×)* | `resources/js/components/common/Modal.jsx` | ➕ Single reusable modal with ESC-to-close |
| *(inline error/success banners repeated)* | `resources/js/components/common/Alert.jsx` | ➕ Single reusable alert with auto-dismiss |
| *(inline empty-state divs)* | `resources/js/components/common/EmptyState.jsx` | ➕ |
| `.pb` / `.pb-fill` CSS classes | `resources/js/components/common/ProgressBar.jsx` | ➕ React component wrapping the CSS |

---

### Pages

| DisciplePath.jsx Component | New File | Routing | Key Changes |
|---------------------------|----------|---------|-------------|
| `HomePage({user, nav, platformStats})` | `pages/HomePage.jsx` | `/` | Stats fetched from `GET /v1/admin/dashboard`; hero CTA links to React Router paths |
| `AuthPage({nav, login})` — combined login + register tabs | Split into two files: `pages/LoginPage.jsx` + `pages/RegisterPage.jsx` | `/login`, `/register` | Separated for clean URL routing; MFA second-step handled inside `LoginPage.jsx` |
| `SecurityPage({user, nav})` — change password + MFA setup | Merged into `pages/ProfilePage.jsx` as Tab 2 (Password) + Tab 3 (Security) | `/profile` | Three-tab layout: Profile / Password / Security |
| `Dashboard({user, nav, ...})` | `pages/MyLearningPage.jsx` | `/my-learning` | Fetches live data from `/v1/my-enrollments` + `/v1/courses/{id}/progress`; no prop-drilling |
| `CoursesPage({user, nav, enroll, enrollments, ...})` | `pages/CoursesPage.jsx` | `/courses` | Level filter and search use `courseService.list()`; enroll button fires `enrollmentService.enroll()` |
| `ModulePage({user, nav, mod, course, enrollments, ...})` | `pages/ModulePage.jsx` | `/modules/:id` | Module ID read from URL param; content rendered via `dangerouslySetInnerHTML`; scripture refs displayed as cards |
| `ExamPage({user, nav, examState, setResults, ...})` | `pages/ExamPage.jsx` | `/exam/:moduleId` | Intro → timer → questions → results: all in one component; no more `examState` prop threading |
| `ResultsPage({user, nav, results, ...})` | Merged into `pages/ExamPage.jsx` | *(same route)* | Results screen is a conditional view within `ExamPage` after submission; no separate route needed |
| `AdminPage({user, nav, ...})` — monolith with 9 internal tabs | Split into four admin pages (see below) | `/admin*` | Each tab becomes its own route and file |
| └─ Overview tab | `pages/AdminDashboardPage.jsx` | `/admin` | Stats cards + quick links + pending content preview |
| └─ Users tab | `pages/AdminUsersPage.jsx` | `/admin/users` | Full CRUD with search/filter, edit modal, deactivate/reactivate |
| └─ `AdminCommunityTab()` | `pages/AdminCommunityPage.jsx` | `/admin/community` | Pending posts + comments with approve/reject |
| └─ Badges tab | `pages/AdminBadgesPage.jsx` | `/admin/badges` | Badge CRUD with icon/colour picker |
| └─ Courses/Modules/Exams tabs | *(consumed by API; no dedicated admin UI page yet)* | — | Managed via API endpoints; frontend admin course builder not yet split out |
| └─ `AdminMentorshipTab()` | Exposed via API; mentor admin actions in `MentorshipPage.jsx` | — | Admin assigns mentors via the same mentorship page with role-conditional UI |
| `CertificatePage({user, nav, course, enrollments})` | `pages/CertificatesPage.jsx` | `/certificates` | Fetches from `GET /v1/certificates`; PDF download via service |
| *(public verify was a modal in CertificatePage)* | Inline `CertVerifyPage` function in `App.jsx` | `/certificates/verify/:code` | Public route; no auth; uses `useParams()` |
| `ArchPage({nav})` — architecture documentation page | Not implemented | — | Internal reference page; removed from production build |
| `CommunityPage({user, nav})` | `pages/CommunityPage.jsx` | `/community` | Paginated posts via `communityService.posts()`; create post modal; category filter |
| `CommunityPostDetail({user, nav, post, ...})` | Merged into `pages/CommunityPage.jsx` | *(same route, conditional view)* | Post detail shown inline below the post list when a post is selected |
| `MentorshipPage({user, nav})` — student view | `pages/MentorshipPage.jsx` | `/mentorship` | Two tabs: Browse Mentors / My Mentorship; request modal |
| `MentorDashboardPage({user, nav})` — mentor/admin view | Merged into `pages/MentorshipPage.jsx` | *(same route, role-conditional)* | Mentor users see their active requests and sessions in the same page with role check |
| *(not in original)* | `pages/ForgotPasswordPage.jsx` | `/forgot-password` | ➕ |
| *(not in original)* | `pages/NotificationsPage.jsx` | `/notifications` | ➕ Full notifications page |
| *(not in original)* | `pages/NotFoundPage.jsx` | `*` | ➕ Psalm 119:105 scripture |

---

### Application Shell

| DisciplePath.jsx | New File | Change |
|-----------------|----------|--------|
| `DisciplePathApp()` — `useState('home')` string-based page state machine with `nav(pageName)` callback prop-drilled to every component | `resources/js/App.jsx` with `<BrowserRouter>` + React Router v6 `<Routes>` | URLs instead of page strings; `<Link>` instead of `nav()` calls; `RequireAuth` / `RequireAdmin` guards at route level; no prop drilling for navigation |
| `localStorage.getItem('pc_token')` | `localStorage.getItem('dp_token')` | Key renamed |
| `fetch('/api/v1/...', { headers: { Authorization: ... } })` inline in every component | `resources/js/services/apiClient.js` + 8 domain service files | All API calls centralised; token attached automatically |

---

### New Infrastructure Files (no original equivalent)

| New File | Purpose |
|----------|---------|
| `resources/js/main.jsx` | React 18 `createRoot` entry point |
| `resources/js/config/api.js` | `API_BASE`, `TOKEN_KEY`, `USER_KEY` constants |
| `resources/js/hooks/useAuth.js` | `useAuth()` hook with token refresh |
| `resources/js/services/apiClient.js` | Fetch wrapper with Bearer token, error normalisation |
| `resources/js/services/authService.js` | All auth operations |
| `resources/js/services/courseService.js` | Course + module operations |
| `resources/js/services/examService.js` | Exam load, submit, question management |
| `resources/js/services/enrollmentService.js` | Enroll/unenroll/status |
| `resources/js/services/progressService.js` | Start/complete/dashboard |
| `resources/js/services/notificationService.js` | Notifications CRUD |
| `resources/js/services/communityService.js` | Community CRUD + likes + reports |
| `resources/js/services/mentorshipService.js` | Full mentorship workflow |
| `resources/js/services/adminService.js` | All admin operations |
