# DisciplePath — API Reference

**Base URL**: `https://discipleship.projectchrist.org/api/v1`  
**Auth**: `Authorization: Bearer {token}` (Sanctum API token, stored in `localStorage` as `dp_token`)  
**Content-Type**: `application/json`

All responses follow the envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "errors": { ... } }
```

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Returns `{ status: "ok" }` |

---

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/register` | — | Register. Body: `name, email, password, password_confirmation` |
| POST | `/v1/auth/login` | — | Login. Body: `email, password`. Returns token or `{ mfa_required: true, mfa_user_id }` |
| POST | `/v1/auth/mfa/verify-login` | — | Complete MFA login. Body: `mfa_user_id, code` → returns token |
| POST | `/v1/auth/forgot-password` | — | Send password reset email. Body: `email` |
| POST | `/v1/auth/reset-password` | — | Reset password. Body: `token, email, password, password_confirmation` |
| GET | `/v1/auth/me` | ✓ | Current authenticated user |
| PUT | `/v1/auth/profile` | ✓ | Update profile. Body: `name, bio, phone, timezone` |
| PUT | `/v1/auth/password` | ✓ | Change password. Body: `current_password, password, password_confirmation` |
| POST | `/v1/auth/logout` | ✓ | Revoke current token |
| GET | `/v1/auth/mfa/setup` | ✓ | Returns `{ qr_code_url, secret }` for TOTP setup |
| POST | `/v1/auth/mfa/enable` | ✓ | Enable MFA. Body: `code` (verify 6-digit code first) |
| POST | `/v1/auth/mfa/disable` | ✓ | Disable MFA. Body: `code` |

---

## Courses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/courses` | — | List published courses. Query: `?level=beginner&search=text` |
| GET | `/v1/courses/{id}` | — | Course detail with modules |
| POST | `/v1/courses` | admin | Create course |
| PUT | `/v1/courses/{id}` | admin | Update course |
| DELETE | `/v1/courses/{id}` | admin | Delete course |
| POST | `/v1/courses/{id}/thumbnail` | admin | Upload thumbnail image |

### Modules

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/courses/{courseId}/modules` | admin | Create module |
| PUT | `/v1/modules/{id}` | admin | Update module |
| DELETE | `/v1/modules/{id}` | admin | Delete module |
| POST | `/v1/modules/{id}/duplicate` | admin | Duplicate module |
| POST | `/v1/modules/reorder` | admin | Reorder. Body: `[{ id, order_index }]` |
| POST | `/v1/modules/{id}/materials` | admin | Upload material file |

---

## Enrollment

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/courses/{id}/enroll` | ✓ | Enroll in course |
| DELETE | `/v1/courses/{id}/unenroll` | ✓ | Unenroll from course |
| GET | `/v1/courses/{id}/enrollment-status` | ✓ | Check enrollment |
| GET | `/v1/my-enrollments` | ✓ | My enrollments with course data |

---

## Progress

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/progress/{moduleId}/start` | ✓ | Mark module as in-progress |
| POST | `/v1/progress/{moduleId}/complete` | ✓ | Mark module as complete. Body: `time_spent` (seconds, optional) |
| GET | `/v1/courses/{courseId}/progress` | ✓ | Per-module progress + percentage |
| GET | `/v1/dashboard` | ✓ | Student dashboard stats |

---

## Exams

> **Security**: `GET` exam never returns `correct_answer`. Answers only returned on submit if `exam.show_answers = true`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/exams/module/{moduleId}` | ✓ | Exam for module (questions stripped of answers) |
| POST | `/v1/exams/{examId}/submit` | ✓ | Submit answers. Body: `{ answers: { questionId: answer } }` |
| GET | `/v1/exams/{examId}/attempts` | ✓ | My attempt history |
| GET | `/v1/exams/module/{moduleId}/question-bank` | admin | Full questions with correct answers |
| POST | `/v1/exams/{examId}/questions` | admin | Add question |
| PUT | `/v1/exams/questions/{id}` | admin | Update question |
| DELETE | `/v1/exams/questions/{id}` | admin | Delete question |
| POST | `/v1/exams/questions/{id}/approve` | admin | Approve AI-generated question |
| POST | `/v1/exams/questions/{id}/reject` | admin | Reject AI-generated question |

---

## Certificates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/certificates` | ✓ | My certificates |
| GET | `/v1/certificates/verify/{code}` | — | Public certificate verification |
| GET | `/v1/certificates/{id}/download` | ✓ | Download certificate PDF |
| POST | `/v1/certificates/issue` | admin | Manually issue certificate. Body: `user_id, course_id` |

