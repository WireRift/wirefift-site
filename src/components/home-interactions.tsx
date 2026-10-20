"use client";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  CornerDownRight,
  Play,
  Radio,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Code, CopyButton } from "./code";

const examples = {
  HTTP: {
    command:
      "wirerift http 3000 myapp --server tunnel.example.com:4443 --token YOUR_TOKEN",
    url: "https://myapp.tunnel.example.com",
    local: "http://localhost:3000",
    output: "HTTP tunnel established",
    note: "Web apps, previews & webhook endpoints",
  },
  TCP: {
    command:
      "wirerift tcp 5432 --server tunnel.example.com:4443 --token YOUR_TOKEN",
    url: "tcp://tunnel.example.com:20001",
    local: "localhost:5432",
    output: "TCP tunnel established",
    note: "Databases, game servers & raw connections",
  },
  Files: {
    command:
      "wirerift serve ./dist --server tunnel.example.com:4443 --token YOUR_TOKEN",
    url: "https://preview.tunnel.example.com",
    local: "./dist",
    output: "File server tunnel established",
    note: "Static sites, builds & quick file sharing",
  },
};
export function TerminalDemo() {
  const [active, setActive] = useState<keyof typeof examples>("HTTP");
  const example = examples[active];
  return (
    <div className="terminal-demo">
      <div className="terminal-titlebar">
        <div className="window-dots">
          <i />
          <i />
          <i />
        </div>
        <span>your next great idea — terminal</span>
        <span className="terminal-state">
          <i />
          CONNECTED
        </span>
      </div>
      <div className="terminal-main">
        <div
          className="terminal-tabs"
          role="tablist"
          aria-label="Tunnel examples"
        >
          {(Object.keys(examples) as Array<keyof typeof examples>).map(
            (key, index) => (
              <button
                type="button"
                role="tab"
                key={key}
                id={`terminal-${key}`}
                aria-selected={active === key}
                aria-controls="terminal-panel"
                tabIndex={active === key ? 0 : -1}
                onClick={() => setActive(key)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const keys = Object.keys(examples) as Array<
                      keyof typeof examples
                    >;
                    const next =
                      keys[(index + (e.key === "ArrowRight" ? 1 : 2)) % 3];
                    setActive(next);
                    document.getElementById(`terminal-${next}`)?.focus();
                  }
                }}
              >
                {key === "HTTP"
                  ? "HTTP tunnel"
                  : key === "TCP"
                    ? "TCP tunnel"
                    : "Serve files"}
              </button>
            ),
          )}
        </div>
        <div
          role="tabpanel"
          id="terminal-panel"
          aria-labelledby={`terminal-${active}`}
          className="terminal-panel"
        >
          <div className="terminal-command">
            <span className="terminal-dollar">$</span>
            <code>{example.command}</code>
            <CopyButton text={example.command} />
          </div>
          <div className="terminal-output" key={active}>
            <span>
              <Check size={14} /> {example.output}
            </span>
            <div>
              <CornerDownRight size={17} />
              <strong>{example.url}</strong>
              <ArrowRight size={15} />
              <code>{example.local}</code>
            </div>
          </div>
          <div className="terminal-footnote">
            <span>{example.note}</span>
            <span>Illustrative output · use your own server</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const requests = [
  {
    method: "POST",
    path: "/webhooks/payment",
    status: 200,
    time: "24 ms",
    body: '{\n  "event": "payment.completed",\n  "data": {\n    "id": "pay_demo_01",\n    "amount": 4900,\n    "currency": "USD",\n    "status": "succeeded"\n  }\n}',
    response: '{ "received": true }',
  },
  {
    method: "GET",
    path: "/api/projects",
    status: 200,
    time: "12 ms",
    body: "No request body",
    response: '{ "projects": ["next-great-idea"] }',
  },
  {
    method: "POST",
    path: "/api/preview",
    status: 201,
    time: "18 ms",
    body: '{\n  "branch": "feature/new-idea",\n  "preview": true\n}',
    response: '{ "created": true, "id": "preview_01" }',
  },
];
export function InspectorDemo() {
  const [active, setActive] = useState(0);
  const [view, setView] = useState("Request");
  const [replayed, setReplayed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [copying, setCopying] = useState(false);
  const copyGeneration = useRef(0);
  const r = requests[active];
  const curl = `curl -X ${r.method} 'http://localhost:3000${r.path}'${r.method === "POST" ? ` -H 'Content-Type: application/json' -d '${r.body}'` : ""}`;
  const replayRef = useRef(0);
  return (
    <div className="inspector">
      <div className="inspector-bar">
        <span>
          <Radio size={15} />
          Traffic inspector
        </span>
        <span className="inspector-live">
          <i /> INTERACTIVE DEMO
        </span>
        <span className="inspector-host">localhost:4040</span>
      </div>
      <div className="inspector-content">
        <div className="request-list">
          <div className="request-list-heading">
            <span>REQUESTS</span>
            <span>3</span>
          </div>
          {requests.map((request, index) => (
            <button
              type="button"
              key={request.path}
              aria-pressed={active === index}
              onClick={() => {
                setActive(index);
                setReplayed(false);
                setCopied(false);
                setCopyError(false);
                setCopying(false);
                copyGeneration.current += 1;
              }}
            >
              <span
                className={`request-method ${request.method.toLowerCase()}`}
              >
                {request.method}
              </span>
              <span className="request-path">{request.path}</span>
              <span className="request-code">{request.status}</span>
              <small>{request.time}</small>
              <ChevronRight size={14} />
            </button>
          ))}
          <div className="request-list-note">
            <span className="status-light" /> Listening for your next idea.
          </div>
        </div>
        <div className="request-detail">
          <div className="request-detail-heading">
            <span>
              <b className="request-code">
                {r.status} {r.status === 201 ? "Created" : "OK"}
              </b>
              <small>{r.time}</small>
            </span>
            <button
              type="button"
              className="replay-button"
              onClick={() => {
                replayRef.current += 1;
                setReplayed(true);
              }}
            >
              <Play size={12} />
              {replayed ? "Replayed" : "Replay request"}
            </button>
          </div>
          <fieldset
            className="request-detail-tabs"
            aria-label="Inspector detail"
          >
            {["Request", "Response", "Headers"].map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={view === tab}
                onClick={() => setView(tab)}
              >
                {tab}
              </button>
            ))}
            <span>application/json</span>
          </fieldset>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex lint/a11y/useSemanticElements: Preformatted payloads must remain keyboard scrollable. */}
          <pre tabIndex={0} role="region" aria-label="Inspector payload">
            <code>
              {view === "Request"
                ? r.body
                : view === "Response"
                  ? r.response
                  : "content-type: application/json\nx-request-id: req_demo_01\nuser-agent: webhook-demo/1.0\nx-forwarded-proto: https"}
            </code>
          </pre>
          <div className="inspector-bottom">
            <span role="status">
              {copyError
                ? "Clipboard unavailable. Select and copy the command below."
                : copying
                  ? "Copying cURL command…"
                  : copied
                    ? "cURL command copied."
                    : replayed
                      ? `Demo replay ${replayRef.current} completed · ${r.status} · no network request sent`
                      : "Sample traffic · nothing is sent from your browser"}
            </span>
            <button
              type="button"
              disabled={copying}
              aria-busy={copying}
              onClick={async () => {
                const generation = ++copyGeneration.current;
                setCopying(true);
                setCopyError(false);
                try {
                  await navigator.clipboard.writeText(curl);
                  if (generation === copyGeneration.current) setCopied(true);
                } catch {
                  if (generation === copyGeneration.current) {
                    setCopied(false);
                    setCopyError(true);
                  }
                } finally {
                  if (generation === copyGeneration.current) setCopying(false);
                }
              }}
            >
              <Copy size={12} />
              {copying ? "Copying…" : copied ? "Copied" : "Copy cURL"}
            </button>
          </div>
          {copyError && <Code title="cURL command">{curl}</Code>}
        </div>
      </div>
    </div>
  );
}

