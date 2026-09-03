# DisciplePath — Full-Stack Development Plan
## React 18 + Laravel 12 + MySQL

---

## 1. Current Project Structure Found

```
discipleship.projectchrist.org/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/           ← Partial API controllers (AuthController, CourseController, etc.)
│   │   │   ├── Auth/          ← Breeze auth controllers (to be replaced)
│   │   │   ├── Admin/         ← UserController stub
│   │   │   └── *.php          ← Inertia-based Blade/Vue controllers (to be replaced)
│   │   ├── Middleware/        ← HandleInertiaRequests (to be replaced)
│   │   └── Requests/          ← Auth/LoginRequest, ProfileUpdateRequest
│   ├── Models/                ← Mixed set: Badge, Certificate, Community*, Mentorship*, etc.
│   └── Providers/AppServiceProvider.php
├── resources/
│   ├── js/
│   │   ├── Components/        ← Vue components (to be replaced with React)
│   │   ├── Layouts/           ← Vue layouts (to be replaced)
│   │   ├── Pages/             ← Vue/Inertia pages (to be replaced)
│   │   ├── app.js             ← Vue/Inertia entry (to be replaced)
│   │   └── bootstrap.js
│   ├── css/app.css
│   └── views/app.blade.php    ← Inertia template (to be updated for React SPA)
├── database/
│   ├── migrations/            ← Mixed set (LMS tables, permission tables - to be replaced)
│   └── seeders/               ← Minimal/empty seeders
├── routes/
│   ├── api.php                ← Minimal (to be completely rewritten)
│   └── web.php                ← Inertia routes (to be simplified for SPA)
├── composer.json              ← Has Sanctum, Inertia, JWT, Spatie-Permission
├── package.json               ← Vue/Inertia/Tailwind (to be replaced with React)
└── vite.config.js             ← Vue plugin (to be replaced with React plugin)
```

**Status:** Existing project uses Vue/Inertia. All frontend files will be replaced with React. Backend will be completely rebuilt under `Api/V1` namespace.

---

## 2. Frontend Structure to Create

```
resources/js/
├── main.jsx                        ← React 18 entry point
├── App.jsx                         ← React Router setup + auth context
├── config/
│   └── api.js                      ← Base URL, token helpers, auth header helpers
├── services/
│   ├── apiClient.js                ← Axios-based HTTP client (GET/POST/PATCH/PUT/DELETE)
│   ├── authService.js              ← Register, login, logout, me, MFA, password
│   ├── courseService.js            ← CRUD, thumbnail upload
│   ├── moduleService.js            ← CRUD, material upload/download, reorder
│   ├── examService.js              ← Load exam, submit, attempts, question bank
│   ├── enrollmentService.js        ← Enroll, list, complete
│   ├── progressService.js          ← Start, complete, update notes
│   ├── adminService.js             ← Dashboard, users, audit, analytics
│   ├── aiService.js                ← Generate questions, quiz, recommendations, summary
│   ├── communityService.js         ← Posts, comments, likes, moderation
│   ├── mentorshipService.js        ← Mentors, requests, sessions, goals
│   └── notificationService.js      ← List, mark read
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              ← Top navigation with role-based links
│   │   ├── Footer.jsx              ← Site footer
│   │   └── Sidebar.jsx             ← Collapsible sidebar for dashboard
│   ├── common/
│   │   ├── Button.jsx              ← btn, btn-green, btn-blue, btn-sky, btn-ghost
│   │   ├── Card.jsx                ← Standard card with lift effect
│   │   ├── Badge.jsx               ← Coloured badge chips
│   │   ├── Modal.jsx               ← Reusable modal overlay
│   │   ├── Loader.jsx              ← Spinner/loading state
│   │   ├── EmptyState.jsx          ← Empty list/no data state
│   │   └── ProgressBar.jsx         ← Animated progress bar
│   ├── course/
│   │   ├── CourseCard.jsx          ← Gradient card with emoji, level, enrollment
│   │   ├── ModuleList.jsx          ← Sidebar module list with lock/done/current states
│   │   ├── ModuleContent.jsx       ← HTML content renderer with dp-content styles
│   ├── exam/
│   │   ├── ExamQuestion.jsx        ← MCQ, True/False, Short Answer question
│   │   ├── ExamTimer.jsx           ← Countdown timer with warning state
│   │   └── ExamResultCard.jsx      ← Score display with pass/fail animation
│   ├── admin/
│   │   ├── AdminSidebar.jsx        ← Admin navigation tabs
│   │   ├── StatsCard.jsx           ← Platform statistic card
│   │   ├── UserTable.jsx           ← Paginated user management table
│   │   ├── CourseEditor.jsx        ← Course create/edit form
│   │   ├── ModuleEditor.jsx        ← Module create/edit with content/file fields
│   │   └── QuestionBank.jsx        ← Question list with AI generation panel
│   ├── community/
│   │   ├── PostCard.jsx            ← Community post with like/comment counts
│   │   └── CommentThread.jsx       ← Threaded comment list
│   ├── mentorship/
│   │   ├── MentorCard.jsx          ← Mentor profile card with request button
│   │   └── MentorRequestForm.jsx   ← Mentorship request modal form
│   └── security/
│       └── MfaSetup.jsx            ← TOTP QR + code entry component
├── pages/
│   ├── HomePage.jsx                ← Hero, particles, stats, courses preview, evangelism
│   ├── AuthPage.jsx                ← Login/Register with MFA step
│   ├── DashboardPage.jsx           ← Student dashboard with progress cards
│   ├── CoursesPage.jsx             ← Course catalogue with search/filter
│   ├── CourseDetailPage.jsx        ← Course overview + module list
│   ├── ModulePage.jsx              ← Module content + notes + go to exam
│   ├── ExamPage.jsx                ← Timed exam with question navigation
│   ├── ResultsPage.jsx             ← Score display + unlock message
│   ├── CertificatePage.jsx         ← Certificate display + print
│   ├── AdminPage.jsx               ← Full admin console with tabs
│   ├── CommunityPage.jsx           ← Posts list + create + categories
│   ├── MentorshipPage.jsx          ← Mentors list + my requests/sessions
│   ├── MentorDashboardPage.jsx     ← Mentor profile + mentees + sessions
│   ├── SecurityPage.jsx            ← Password change + MFA setup/manage
│   └── ArchitecturePage.jsx        ← Platform architecture reference
└── styles/
    └── disciplepath.css            ← Global styles from DisciplePath reference
```

