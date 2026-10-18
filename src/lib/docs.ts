import { REPO, VERSION } from "./site";

export type DocSection = {
  id: string;
  title: string;
  text: string;
  code?: string;
  note?: string;
  table?: string[][];
};
export type Doc = {
  slug: string;
  title: string;
  category: string;
  description: string;
  sections: DocSection[];
};
export const docs: Doc[] = [
  {
    slug: "getting-started",
    title: "Meet WireRift",
    category: "Start here",
    description: "A small binary. A direct connection. Your infrastructure.",
    sections: [
      {
        id: "overview",
        title: "Local development, without the walls",
        text: "WireRift connects a local service to a server you operate. The server receives public HTTP or TCP traffic and sends it through a multiplexed connection to your machine. Your application keeps running exactly where it is.",
      },
      {
        id: "requirements",
        title: "What you need",
        text: "A local application, the WireRift client, and a reachable WireRift server. For public HTTPS, use a domain you control and configure DNS to point at your server. You do not need Go installed when using prebuilt binaries.",
      },
      {
        id: "first-tunnel",
        title: "Your first tunnel",
        text: "Once your server is running, point the client at its control address and authenticate with the same token. In this example the local app listens on port 3000.",
        code: "wirerift http 3000 myapp \\\n  --server tunnel.example.com:4443 \\\n  --token YOUR_TOKEN",
        note: "Replace tunnel.example.com and YOUR_TOKEN with your own server and token. Public URLs throughout these docs are examples, not a shared hosted tunnel service.",
      },
      {
        id: "local",
        title: "Only developing on your machine?",
        text: "In v1.8.0, local HTTPS mode runs the server on loopback with .localhost or .test domains and a persistent development CA. Use the Local HTTPS development guide when you do not need a public tunnel or DNS.",
      },
      {
        id: "next",
        title: "Make the connection yours",
        text: "Use HTTP tunnels for web apps and webhooks, TCP tunnels for databases and other raw protocols, and the built-in dashboard to inspect requests. Start with the installation guide, then follow the server setup.",
      },
    ],
  },
  {
    slug: "installation",
    title: "Installation",
    category: "Start here",
    description: "Native binaries for your machine. No runtime to manage.",
    sections: [
      {
        id: "binary",
        title: "Download a release",
        text: "Choose your operating system and architecture on the download page. The client is named wirerift; the server is wirerift-server. Releases include Linux, macOS, Windows and FreeBSD builds. Verify downloads against checksums.txt in the same release.",
      },
      {
        id: "linux",
        title: "Linux · amd64",
        text: "Download both binaries if this machine will also run your server. Make them executable and place them on your PATH.",
        code: "curl -fLo wirerift https://github.com/WireRift/WireRift/releases/latest/download/wirerift-linux-amd64\ncurl -fLo wirerift-server https://github.com/WireRift/WireRift/releases/latest/download/wirerift-server-linux-amd64\nchmod +x wirerift wirerift-server\nsudo mv wirerift wirerift-server /usr/local/bin/",
      },
      {
        id: "windows",
        title: "Windows · PowerShell",
        text: "Download the executable into your current directory. Run it with the .\\ prefix, or move it to a directory on your PATH.",
        code: 'Invoke-WebRequest -Uri "https://github.com/WireRift/WireRift/releases/latest/download/wirerift-windows-amd64.exe" -OutFile "wirerift.exe"\n.\\wirerift.exe --help',
      },
      {
        id: "go-install",
        title: "Install with Go",
        text: "With Go 1.23 or later, install the client and server at the documented release version. Go places the executables in GOBIN, or in the bin directory under GOPATH when GOBIN is unset; add that directory to your PATH.",
        code: `go install github.com/wirerift/wirerift/cmd/wirerift@v${VERSION}\ngo install github.com/wirerift/wirerift/cmd/wirerift-server@v${VERSION}\nwirerift --version`,
      },
      {
        id: "source",
        title: "Build from source",
        text: "The repository requires Go 1.23 or later. There are no third-party Go dependencies. Check out the release tag to build the version documented here.",
        code: `git clone --branch v${VERSION} --depth 1 ${REPO}.git\ncd WireRift\ngo build -o wirerift ./cmd/wirerift\ngo build -o wirerift-server ./cmd/wirerift-server`,
      },
    ],
  },
  {
    slug: "server",
    title: "Run your own server",
    category: "Start here",
    description: "The public edge belongs to you.",
    sections: [
      {
        id: "start",
        title: "Start the server",
        text: "Run the server on a machine reachable by your clients. Choose a strong token and keep it private. The domain must resolve to that machine.",
        code: "wirerift-server \\\n  --domain tunnel.example.com \\\n  --token YOUR_TOKEN",
        note: "The server defaults to control port 4443, HTTP port 80, HTTPS port 443 and a loopback dashboard on port 4040. Binding 80/443 may require OS permissions or a reverse proxy.",
      },
      {
        id: "dns",
        title: "Point DNS at the edge",
        text: "Create A records for your base domain and wildcard subdomain pointing at the server IP. Keep the marketing website and your tunnel server on separate domains or subdomains when they run on different infrastructure.",
        code: "tunnel.example.com    A    YOUR_SERVER_IP\n*.tunnel.example.com  A    YOUR_SERVER_IP",
      },
      {
        id: "tls",
        title: "Configure HTTPS",
        text: "For public certificates, set an ACME email and make the required HTTP challenge port reachable. The --auto-cert option generates self-signed certificates; it does not issue a publicly trusted certificate.",
        code: "wirerift-server --domain tunnel.example.com \\\n  --token YOUR_TOKEN --acme-email you@example.com",
        note: "Public edge HTTPS and control-plane TLS are separate settings. Configure --control-tls-cert and --control-tls-key to encrypt the client/server control connection.",
      },
      {
        id: "dashboard",
        title: "Keep the dashboard private",
        text: "The dashboard binds to 127.0.0.1 by default. Use an SSH forward to reach it from your workstation instead of exposing an administration port publicly.",
        code: "ssh -L 4040:127.0.0.1:4040 user@YOUR_SERVER_IP\n# Open http://localhost:4040 and authenticate with your token",
      },
    ],
  },
  {
    slug: "http-tunnels",
    title: "HTTP & WebSocket tunnels",
    category: "Tunnels",
    description:
      "Share web apps, receive webhooks, and keep WebSockets connected.",
    sections: [
      {
        id: "http",
        title: "Expose a local HTTP service",
        text: "Pass your local port and optionally a subdomain. WireRift forwards public requests to that local service.",
        code: "wirerift http 3000 myapp --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "websocket",
        title: "WebSockets come along",
        text: "HTTP upgrade requests pass through the tunnel, so local WebSocket applications can keep their full-duplex connections. No separate WebSocket tunnel command is required.",
      },
      {
        id: "inspect",
        title: "See the conversation",
        text: "Add --inspect to capture request and response details. The dashboard exposes methods, paths, status codes, duration, headers and JSON bodies.",
        code: "wirerift http 3000 myapp --inspect \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "streaming",
        title: "Keep streaming responses flowing",
        text: "SSE, long polling and large downloads are streamed to the visitor rather than fully buffered. The client waits up to two minutes for the local app's first response byte; a visitor disconnect releases the stream.",
      },
      {
        id: "ttl",
        title: "Give a preview an expiry time",
        text: "Add --ttl with a Go duration such as 30m or 2h to http or serve. The server closes the tunnel at its deadline and releases the subdomain. A reconnect preserves that deadline and cannot revive an expired tunnel. Omit --ttl, or use 0, for no time limit; negative durations and limits above one year are rejected.",
        code: "wirerift http 3000 preview --ttl 30m \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN\n\nwirerift serve ./dist --ttl 2h \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "files",
        title: "Share a static directory",
        text: "Serve files directly through a tunnel without starting another local web server.",
        code: "wirerift serve ./dist --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
    ],
  },
  {
    slug: "tcp-tunnels",
    title: "TCP tunnels",
    category: "Tunnels",
    description: "A path for the protocols beyond HTTP.",
    sections: [
      {
        id: "create",
        title: "Forward a raw TCP service",
        text: "Expose a local database, game server or SSH service with a TCP tunnel. The server allocates a public port and prints the address to use.",
        code: "wirerift tcp 5432 --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "ttl",
        title: "Close a temporary TCP tunnel automatically",
        text: "Use --ttl for time-limited access to a database or other raw service. The server closes the public listener and frees the allocated port on expiry. Reconnection keeps the original expiry time.",
        code: "wirerift tcp 5432 --ttl 30m \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "ports",
        title: "Reserve the public port range",
        text: "Open only the TCP ports you intend to allocate. Configure the server range with --tcp-ports, and mirror that choice in your firewall or container port mapping.",
        code: "wirerift-server --token YOUR_TOKEN \\\n  --domain tunnel.example.com --tcp-ports 20000-20099",
      },
      {
        id: "access",
        title: "Restrict who can connect",
        text: "Use an IP whitelist for raw TCP services. Basic Auth is an HTTP mechanism and does not authenticate a database or SSH protocol. Keep the native authentication of your service enabled.",
        code: 'wirerift tcp 5432 --whitelist "203.0.113.50,10.0.0.0/8" \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN',
      },
    ],
  },
  {
    slug: "security",
    title: "Security & access",
    category: "Operate",
    description: "Layer access controls around what you share.",
    sections: [
      {
        id: "tokens",
        title: "Authenticate your client",
        text: "Use the server's token to establish a client connection. Store tokens outside version control, use a protected configuration file or environment variables, and rotate credentials when access changes.",
      },
      {
        id: "basic-auth",
        title: "HTTP Basic Authentication",
        text: "Protect an HTTP tunnel with a username and password. Serve the public edge over HTTPS when using credentials.",
        code: 'wirerift http 3000 --auth "user:YOUR_PASSWORD" \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN',
      },
      {
        id: "whitelist",
        title: "IP and CIDR allowlists",
        text: "Allow individual IPv4/IPv6 addresses or CIDR networks. Disallowed HTTP clients receive 403; disallowed TCP connections are dropped.",
        code: 'wirerift http 3000 --whitelist "203.0.113.50,192.168.0.0/16" \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN',
      },
      {
        id: "pin",
        title: "PIN-protected previews",
        text: "Require visitors to enter a PIN in the browser. WireRift also accepts the X-WireRift-PIN header. Browser authentication uses an HttpOnly HMAC cookie.",
        code: "wirerift http 3000 --pin YOUR_PIN \\\n  --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "transport",
        title: "Treat both transport boundaries explicitly",
        text: "Configure trusted certificates for the public HTTPS edge and separately enable TLS on the control plane. The default control connection uses plain TCP; use the tls:// server scheme to encrypt it. The dashboard should stay on loopback unless deliberately secured.",
        code: "# Server: a certificate valid for your control hostname\nwirerift-server --domain tunnel.example.com --token YOUR_TOKEN \\\n  --control-tls-cert cert.pem --control-tls-key key.pem\n\n# Client: explicitly enable TLS\nwirerift http 3000 --server tls://tunnel.example.com:4443 --token YOUR_TOKEN",
      },
    ],
  },
  {
    slug: "inspector",
    title: "Traffic inspector",
    category: "Operate",
    description: "See the request. Understand the response. Try it again.",
    sections: [
      {
        id: "capture",
        title: "Capture traffic",
        text: "Start an HTTP tunnel with --inspect, then open the dashboard on localhost:4040 and authenticate. Select the Inspector tab to see captured requests.",
        code: "wirerift http 3000 --inspect --server tunnel.example.com:4443 --token YOUR_TOKEN",
      },
      {
        id: "inspect",
        title: "Look inside",
        text: "Expand an entry to view request and response headers and syntax-highlighted JSON. Each entry includes its method, path, response status, duration and client IP. Inspection may capture sensitive payloads; keep dashboard access restricted.",
      },
      {
        id: "replay",
        title: "Replay and export",
        text: "Replay sends the captured request to your local service again. Use it to debug webhook handlers without recreating the upstream event. Copy a request as cURL when you need to reproduce it in your terminal. Replaying a request can repeat application side effects.",
      },
      {
        id: "api",
        title: "Use the capture API",
        text: "Read captures with the authenticated API. Filter by tunnel when several services are running.",
        code: 'curl -H "Authorization: Bearer YOUR_TOKEN" \\\n  "http://localhost:4040/api/requests?limit=50"',
      },
    ],
  },
  {
    slug: "architecture",
    title: "Under the wire",
    category: "Reference",
    description: "One connection. Many independent streams.",
    sections: [
      {
        id: "flow",
        title: "From localhost to the public edge",
        text: "The client authenticates to the server, requests a tunnel, and receives its public address. New incoming requests become streams on the existing connection. The client forwards those streams to your local application.",
      },
      {
        id: "protocol",
        title: "A purpose-built binary protocol",
        text: "The wire protocol starts with magic bytes WRF and version 1. Each frame has a 9-byte header: version, type, a 3-byte stream ID and a 4-byte payload length.",
        code: "+---------+------+----------+--------+\n| Version | Type | StreamID | Length |\n| 1 byte  | 1 B  | 3 bytes  | 4 B    |\n+---------+------+----------+--------+\n|          Payload (variable)       |\n+----------------------------------+",
      },
      {
        id: "multiplexing",
        title: "Multiplexing and backpressure",
        text: "Independent streams share one TCP connection. Per-stream flow control provides backpressure; heartbeat frames keep track of connection liveness. The client reconnects with exponential backoff and recreates tunnels after a dropped connection.",
      },
      {
        id: "runtime",
        title: "A deliberately small runtime",
        text: "The server and client use the Go standard library. Release binaries are built for multiple operating systems and CPU architectures. You can run the server directly or use the repository's Dockerfile and Compose configuration.",
      },
    ],
  },
  {
    slug: "api",
    title: "Dashboard API",
    category: "Reference",
    description: "Your tunnels and traffic, programmatically.",
    sections: [
      {
        id: "auth",
        title: "Authenticate requests",
        text: "API endpoints require an Authorization: Bearer TOKEN header. The health check is public. The examples below assume the dashboard's default loopback binding.",
        code: 'curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4040/api/stats',
      },
      {
        id: "endpoints",
        title: "Endpoint reference",
        text: "These endpoints are documented by the upstream repository. Use the source for the complete response schemas.",
        table: [
          ["Method", "Path", "Purpose"],
          ["GET", "/healthz", "Health check; no auth"],
          ["GET", "/api/stats", "Server statistics"],
          ["GET", "/api/tunnels", "Active tunnels"],
          ["GET", "/api/sessions", "Connected sessions"],
          ["GET", "/api/requests", "Captured requests"],
          ["POST", "/api/requests/{id}/replay", "Replay a capture"],
          ["GET / POST", "/api/domains", "List or add domains"],
          ["GET / DELETE", "/api/domains/{domain}", "Read or remove a domain"],
          ["GET", "/api/domains/{domain}/dns", "Required DNS records"],
          ["POST", "/api/domains/{domain}/verify", "Verify domain ownership"],
        ],
      },
      {
        id: "expiry",
        title: "Read a tunnel’s expiry time",
        text: "GET /api/tunnels includes an expires_at timestamp for a time-limited tunnel. The field is omitted for tunnels without an expiry. The server enforces the deadline independently of the dashboard or client process.",
        code: 'curl -H "Authorization: Bearer YOUR_TOKEN" \\\n  http://localhost:4040/api/tunnels',
        note: "When embedding the server library, Config.PublicScheme and Config.PublicPort control the scheme and port in advertised HTTP tunnel URLs. These are Go configuration fields, not CLI flags. Dev mode configures them for its local HTTPS edge.",
      },
      {
        id: "tracing",
        title: "Follow a request",
        text: "Proxied requests include an X-Request-ID header. WireRift preserves an incoming ID or generates one, helping you connect application logs with captured traffic.",
      },
    ],
  },
  {
    slug: "configuration",
    title: "Configuration",
    category: "Operate",
    description: "Keep your connections together in a readable config file.",
    sections: [
      {
        id: "file",
        title: "One file, several tunnels",
        text: "WireRift accepts YAML and JSON. Describe your server connection once, then define the local services to expose. Keep a file containing a real token outside source control.",
        code: "# wirerift.yaml\nserver: tunnel.example.com:4443\ntoken: YOUR_TOKEN\n\ntunnels:\n  - type: http\n    local_port: 3000\n    subdomain: myapp\n    inspect: true\n\n  - type: tcp\n    local_port: 5432",
      },
      {
        id: "start",
        title: "Start from the file",
        text: "Pass the file explicitly. The config init command can generate a starting example.",
        code: "wirerift config init\nwirerift start wirerift.yaml\n# JSON is also supported\nwirerift start wirerift.json",
      },
      {
        id: "environment",
        title: "Keep a token in the environment",
        text: "The --token flag takes precedence over WIRERIFT_TOKEN. The server can generate a token when one is not supplied; use its startup output to configure your client.",
        code: "export WIRERIFT_TOKEN=YOUR_TOKEN\nwirerift http 3000 --server tunnel.example.com:4443",
      },
      {
        id: "headers",
        title: "Set response headers per tunnel",
        text: "HTTP tunnel options include inspection, access controls and custom response headers. Add them to individual entries instead of applying the same settings to every local service.",
        code: 'tunnels:\n  - type: http\n    local_port: 3000\n    subdomain: preview\n    auth: "reviewer:YOUR_PASSWORD"\n    inspect: true\n    headers: "X-Robots-Tag:noindex,X-Frame-Options:DENY"',
      },
    ],
  },
  {
    slug: "docker",
    title: "Docker deployment",
    category: "Operate",
    description: "Give your public edge a reproducible home.",
    sections: [
      {
        id: "build",
        title: "Build from the repository",
        text: "WireRift ships a Dockerfile and a Compose example. Clone the source and build the image locally.",
        code: "git clone https://github.com/WireRift/WireRift.git\ncd WireRift\ndocker build -t wirerift-server .",
      },
      {
        id: "run",
        title: "Run the server",
        text: "Publish the control and public edge ports. Persist certificate data so restarts do not discard it. Replace the domain, email and token before running.",
        code: "docker run -d --name wirerift-server \\\n  -p 4443:4443 -p 80:80 -p 443:443 \\\n  -e WIRERIFT_TOKEN=YOUR_TOKEN \\\n  -v wirerift-certs:/data/certs \\\n  wirerift-server \\\n  -domain tunnel.example.com -acme-email you@example.com",
        note: "This example configures the public HTTPS edge. Configure the separate control TLS certificate/key options before sending authenticated client traffic over an untrusted network.",
      },
      {
        id: "compose",
        title: "Use the Compose example",
        text: "The upstream Compose file maps a limited TCP port range and binds the dashboard to host loopback. Customize its domain, token, certificate options and firewall rules for your environment.",
        code: "# Review and customize docker-compose.yml first\ndocker compose up -d\ndocker compose logs -f wirerift-server",
      },
      {
        id: "health",
        title: "Check the public edge",
        text: "The /healthz endpoint is available without authentication. Use it to tell whether the server is responding; then test an actual tunnel separately.",
        code: "curl -f http://tunnel.example.com/healthz",
      },
    ],
  },
  {
    slug: "local-https",
    title: "Local HTTPS development",
    category: "Tunnels",
    description: "A trusted development edge, without a public domain.",
    sections: [
      {
        id: "dev",
        title: "Run a loopback development stack",
        text: "New in v1.8.0, --dev defaults to loopback with unprivileged ports: control 4443, HTTP 8080, HTTPS 8443. It serves HTTPS for .localhost and .test names through a persistent local CA. You do not need a public domain or ACME. Explicit address flags or environment settings override the loopback defaults.",
        code: "wirerift-server --dev\n# Use the token printed by the server\nwirerift http 3000 myapp --server 127.0.0.1:4443 --token YOUR_TOKEN",
      },
      {
        id: "trust",
        title: "Create and trust the development CA",
        text: "Run the trust command once to create the development CA and install it in your system trust store. On Linux, Chrome/Chromium and Firefox NSS profiles also need certutil from libnss3-tools or nss-tools. The command may request operating system privileges. Restart your browser afterwards.",
        code: "wirerift-server ca trust\nwirerift-server ca status",
        note: "Upstream verified the complete trust flow on Debian/Ubuntu with curl/OpenSSL, NSS and Firefox. RHEL/Fedora/Arch, macOS and Windows support is implemented and unit-tested, but upstream has not exercised those trust-store paths on real machines yet.",
      },
      {
        id: "open",
        title: "Open your local domain",
        text: "Browsers resolve *.localhost to loopback. In dev mode your app can be available at https://myapp.localhost:8443. For .test domains, add explicit local host mappings.",
      },
      {
        id: "scope",
        title: "A CA scoped to local development",
        text: "Critical X.509 name constraints restrict the CA to .localhost, .test and loopback IPs. It cannot issue valid certificates for public websites. Keep the persistent CA key private. Use --ca-dir DIR on both the server and CA commands if you choose a custom directory.",
      },
      {
        id: "undo",
        title: "Remove the local trust",
        text: "ca path prints the CA certificate path, creating the CA if needed. Tools with their own trust configuration can use that certificate with curl --cacert or NODE_EXTRA_CA_CERTS. ca untrust removes the trust; add --purge only when you also want to delete the CA files.",
        code: "wirerift-server ca path\nwirerift-server ca untrust\n# Also delete the CA files, if no longer needed:\n# wirerift-server ca untrust --purge",
      },
    ],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    category: "Reference",
    description: "Get back to a working connection.",
    sections: [
      {
        id: "doctor",
        title: "Start with wirerift doctor",
        text: "New in v1.8.0, doctor checks the server address, DNS, TCP connectivity, TLS certificate validity and expiry, and authentication in order. It stops at the first broken step with a fix hint and exits non-zero on failure. It never prints the token and warns about an unencrypted control connection to a non-loopback host.",
        code: "wirerift doctor --server tls://tunnel.example.com:4443 --token YOUR_TOKEN",
        note: "Use the same server address and token as your tunnel. For a private control-plane CA, set WIRERIFT_TLS_CA to the CA certificate file; doctor uses the client's TLS configuration.",
      },
      {
        id: "connection",
        title: "The client cannot connect",
        text: "Check the --server host and control port, the server process, and inbound firewall rules. Confirm that the client and server use the same token. A local app's port and the server's control port are different endpoints.",
      },
      {
        id: "dns",
        title: "The URL does not resolve",
        text: "Check DNS for both the base tunnel domain and its wildcard. The records must point at the tunnel server, rather than the machine running the client. Wait for DNS propagation after a change.",
      },
      {
        id: "tls",
        title: "The browser reports a certificate error",
        text: "A self-signed certificate is not publicly trusted. Configure ACME with a domain you control and a reachable HTTP challenge endpoint, or install an appropriate certificate. Check that the certificate covers the hostname you are opening.",
      },
      {
        id: "upstream",
        title: "The tunnel connects, but the app does not respond",
        text: "Open the app locally first. Verify the local port and process, then use --inspect to check paths, headers and responses. If your development server restricts allowed hosts, configure its explicit host allowlist for the tunnel URL. In v1.8.0, browsers requesting HTML get an explanatory page when a tunnel is missing, its client is disconnected or the local app is unavailable. API clients keep plain-text errors. Local-app failures include X-WireRift-Error and do not reveal your local port to visitors.",
      },
      {
        id: "expired",
        title: "A temporary tunnel has disappeared",
        text: "A tunnel created with --ttl is removed at its server-enforced deadline. Reconnecting does not reset the timer or reopen an expired tunnel. Start a new tunnel explicitly when you need another session; its former subdomain or port may already have been allocated again.",
      },
      {
        id: "help",
        title: "Still stuck?",
        text: "Run the server with --v for verbose logs and inspect --help on both binaries. When reporting an issue, include your OS, version, commands with secrets removed, and a minimal reproduction.",
      },
    ],
  },
];
