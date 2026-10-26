#!/bin/sh
set -eu
export PORT="${PORT:-10000}"
: "${GATEWAY_HOSTPORT:?GATEWAY_HOSTPORT is required}"
case "$PORT" in ''|*[!0-9]*) echo 'Invalid port' >&2; exit 1 ;; esac
case "$GATEWAY_HOSTPORT" in *[!a-zA-Z0-9.:-]*) echo 'Invalid gateway address' >&2; exit 1 ;; esac
export DNS_RESOLVER="$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)"
: "${DNS_RESOLVER:?DNS resolver is required}"
# Keep Nginx request variables untouched; substitute only the deployment settings.
envsubst '${PORT} ${GATEWAY_HOSTPORT} ${DNS_RESOLVER}' < /etc/nginx/camerahub.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