---

## 3. Backend Laravel Structure to Create

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── V1/
│   │           ├── AuthController.php
│   │           ├── MfaController.php
│   │           ├── CourseController.php
│   │           ├── ModuleController.php
│   │           ├── ExamController.php
│   │           ├── EnrollmentController.php
│   │           ├── ProgressController.php
│   │           ├── CertificateController.php
│   │           ├── NotificationController.php
│   │           ├── AiController.php
│   │           ├── CommunityController.php
│   │           ├── MentorshipController.php
│   │           ├── AdminController.php
│   │           └── FileController.php
│   ├── Middleware/
│   │   ├── EnsureUserIsActive.php
│   │   ├── CheckRole.php
│   │   └── LogApiRequests.php
│   └── Requests/
│       ├── Auth/RegisterRequest.php
│       ├── Auth/LoginRequest.php
│       ├── Course/StoreCourseRequest.php
│       ├── Module/StoreModuleRequest.php
│       └── Exam/SubmitExamRequest.php
├── Models/
│   ├── User.php, Course.php, Module.php
│   ├── Exam.php, ExamQuestion.php, ExamAttempt.php
│   ├── Enrollment.php, ModuleProgress.php
│   ├── Badge.php, UserBadge.php
│   ├── Notification.php, AuditLog.php, ExceptionLog.php
│   ├── CommunityPost.php, CommunityComment.php, CommunityLike.php
│   ├── MentorProfile.php, MentorshipRequest.php
│   ├── MentorshipSession.php, MentorshipGoal.php, MentorshipActionPoint.php
│   └── Certificate.php
└── Services/
    ├── ExamGradingService.php      ← Core gating logic
    ├── AnthropicService.php        ← Claude AI integration
    ├── CertificateService.php      ← Certificate generation
    ├── BadgeService.php            ← Badge award logic
    ├── NotificationService.php     ← Notification dispatch
    └── AuditLogService.php         ← Audit logging
