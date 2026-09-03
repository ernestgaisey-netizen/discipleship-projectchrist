# Rollback Plan

## Purpose
This document describes how to safely reverse the DisciplePath feature update if deployment causes instability.

## Rollback steps
1. Restore the database from the most recent backup taken before deployment.
2. Restore the application files from the previous commit or backup.
3. Revert any `.env` changes made during deployment, preserving production credentials.
4. Run:
   - `php artisan config:clear`
   - `php artisan route:clear`
   - `php artisan view:clear`
   - `php artisan cache:clear`

## Reversible changes
- All new schema changes are implemented with Laravel migrations.
- If rollback is necessary without restoring the entire database, run:
  - `php artisan migrate:rollback --step=1`
  - Repeat until the new migration files are reverted.

## Notes
- Do not manually delete tables or columns in production unless directed.
- Prefer file system restoration from a verified backup over manual rollback when possible.