const installs = {
  macOS:
    "curl -fLo wirerift https://github.com/WireRift/WireRift/releases/latest/download/wirerift-darwin-arm64\nchmod +x wirerift\nsudo mv wirerift /usr/local/bin/",
  Linux:
    "curl -fLo wirerift https://github.com/WireRift/WireRift/releases/latest/download/wirerift-linux-amd64\nchmod +x wirerift\nsudo mv wirerift /usr/local/bin/",
  Windows:
    'Invoke-WebRequest -Uri "https://github.com/WireRift/WireRift/releases/latest/download/wirerift-windows-amd64.exe" -OutFile "wirerift.exe"\n.\\wirerift.exe --help',
  Go: "go install github.com/wirerift/wirerift/cmd/wirerift@latest\ngo install github.com/wirerift/wirerift/cmd/wirerift-server@latest",
};
export function Quickstart() {
  const [os, setOS] = useState<keyof typeof installs>("macOS");
  const continuation = os === "Windows" ? "`" : "\\";
  return (
    <div className="quickstart-layout">
      <div className="quickstart-steps">
        <div className="quick-step active">
          <span>01</span>
          <div>
            <h3>Pick up a binary.</h3>
            <p>Download for your platform. No runtime, no package circus.</p>
          </div>
        </div>
        <div className="quick-step">
          <span>02</span>
          <div>
            <h3>Bring your own server.</h3>
            <p>
              Run WireRift on your infrastructure, set your domain, and choose a
              token.
            </p>
            <Link href="/docs/server/">
              Set up your server <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="quick-step">
          <span>03</span>
          <div>
            <h3>Open a rift.</h3>
            <p>
              Point the client at your server. Your localhost has a public
              address.
            </p>
          </div>
        </div>
        <Link href="/docs/getting-started/" className="text-link">
          Take the full quick start <ArrowRight size={16} />
        </Link>
      </div>
      <div className="quickstart-code">
        <fieldset className="os-tabs" aria-label="Installation platform">
          {(Object.keys(installs) as Array<keyof typeof installs>).map(
            (key) => (
              <button
                type="button"
                key={key}
                aria-pressed={os === key}
                onClick={() => setOS(key)}
              >
                {key}
              </button>
            ),
          )}
        </fieldset>
        <Code
          title={
            os === "Windows"
              ? "PowerShell · x64"
              : os === "macOS"
                ? "terminal · Apple Silicon"
                : os === "Linux"
                  ? "terminal · amd64"
                  : "terminal · Go 1.23+"
          }
        >
          {installs[os]}
        </Code>
        <div className="quick-connect">
          <Terminal size={15} />
          <span>Then, connect to your server:</span>
        </div>
        <Code title="your first HTTP tunnel">{`${os === "Windows" ? ".\\wirerift.exe" : "wirerift"} http 3000 myapp ${continuation}\n  --server tunnel.example.com:4443 ${continuation}\n  --token YOUR_TOKEN`}</Code>
        <p className="code-note">
          Need another architecture?{" "}
          <Link href="/download/">
            Find your binary <ArrowRight size={12} />
          </Link>
        </p>
      </div>
    </div>
  );
}