```

---

## 4. Database Migrations to Create

| # | Migration File | Purpose |
|---|---------------|---------|
| 1 | `2026_06_14_000001_create_disciplepath_schema.php` | Users, courses, modules, exams, questions |
| 2 | `2026_06_14_000002_create_enrollment_tables.php` | Enrollments, module_progress, exam_attempts |
| 3 | `2026_06_14_000003_create_badge_tables.php` | Badges, user_badges |
| 4 | `2026_06_14_000004_create_notification_tables.php` | Notifications |
| 5 | `2026_06_14_000005_create_audit_tables.php` | Audit logs, exception logs |
| 6 | `2026_06_14_000006_create_community_tables.php` | Community posts, comments, likes |
| 7 | `2026_06_14_000007_create_mentorship_tables.php` | All mentorship tables |
| 8 | `2026_06_14_000008_create_certificate_tables.php` | Certificates |

> **Important:** Run `php artisan migrate:fresh --seed` to drop all old tables and apply the fresh schema. Old migrations from the previous LMS setup will be superseded.

---

## 5. API Routes to Implement

All routes under `/api/v1`. See `API_REFERENCE.md` for full documentation.

**Auth:** register, login, logout, me, update-profile, change-password, forgot-password, reset-password, MFA setup/enable/disable/verify  
**Courses:** CRUD, thumbnail upload  
**Modules:** CRUD, duplicate, reorder, material upload, protected material download  
**Exams:** get by module, attempts, submit, question bank CRUD, AI generate, approve/reject  
**Enrollments:** enroll, list, complete  
**Progress:** get, start, complete, update notes  
**Certificates:** list, get by course, issue, verify by code  
**Notifications:** list, mark read, mark all read  
**AI:** generate question bank, generate quiz, recommendations, summarize module  
**Community:** posts CRUD, like, comments, moderation  
**Mentorship:** mentors, profile, requests, sessions, goals, action points, analytics  
**Admin:** dashboard, users, roles, audit log, exception log, analytics, notifications  
**Health:** `GET /api/v1/health`

---

## 6. Models and Relationships

### User
- `hasMany` → Enrollment, ModuleProgress, ExamAttempt, Notification, AuditLog, CommunityPost, CommunityComment, MentorshipRequest, MentorshipSession (as mentor/student)
- `hasOne` → MentorProfile
- `belongsToMany` → Badge (through user_badges)

### Course
- `hasMany` → Module, Enrollment, Badge
- `belongsTo` → User (creator)

### Module
- `belongsTo` → Course
- `hasOne` → Exam
- `hasMany` → ModuleProgress

### Exam
- `belongsTo` → Module
- `hasMany` → ExamQuestion, ExamAttempt

### Enrollment
- `belongsTo` → User, Course
- `hasOne` → Certificate

### CommunityPost
- `belongsTo` → User
- `hasMany` → CommunityComment, CommunityLike
- `belongsTo` → CommunityComment (accepted_comment)

### MentorshipRequest
- `belongsTo` → User (student), User (preferred_mentor), User (assigned_mentor)

---

## 7. React Pages/Components to Build

### Pages (15 total)
1. **HomePage** — Hero with scripture particles, stats, course preview, evangelism steps, CTA
2. **AuthPage** — Login/Register with show/hide password, MFA step, role redirect
3. **DashboardPage** — Enrolled courses with progress, badges, recommended courses, notifications
4. **CoursesPage** — Course catalogue, search/filter, enrollment status cards
5. **CourseDetailPage** — Overview, module list with lock/unlock state, enrollment CTA
6. **ModulePage** — HTML content, scripture refs, notes, protected materials, exam button
7. **ExamPage** — Timed exam with MCQ/TF questions, no correct answers shown before submit
8. **ResultsPage** — Score, pass/fail, points, time taken, next module unlock, retry
9. **CertificatePage** — Certificate display with print/download, verification
10. **AdminPage** — Full console with 13 tabs: overview, users, courses, modules, exams, question bank, analytics, notifications, audit log, exception log, community, mentorship, API reference
11. **CommunityPage** — Posts list, create post, categories, like, comment, search
12. **MentorshipPage** — Available mentors, my request status, sessions, goals, action points
13. **MentorDashboardPage** — Mentor profile editor, mentees list, session creation, goals
14. **SecurityPage** — Change password, MFA setup/enable/disable, security activity
15. **ArchitecturePage** — Platform stack and API summary

---

## 8. Authentication Strategy

- **Method:** Laravel Sanctum personal access tokens (API token mode, not cookie-based)
- **Token storage:** `localStorage` (token key: `dp_token`)
- **Token injection:** Every API request sends `Authorization: Bearer {token}`
- **Login flow:** POST /api/v1/auth/login → returns `{ token, user, mfa_required }`
  - If `mfa_required = true` → frontend shows MFA code step → POST /api/v1/auth/mfa/verify-login
- **MFA:** TOTP (Google Authenticator compatible) via `pragmarx/google2fa`
- **Roles:** `student`, `admin`, `pastor`, `mentor` — stored on `users.role`
- **Sub-roles:** `super_admin`, `user_admin`, `content_admin`, `course_admin`, `community_admin`, `mentor_admin` — stored on `users.sub_role`
- **Middleware chain:** `auth:sanctum` → `active.user` → optional `role:admin`
- **Inactive user:** Returns 403 on all protected routes
- **Token refresh:** Users re-login when token expires (Sanctum tokens don't auto-refresh)

---

## 9. Exam-Gating Strategy

```
Enroll → Module 1 unlocked
                    ↓
            Study Module 1
                    ↓
           Take Module 1 Exam
                    ↓
     [Pass ≥ 70%] → Mark Module 1 complete → Unlock Module 2
     [Fail < 70%] → Module 2 stays locked, can retry (up to max_attempts)
     [Max attempts reached and failed] → Module 2 permanently locked
                    ↓
            Study Module 2
                    ↓ (continues for all modules)
                    ↓
     All modules complete → Course complete → Certificate eligible
