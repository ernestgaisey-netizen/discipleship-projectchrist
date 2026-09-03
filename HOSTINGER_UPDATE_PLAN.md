# Hostinger Update Plan

## Overview
This update extends the existing Laravel/Inertia application with additional DisciplePath features while preserving current functionality and production data.

## Pre-deployment steps
1. Ensure an up-to-date backup of the site files and database is taken.
2. Confirm `composer install` and `npm install` are run locally before deployment.
3. Verify `.env` production credentials are intact and not modified in the repository.

## Required environment variables
Add or verify these variables in the live `.env` file:
- `APP_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `MAIL_MAILER`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_ENCRYPTION`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`
- `ANTHROPIC_API_KEY`
- `MFA_ISSUER`
- `FILE_UPLOAD_MAX_SIZE`
- `CORS_ALLOWED_ORIGINS`

## Deployment commands
1. `composer install --no-dev --optimize-autoloader`
2. `php artisan key:generate --force` (only if missing)
3. `php artisan storage:link`
4. `php artisan migrate --force`
5. `php artisan config:clear`
6. `php artisan route:clear`
7. `php artisan view:clear`
8. `php artisan cache:clear`
9. `php artisan config:cache`
10. `php artisan route:cache`

## File permissions
- Ensure `storage/` and `bootstrap/cache/` are writable by the web server.
- Ensure `public/storage` exists and is writable.

## Notes
- Do not hardcode any production secrets in code.
- Retain the existing Laravel auth and Inertia frontend architecture.
- This update is additive: no existing tables are dropped.