---

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/notifications` | ✓ | My notifications (personal + broadcasts) |
| GET | `/v1/notifications/unread-count` | ✓ | Returns `{ count: N }` |
| PATCH | `/v1/notifications/{id}/read` | ✓ | Mark one read |
| POST | `/v1/notifications/mark-all-read` | ✓ | Mark all read |
| DELETE | `/v1/notifications/{id}` | ✓ | Delete notification |
| POST | `/v1/notifications/broadcast` | admin | Broadcast to all/role. Body: `title, body, audience, type` |

---

## Community

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/community/posts` | ✓ | Paginated posts. Query: `?category=prayer&search=text` |
| GET | `/v1/community/posts/{id}` | ✓ | Post detail with comments |
| POST | `/v1/community/posts` | ✓ | Create post. Body: `title, body, category` |
| PUT | `/v1/community/posts/{id}` | ✓ | Update own post |
| DELETE | `/v1/community/posts/{id}` | ✓ | Delete own post |
| POST | `/v1/community/posts/{postId}/comments` | ✓ | Add comment. Body: `body, parent_id?` |
| DELETE | `/v1/community/comments/{id}` | ✓ | Delete own comment |
| POST | `/v1/community/like/{type}/{id}` | ✓ | Toggle like. `type`: `post` or `comment` |
| POST | `/v1/community/report` | ✓ | Report content. Body: `reportable_type, reportable_id, reason` |

**Categories**: `discussion`, `prayer`, `testimony`, `resource`, `announcement`, `question`

---

## Mentorship

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/mentors` | ✓ | List active mentor profiles |
| GET | `/v1/mentorship/my-profile` | ✓ | My mentor profile |
| POST | `/v1/mentorship/profile` | ✓ | Create/update mentor profile |
| POST | `/v1/mentorship/request` | ✓ | Request mentorship. Body: `mentor_id?, topic, message` |
| GET | `/v1/mentorship/my-requests` | ✓ | My mentorship requests |
| GET | `/v1/mentorship/pending-requests` | admin | Pending requests |
| POST | `/v1/mentorship/requests/{id}/assign` | admin | Assign mentor. Body: `mentor_id` |
| GET | `/v1/mentorship/sessions` | ✓ | My sessions |
| POST | `/v1/mentorship/sessions` | ✓ | Create session. Body: `request_id, scheduled_at, topic, meeting_link?` |
| PATCH | `/v1/mentorship/sessions/{id}/complete` | ✓ | Complete session. Body: `notes?` |
| GET | `/v1/mentorship/requests/{requestId}/goals` | ✓ | Goals for a request |
| POST | `/v1/mentorship/goals` | ✓ | Create goal. Body: `request_id, title, description?, target_date?` |
| PATCH | `/v1/mentorship/goals/{id}` | ✓ | Update goal |
| POST | `/v1/mentorship/goals/{goalId}/action-points` | ✓ | Add action point. Body: `title` |
| PATCH | `/v1/mentorship/action-points/{id}/complete` | ✓ | Mark action point done |

---

## AI

> `ANTHROPIC_API_KEY` is server-side only and never exposed to the client.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/ai/generate-questions` | admin | Generate questions for a module. Body: `module_id, count?`. Questions saved as `status=pending`. |
| GET | `/v1/ai/recommendations` | ✓ | AI course recommendations for current user |
| GET | `/v1/ai/summarize/{moduleId}` | ✓ | AI summary of module content |

---

## Files

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/upload/avatar` | ✓ | Upload avatar. Form-data: `avatar` (image, max 2MB) |
| GET | `/v1/files/{path}` | ✓ | Protected file download (materials, certificates) |

---

## Admin

### Dashboard & Stats

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/admin/dashboard` | admin | Counts: users, students, courses, enrollments, certificates, pending_posts, pending_comments |
| GET | `/v1/admin/stats` | admin | Trend data: users by role, enrollments per day (30d), exam pass rate, top courses |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/admin/users` | admin | Paginated users. Query: `?role=student&search=name` |
| GET | `/v1/admin/users/{id}` | admin | User detail |
| POST | `/v1/admin/users` | admin | Create user |
| PUT | `/v1/admin/users/{id}` | admin | Update user |
| PATCH | `/v1/admin/users/{id}/deactivate` | admin | Deactivate user |
| PATCH | `/v1/admin/users/{id}/reactivate` | admin | Reactivate user |

### Badges

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/badges` | admin | All badges with `user_badges_count` |
| POST | `/v1/badges` | admin | Create badge. Body: `name, description, icon, color, criteria, course_id?` |
| PATCH | `/v1/badges/{id}` | admin | Update badge |
| DELETE | `/v1/badges/{id}` | admin | Delete badge |

### Content Moderation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/admin/pending-content` | admin | Pending posts + comments |
| POST | `/v1/admin/posts/{id}/moderate` | admin | Body: `action=approve\|reject` |
| POST | `/v1/admin/comments/{id}/moderate` | admin | Body: `action=approve\|reject` |

### Logs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/admin/audit-logs` | admin | Audit log (paginated). Query: `?action=LOGIN&user_id=1` |
| GET | `/v1/admin/exception-logs` | admin | Exception log (paginated) |
| PATCH | `/v1/admin/exception-logs/{id}/resolve` | admin | Mark exception resolved |

---

## Error Codes

| HTTP | Meaning |
|------|---------|
| 400 | Bad request / validation error — see `errors` field |
| 401 | Unauthenticated — missing or expired token |
| 403 | Forbidden — insufficient role or inactive account |
| 404 | Resource not found |
| 422 | Unprocessable entity (validation) |
| 429 | Rate limit exceeded |
| 500 | Server error — check exception logs |
