#!/bin/bash
# Deploy script for discipleship.projectchrist.org
# Run this from your local Mac, inside the Laravel project folder.
#
# Usage:
#   ./deploy.sh "your commit message here"
#
# You will be prompted for your SSH password 2-3 times during this script
# (once for git pull if using SSH-based git remote... skip if HTTPS,
#  once for scp upload, once for the final ssh command block).
# To avoid repeated password prompts, consider setting up SSH key auth.

set -e  # stop immediately if any command fails

# ---- CONFIG: adjust these if anything changes ----
SSH_PORT=65002
SSH_USER="u867922374"
SSH_HOST="92.113.28.190"
SERVER_APP_PATH="~/domains/projectchrist.org/public_html/discipleship.projectchrist.org"
LOCAL_PROJECT_PATH="/Users/gazy/Documents/ARISE CONFERENCE/PC LIVE/public_html/discipleship.projectchrist.org"
# ----------------------------------------------------

COMMIT_MSG="${1:-Deploy update}"

cd "$LOCAL_PROJECT_PATH"

echo "=============================="
echo "1/6 Checking git status..."
echo "=============================="
git status

echo "=============================="
echo "2/6 Building frontend assets..."
echo "=============================="
npm run build

echo "=============================="
echo "3/6 Committing and pushing to GitHub..."
echo "=============================="
git add .
git commit -m "$COMMIT_MSG" || echo "Nothing new to commit, continuing..."
git push origin main

echo "=============================="
echo "4/6 Pulling latest code on server..."
echo "=============================="
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $SERVER_APP_PATH && git pull origin main"

echo "=============================="
echo "5/6 Uploading fresh build assets..."
echo "=============================="
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "rm -rf $SERVER_APP_PATH/public/build"
scp -P "$SSH_PORT" -r public/build "$SSH_USER@$SSH_HOST:$SERVER_APP_PATH/public/"

echo "=============================="
echo "6/6 Clearing and rebuilding server caches..."
echo "=============================="
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $SERVER_APP_PATH && php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache"

echo ""
echo "✅ Deploy complete!"
echo "Check https://discipleship.projectchrist.org to confirm your changes are live."
