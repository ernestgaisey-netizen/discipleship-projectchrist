# DisciplePath — Testing Checklist

Run `php artisan migrate:fresh --seed` before each full test pass.

---

## 1. Authentication

- [ ] Register new account (email + password)
- [ ] Login with valid credentials → JWT stored in `dp_token`
- [ ] Login with wrong password → 401 error shown
- [ ] MFA setup: enable TOTP, scan QR code with authenticator app
- [ ] MFA login flow: enter 6-digit code on second step
- [ ] Forgot password → email sent (check `storage/logs/laravel.log` on local)
- [ ] Reset password via token in email link
- [ ] Logout → token removed, redirect to login

---

## 2. Courses (Public & Student)

- [ ] `/courses` lists all published courses with level filter
- [ ] Search filter narrows course list
- [ ] `/courses/:id` shows course detail with module list
- [ ] Locked modules show padlock for non-enrolled users
- [ ] Enroll in course → Module 1 unlocked, others locked
- [ ] Duplicate enroll attempt → error handled

---

## 3. Learning & Progress

- [ ] `/modules/:id` loads module content, scripture refs, video (if set)
- [ ] Locked module shows access-denied message
- [ ] "Mark Complete" button fires `/progress/{moduleId}/complete`
- [ ] Completing module unlocks next module (check `/courses/:id` module list)
- [ ] `/my-learning` shows enrolled courses with per-course progress
- [ ] Dashboard stats update: modules_completed, enrolled_courses

---

## 4. Exams

- [ ] Exam intro screen shows time limit, pass mark, max attempts
- [ ] Exam questions load **without** correct answers in the payload (check Network tab)
- [ ] Timer counts down; auto-submits on expiry
- [ ] MCQ: selecting an option highlights it
- [ ] True/False: both options selectable
- [ ] Short answer: text input accepted
- [ ] Submit exam → score calculated, results screen shown
- [ ] Pass (≥70%) unlocks next module
- [ ] Fail → can retry up to max_attempts
- [ ] Exceeding max_attempts → attempt blocked with 403
- [ ] `show_answers=true` → per-question review shown after submit
- [ ] Correct answers only appear in result response, never in exam load response

---

## 5. Certificates

- [ ] Completing all modules + passing all exams issues certificate
- [ ] `/certificates` lists issued certificates with download button
- [ ] PDF download works (check file exists at `storage/app/public/certificates/`)
- [ ] `/certificates/verify/:code` (public) shows valid certificate details
- [ ] Invalid code shows "not found" error

---

## 6. AI Features

- [ ] Admin: generate questions for a module → questions created with `status=pending`
- [ ] Pending questions **do not** appear in student exam until approved
- [ ] Admin: approve question → `status=approved`, now visible in exam
- [ ] Admin: reject question → `status=rejected`, excluded from exam
- [ ] `/ai/recommendations` returns course recommendations for current user
- [ ] `/ai/summarize/:moduleId` returns summary of module content
- [ ] `ANTHROPIC_API_KEY` never appears in any frontend network request

---

## 7. Community

- [ ] `/community` lists approved posts, filterable by category
- [ ] Search across post titles/bodies works
- [ ] Create post → appears in list
- [ ] Like post → count increments; unlike → decrements
- [ ] Add comment to post
- [ ] Like comment works (polymorphic)
- [ ] Report post/comment → stored as report
- [ ] Admin: pending posts & comments visible at `/admin/community`
- [ ] Approve post → visible to all; reject → hidden
- [ ] Category `testimony` (not `testimonial`) works in filter

---

## 8. Notifications

- [ ] `/notifications` lists personal + broadcast notifications
- [ ] Unread badge count shown in navbar
- [ ] Mark single notification read → read_at set
- [ ] Mark all read → all cleared
- [ ] Delete notification → removed from list
- [ ] Admin broadcast → visible to all users

---

## 9. Mentorship

- [ ] Mentor profiles listed at `/mentorship`
- [ ] Student requests mentorship → appears in admin pending list
- [ ] Admin assigns mentor → request status updated
- [ ] Sessions created, completed with notes
- [ ] Goals created, action points added and completed

---

## 10. Admin Panel

- [ ] Dashboard stats: total users, students, courses, enrollments, certificates, pending posts
- [ ] `/admin/users` lists all users with role filter
- [ ] Create user works, edit user works, deactivate/reactivate works
- [ ] `/admin/badges` lists all badges with awarded count
- [ ] Create badge, edit badge, delete badge
- [ ] `/admin/community` shows pending posts/comments with approve/reject
- [ ] Exception logs visible with resolve button
- [ ] Audit logs paginated and filterable

---

## 11. File / Storage

- [ ] Avatar upload at `/profile` → stored in `storage/app/public/avatars/`
- [ ] Avatar URL displayed in profile and navbar
- [ ] Certificate PDF served from protected route with auth check
- [ ] Unauthenticated request to protected file → 401

---

## 12. Security Checks

- [ ] Unauthenticated API requests return 401 JSON (not HTML redirect)
- [ ] Student cannot access admin routes (`/admin/*`) → redirected to `/`
- [ ] Deactivated user login → 403 "account inactive" error
- [ ] Exam answer payload from `GET /exams/module/:id` contains NO `correct_answer` field
- [ ] AI questions with `status=pending` absent from student exam
- [ ] CORS: requests from non-whitelisted origin blocked

---

## 13. Deployment Smoke Test (Hostinger)

- [ ] `GET /api/health` → `{ "success": true, "data": { "status": "ok" } }`
- [ ] React SPA loads at `/` (check `public/build/` exists)
- [ ] API base URL resolves to correct domain
- [ ] Storage symlink: `public/storage` → `storage/app/public`
- [ ] All seeded accounts can log in

---

## Default Test Credentials

| Role        | Email                       | Password          |
|-------------|-----------------------------|-------------------|
| Super Admin | admin@projectchrist.org      | DisciplePath2024! |
| Content     | content@projectchrist.org    | Content2024!      |
| Mentor      | mentor@projectchrist.org     | Mentor2024!       |
| Student     | student@projectchrist.org    | Student2024!      |
