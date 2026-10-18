import { VERSION } from "./site";

export const releases = [
  {
    version: VERSION,
    date: "2026-10-18",
    dateLabel: "October 18, 2026",
    title: "A better place to develop.",
    summary:
      "Trusted local HTTPS, tunnels that close on time, and a clearer path from a connection problem to its fix.",
    previous: "1.7.0",
    changes: [
      {
        title: "Local HTTPS, without a public domain",
        text: "Run wirerift-server --dev for a loopback development edge with a persistent local CA. Manage trust with ca trust, untrust, status and path. Certificates are constrained to .localhost, .test and loopback IPs.",
        href: "/docs/local-https/",
        label: "Set up local HTTPS",
      },
      {
        title: "A deadline for every temporary tunnel",
        text: "Add --ttl 30m to http, tcp or serve. The server enforces expiry and frees the subdomain or port. Reconnects keep the original deadline; expired tunnels stay closed.",
        href: "/docs/http-tunnels/#ttl",
        label: "Use time limits",
      },
      {
        title: "Diagnose the connection with doctor",
        text: "wirerift doctor checks DNS, TCP, TLS certificates and login in order, with a fix hint at the first failed step. Private CAs use the same WIRERIFT_TLS_CA setting as the client.",
        href: "/docs/troubleshooting/#doctor",
        label: "Check a connection",
      },
      {
        title: "Error pages with useful context",
        text: "Browsers get explanatory HTML when a tunnel or its local app is unavailable. API clients retain plain-text errors; local-app failures include X-WireRift-Error without revealing the local port.",
        href: "/docs/troubleshooting/#upstream",
        label: "Understand tunnel errors",
      },
      {
        title: "URLs that match your edge",
        text: "The server library’s Config.PublicScheme and PublicPort describe the address visitors should use. Dev mode returns HTTPS URLs with its configured port; the tunnel API exposes expires_at for timed tunnels.",
        href: "/docs/api/#expiry",
        label: "Read the API reference",
      },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-10-16",
    dateLabel: "October 16, 2026",
    title: "Stronger boundaries. Smoother streams.",
    summary:
      "Optional control-plane TLS, streamed HTTP responses, and fixes across tunnel lifecycles, access controls and the wire protocol.",
    previous: "1.6.0",
    changes: [
      {
        title: "Transport and access hardening",
        text: "TLS for the control plane, a loopback dashboard by default, PIN and dashboard login lockouts, sensitive-header redaction in the inspector, and DNS TXT verification for custom domains.",
        href: "/docs/security/#transport",
        label: "Review transport settings",
      },
      {
        title: "Streaming and connection fixes",
        text: "SSE, long polling and large downloads stream to visitors. Fixes cover HEAD responses, chunked uploads, TCP port cleanup, half-close handling, heartbeat detection and tunnel recreation after reconnects. Releases also include raw binaries alongside archives.",
        href: "/docs/http-tunnels/#streaming",
        label: "Explore HTTP tunnels",
      },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-04-02",
    dateLabel: "April 2, 2026",
    title: "Connections that find their way back.",
    summary:
      "Automatic reconnection after server restarts, dashboard session heartbeat tracking, and defensive error handling improvements.",
    previous: "1.5.0",
    changes: [],
  },
];
