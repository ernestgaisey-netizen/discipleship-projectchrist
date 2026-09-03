# Hostinger Deployment Guide — DisciplePath

**Architecture note:** Hostinger shared hosting serves files from the project root (not `public/`). The root `index.php` bootstraps Laravel directly, and `.htaccess` routes `/build/` and `/storage/` to the `public/` subdirectory automatically. No document-root change needed in hPanel.

---

## 1. Upload Files

Upload the entire project directory to `/public_html/discipleship.projectchrist.org/` via SSH or hPanel File Manager.

**Files already prepared locally — upload as-is:**
- `public/build/` — React production assets (already built)
- `vendor/` — PHP dependencies (already installed, or run Composer on server)
- `database/seeders/` — CourseSeeder + ExamSeeder with all 440 questions

**Do NOT upload:**
- `node_modules/` — not needed on server
- `.env` — create fresh on server from `.env.example`

---

## 2. Create & Configure `.env`

```bash
cp .env.example .env
nano .env   # or edit via hPanel File Manager
```

**Values to fill in (marked YOUR_ below):**

```env
APP_NAME=DisciplePath
APP_ENV=production
APP_KEY=                           # generated in step 3
APP_DEBUG=false
APP_URL=https://discipleship.projectchrist.org

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=YOUR_DATABASE_NAME
DB_USERNAME=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD

SESSION_DRIVER=file
SESSION_DOMAIN=.projectchrist.org

CACHE_STORE=file
QUEUE_CONNECTION=sync

SANCTUM_STATEFUL_DOMAINS=discipleship.projectchrist.org
CORS_ALLOWED_ORIGINS=https://discipleship.projectchrist.org

ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
ANTHROPIC_MODEL=claude-sonnet-4-6

MAIL_MAILER=smtp
MAIL_HOST=mail.projectchrist.org
MAIL_PORT=465
MAIL_USERNAME=noreply@projectchrist.org
MAIL_PASSWORD=YOUR_MAIL_PASSWORD
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@projectchrist.org
MAIL_FROM_NAME="DisciplePath"
```

---

## 3. Generate Application Key

```bash
php8.2 artisan key:generate
```

---

## 4. Install PHP Dependencies

```bash
php8.2 /usr/local/bin/composer install --no-dev --optimize-autoloader
```

If Composer is not on the server, run this locally and upload the `vendor/` folder.

---

## 5. Run Migrations & Seed

```bash
# Fresh install — drops all tables and seeds with all course content
php8.2 artisan migrate:fresh --seed
```

This seeds:
- 4 demo user accounts (admin/mentor/student/content)
- 4 badges
- 4 courses with 16 modules and full HTML content
- 440 exam questions across all 16 modules (status=approved)

---

## 6. Create Storage Symlink

```bash
php8.2 artisan storage:link
chmod -R 775 storage bootstrap/cache
```

---

## 7. Optimise for Production

```bash
php8.2 artisan config:cache
php8.2 artisan route:cache
php8.2 artisan view:cache
php8.2 artisan event:cache
```

---

## 8. Verify

```
GET https://discipleship.projectchrist.org/api/health
→ { "success": true, "data": { "status": "ok" } }

GET https://discipleship.projectchrist.org/
→ DisciplePath React SPA loads
```

---

## Updating After Code Changes

1. Upload changed files (skip `node_modules/`, `.env`)
2. If PHP changed: `php8.2 composer install --no-dev --optimize-autoloader`
3. If JS/CSS changed: run `npm run build` locally, upload `public/build/`
4. If migrations added: `php8.2 artisan migrate` (NOT `migrate:fresh` — preserves data)
5. Re-run cache commands: `php8.2 artisan config:cache && php8.2 artisan route:cache`

---

## Default Login Credentials (seeded)

| Role          | Email                       | Password          |
|---------------|-----------------------------|-------------------|
| Super Admin   | admin@projectchrist.org      | DisciplePath2024! |
| Content Admin | content@projectchrist.org    | Content2024!      |
| Mentor        | mentor@projectchrist.org     | Mentor2024!       |
| Student       | student@projectchrist.org    | Student2024!      |

**Change all passwords immediately after first login.**

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 500 on all pages | Check `storage/logs/laravel.log`; verify `.env` values |
| React app blank / white screen | Check browser console for JS errors; verify `public/build/` was uploaded |
| `/build/assets/...` returns 404 | Confirm `.htaccess` at project root has the `RewriteRule ^build/(.*)$ public/build/$1 [L]` line |
| API 401 on login | Verify `APP_KEY` is set; run `php8.2 artisan key:generate` |
| DB connection refused | Check DB credentials in `.env`; run `php8.2 artisan config:clear` |
| CORS errors in browser | Verify `CORS_ALLOWED_ORIGINS=https://discipleship.projectchrist.org` in `.env` |
| Storage files 404 | Run `php8.2 artisan storage:link` and `chmod -R 775 storage` |
| AI features error | Check `ANTHROPIC_API_KEY` in `.env`; view exception logs in admin panel |
| Mail not sending | Verify SMTP credentials; test with `php8.2 artisan tinker` → `Mail::raw('test', fn($m) => $m->to('you@example.com')->subject('Test'))` |
