#!/usr/bin/env bash
#
# Runs on the Hostinger server (piped through SSH by .github/workflows/deploy.yml).
#
# Layout:
#   $DEPLOY_PATH/releases/<release>   one folder per deployment
#   $DEPLOY_PATH/shared/.env          production settings (never in git)
#   $DEPLOY_PATH/shared/storage       uploads, sessions, logs (kept between releases)
#   $DEPLOY_PATH/current              symlink to the live release
#   $PUBLIC_HTML                      symlink to current/public (the domain's web root)
#
set -Eeuo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
ACTION="${ACTION:-deploy}"
PHP_BIN="${PHP_BIN:-php}"
KEEP_RELEASES="${KEEP_RELEASES:-4}"
PUBLIC_HTML="${PUBLIC_HTML:-}"

releases="$DEPLOY_PATH/releases"
shared="$DEPLOY_PATH/shared"

log() { printf '\033[1;34m→\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

switch_to() {
    ln -sfn "$1" "$DEPLOY_PATH/current.next"
    mv -Tf "$DEPLOY_PATH/current.next" "$DEPLOY_PATH/current"

    if [ -n "$PUBLIC_HTML" ]; then
        if [ -e "$PUBLIC_HTML" ] && [ ! -L "$PUBLIC_HTML" ]; then
            backup="$PUBLIC_HTML.backup-$(date +%Y%m%d%H%M%S)"
            log "Moving the existing web root to $backup"
            mv "$PUBLIC_HTML" "$backup"
        fi

        ln -sfn "$DEPLOY_PATH/current/public" "$PUBLIC_HTML"
    fi
}

if [ "$ACTION" = "rollback" ]; then
    live="$(readlink -f "$DEPLOY_PATH/current" || true)"
    previous="$(ls -1dt "$releases"/*/ 2>/dev/null | sed 's#/$##' | grep -vx "$live" | head -n 1 || true)"
    [ -n "$previous" ] || fail "No previous release to roll back to."

    log "Rolling back to $(basename "$previous")"
    switch_to "$previous"
    (cd "$DEPLOY_PATH/current" && "$PHP_BIN" artisan optimize >/dev/null)
    log "✓ Rolled back to $(basename "$previous")"
    exit 0
fi

: "${RELEASE:?RELEASE is required}"
: "${ARCHIVE:?ARCHIVE is required}"
release_dir="$releases/$RELEASE"

log "PHP $("$PHP_BIN" -r 'echo PHP_VERSION;')"
"$PHP_BIN" -r 'exit(version_compare(PHP_VERSION, "8.4.1", ">=") ? 0 : 1);' \
    || fail "PHP 8.4.1+ is required. Select PHP 8.4 in hPanel, or set the HOSTINGER_PHP_BIN variable (e.g. /opt/alt/php84/usr/bin/php)."

[ -f "$shared/.env" ] || fail "$shared/.env is missing. Create it (see DEPLOY.md) or set the PRODUCTION_ENV secret."
[ -f "$ARCHIVE" ] || fail "Release archive $ARCHIVE not found."

mkdir -p "$releases" \
    "$shared/storage/app/public" \
    "$shared/storage/app/private" \
    "$shared/storage/framework/cache/data" \
    "$shared/storage/framework/sessions" \
    "$shared/storage/framework/views" \
    "$shared/storage/logs"

log "Unpacking release $RELEASE"
mkdir -p "$release_dir"
tar -xzf "$ARCHIVE" -C "$release_dir"
rm -f "$ARCHIVE"

ln -sfn "$shared/.env" "$release_dir/.env"
rm -rf "$release_dir/storage"
ln -s "$shared/storage" "$release_dir/storage"
# Relative link so uploaded photos keep working whatever the release folder is.
rm -rf "$release_dir/public/storage"
ln -s ../storage/app/public "$release_dir/public/storage"
mkdir -p "$release_dir/bootstrap/cache"

cd "$release_dir"

log "Running migrations"
"$PHP_BIN" artisan migrate --force --no-interaction

log "Caching config, routes, events and views"
"$PHP_BIN" artisan optimize

log "Switching to the new release"
switch_to "$release_dir"

"$PHP_BIN" artisan queue:restart >/dev/null 2>&1 || true

log "Cleaning old releases (keeping $KEEP_RELEASES)"
ls -1dt "$releases"/*/ | tail -n +"$((KEEP_RELEASES + 1))" | xargs -r rm -rf

log "✓ Release $RELEASE is live"
