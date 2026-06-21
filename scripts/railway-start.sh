#!/bin/bash
# Railway startup script — brings up VPN tunnel before starting Next.js
#
# Required env vars for VPN mode:
#   WG_PRIVATE_KEY    — Railway peer private key
#   WG_SERVER_PUBKEY  — Neoma server public key
#   WG_PSK            — Preshared key
#   WG_ENDPOINT       — neoma-vpn.duckdns.org:51820
#   WG_ADDRESS        — 10.200.200.3/24
#   NEOMA_MB_URL      — http://10.200.200.1:8115
#   LLM_OLLAMA_URL    — http://10.200.200.1:11434
#
# If WG_PRIVATE_KEY is not set, skip VPN setup (dreaming-only mode).

set -e

echo "[railway-start] Booting Neoma chat backend..."

if [ -n "$WG_PRIVATE_KEY" ]; then
    echo "[railway-start] VPN credentials found, attempting tunnel setup..."

    # Check if wireguard-tools are available
    if command -v wg &>/dev/null; then
        # Create WireGuard config
        mkdir -p /etc/wireguard
        cat > /etc/wireguard/wg0.conf << EOF
[Interface]
PrivateKey = ${WG_PRIVATE_KEY}
Address = ${WG_ADDRESS:-10.200.200.3/24}

[Peer]
PublicKey = ${WG_SERVER_PUBKEY}
PresharedKey = ${WG_PSK}
AllowedIPs = 10.200.200.0/24
Endpoint = ${WG_ENDPOINT:-neoma-vpn.duckdns.org:51820}
PersistentKeepalive = 25
EOF
        chmod 600 /etc/wireguard/wg0.conf

        # Try to bring up the tunnel
        if wg-quick up wg0 2>/dev/null; then
            echo "[railway-start] WireGuard tunnel UP"

            # Health check — can we reach MB?
            if curl -sf --connect-timeout 3 http://10.200.200.1:8115/health >/dev/null 2>&1; then
                echo "[railway-start] Memory Bridge reachable through VPN — LIVE MODE"
            else
                echo "[railway-start] Memory Bridge unreachable — will fall back to dreaming"
            fi
        else
            echo "[railway-start] WireGuard failed to start — running without VPN"
        fi
    else
        echo "[railway-start] wireguard-tools not available — running without VPN"
        echo "[railway-start] To enable: add wireguard-tools to Dockerfile or use Cloudflare Tunnel"
    fi
else
    echo "[railway-start] No VPN credentials — running in dreaming/standard mode"
fi

# Start Next.js
echo "[railway-start] Starting Next.js on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"