```

**Implementation in `ExamGradingService.php`:**
1. Load exam + questions WITH correct answers (server-side only)
2. Grade MCQ: exact index match
3. Grade True/False: boolean match
4. Grade Short Answer: keyword matching (+ optional AI grading via Anthropic)
5. Calculate `score = (earned_points / total_points) * 100`
6. Determine `passed = score >= exam.pass_mark`
7. Save `ExamAttempt` record
8. If passed:
   - Mark `module_progress.status = completed`
   - Find next module by `order_index + 1` in same course
   - If next module exists: it is now accessible (no explicit "unlock" record needed — access is checked on load)
   - If no next module: mark `enrollment.completed_at = now()`
   - Trigger `CertificateService::issue()` if `course.certificate_enabled`
   - Award relevant badges via `BadgeService`
   - Create notification via `NotificationService`
9. Return result with `nextModuleUnlocked`, `score`, `passed`, `feedback`

**Module access check (on GET /api/v1/modules/{id}):**
- Module 1: always accessible if enrolled
- Module N: check that module N-1 has `module_progress.status = completed` for this user

**Correct answers:** Never returned in GET /api/v1/exams/module/{moduleId}. Only returned in POST submit response if `exam.show_answers = true`.

---

## 10. AI Integration Strategy

**Service:** `App\Services\AnthropicService`  
**HTTP Client:** Laravel HTTP Facade (Guzzle under the hood)  
**API Key:** `ANTHROPIC_API_KEY` in `.env` — never exposed to frontend  
**Model:** `claude-sonnet-4-6`  

### Endpoints:

| Route | Service Method | Description |
|-------|---------------|-------------|
| POST /api/v1/ai/generate-question-bank | `generateQuestionBank(moduleId)` | 30 mixed questions → saved as pending |
| POST /api/v1/ai/generate-quiz | `generateQuiz(moduleId, n)` | Quick quiz preview |
| POST /api/v1/ai/recommendations | `getCourseRecommendations(userId)` | Next course suggestions |
| POST /api/v1/ai/summarize-module | `summarizeModule(moduleId)` | 5-point study summary |

### Error handling:
- All AI calls wrapped in try/catch
- Failures logged to `exception_logs` with `source = 'ai'`
- Clean error returned to frontend (no stack traces)
- Short-answer fallback: keyword matching if AI fails

### Admin approval flow:
- AI-generated questions have `ai_generated = true`, `status = pending`
- Admin reviews in Question Bank tab
- POST /api/v1/exams/questions/{id}/approve → `status = approved`
- POST /api/v1/exams/questions/{id}/reject → `status = rejected`
- Only `approved` questions appear in student exams

---

## 11. Testing Checklist

See `TESTING_CHECKLIST.md` for the full manual and automated testing checklist.

**Critical automated tests (PHPUnit/Pest):**
- Authentication: register, login, inactive user blocked, token refresh
- MFA: setup, enable, login with MFA
- Course listing (public), course creation (admin only)
- Module creation, module access gating
- Enrollment → module unlock flow
- Exam load (no correct_answer in response)
- Exam submit pass → module unlocked
- Exam submit fail → module stays locked
- Max attempts enforcement
- Course completion → certificate issued
- Badge award on completion
- Community post create, approve, moderate
- Mentorship request → assign → session
- Admin dashboard access (admin only)

---

## 12. Hostinger Deployment Notes

See `HOSTINGER_DEPLOYMENT.md` for full guide.

**Key requirements:**
- PHP 8.2+ with extensions: mbstring, pdo_mysql, openssl, bcmath, json, tokenizer, xml, ctype
- MySQL 8.0+ (available on all Hostinger Business+ plans)
- Node.js 18+ for Vite build (only needed during deployment, not at runtime)
- Composer 2.x
- SSL certificate (Hostinger provides free Let's Encrypt)
- `APP_ENV=production`, `APP_DEBUG=false` in production `.env`
- Public folder must point to `disciplepath.projectchrist.org/public/`
- Run `php artisan storage:link` to link course thumbnails
- Private materials stored in `storage/app/materials/` (not public)
- Vite build outputs to `public/build/` — included in deployment

---

## Implementation Order

1. ✅ DEVELOPMENT_PLAN.md (this file)
2. Configuration (package.json, vite.config.js, composer.json, .env.example)
3. Laravel bootstrap/app.php, views/app.blade.php
4. Routes (routes/api.php, routes/web.php)
5. Database migrations (fresh schema)
6. Laravel models
7. Middleware + services
8. API controllers
9. Database seeders
10. React: config + services + CSS
11. React: layout + common components
12. React: feature components (course, exam, admin, community, mentorship, security)
13. React: all 15 page files
14. Supporting docs (HOSTINGER_DEPLOYMENT.md, API_REFERENCE.md, TESTING_CHECKLIST.md)
