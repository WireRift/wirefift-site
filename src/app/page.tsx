import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  ChevronDown,
  Fingerprint,
  Github,
  Globe,
  LockKeyhole,
  Network,
  Radio,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  InspectorDemo,
  Quickstart,
  TerminalDemo,
} from "@/components/home-interactions";
import { Reveal } from "@/components/motion";
import { FlowArt, TunnelArt } from "@/components/tunnel-art";
import { REPO, VERSION } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const features = [
  {
    icon: Globe,
    number: "01",
    title: "Any port. New possibilities.",
    text: "HTTP apps, raw TCP services and WebSocket connections. Give your local world a public address.",
    visual: "protocols",
    href: "/docs/http-tunnels/",
    label: "Explore tunnels",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "Your edge. Your rules.",
    text: "Self-host your server. Add TLS, Basic Auth, IP allowlists and PIN protection. Decide who gets through.",
    visual: "shield",
    href: "/docs/security/",
    label: "See access controls",
  },
  {
    icon: Network,
    number: "03",
    title: "One wire. Many streams.",
    text: "A purpose-built binary protocol with stream multiplexing and flow control. Less connection overhead. More possibility.",
    visual: "streams",
    href: "/docs/architecture/",
    label: "Under the hood",
  },
];
const faqs = [
  [
    "What exactly is WireRift?",
    "An open-source tunnel server and client written in Go. It makes a service on your local machine reachable through a server you operate. Think web previews, webhook development, TCP services and file sharing.",
  ],
  [
    "Do I need to run my own server?",
    "Yes. WireRift is designed for self-hosting. Run the server on a machine with a public IP, configure your domain, and connect the client with your server address and token. The URLs on this website are illustrative examples.",
  ],
  [
    "Is it really zero dependencies?",
    "The WireRift client and server use the Go standard library, with no third-party Go packages. Prebuilt binaries do not require a Go installation. This website is a separate Next.js project.",
  ],
  [
    "Can I use my own domain and HTTPS?",
    "Yes. Configure your tunnel domain and DNS, then enable ACME for public certificates. Self-signed certificates are also supported. Control-plane TLS is configured separately from the public HTTPS edge.",
  ],
  [
    "Can I use it in commercial projects?",
    "Yes. WireRift is MIT licensed. You can use, modify and distribute it, including commercially, subject to the license terms.",
  ],
];
export default function Home() {
  return (
    <main id="main">
      <section className="hero-stage">
        <div className="hero container">
          <div className="hero-copy">
            <a
              className="release-badge"
              href={`${REPO}/releases/tag/v${VERSION}`}
            >
              <span className="status-light" />
              <strong>v{VERSION}</strong>
              <span>A little binary. A wide-open world.</span>
              <ArrowRight size={13} />
            </a>
            <h1>
              Localhost.
              <br />
              <span>Meet the world.</span>
            </h1>
            <p className="hero-lead">
              Great things start locally.
              <br />
              They don’t have to stay there.
            </p>
            <p className="hero-description">
              Expose your local services through a single Go binary.
              <br className="desktop-break" /> Open-source tunnels. Your
              infrastructure. Your rules.
            </p>
            <div className="hero-buttons">
              <Link className="button primary" href="#quickstart">
                Open your first tunnel <ArrowRight size={17} />
              </Link>
              <a className="button secondary" href={REPO}>
                <Github size={17} />
                Explore the source <ArrowUpRight size={14} />
              </a>
            </div>
            <div className="hero-proof">
              <span>
                <i />
                100% Go
              </span>
              <span>Zero dependencies</span>
              <span>MIT licensed</span>
            </div>
          </div>
          <TunnelArt />
        </div>
      </section>
      <section
        className="container terminal-section"
        aria-label="Try a tunnel example"
      >
        <Reveal>
          <TerminalDemo />
        </Reveal>
      </section>
      <div className="principle-strip container">
        <span>
          SMALL BY DESIGN.
          <br />
          <strong>OPEN BY DEFAULT.</strong>
        </span>
        <div>
          <span>
            <Terminal size={18} />
            Single binary
          </span>
          <span>
            <ShieldCheck size={18} />
            Self-hosted
          </span>
          <span>
            <Globe size={18} />
            Your domains
          </span>
          <span>
            <Zap size={18} />
            Automatic reconnect
          </span>
          <span>
            <Braces size={18} />
            Pure Go
          </span>
        </div>
      </div>
      <section className="section container" id="how-it-works">
        <Reveal>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i />
                THE SHORTEST PATH TO OUT THERE
              </span>
              <h2>
                Your machine.
                <br />
                <span>A world of connections.</span>
              </h2>
            </div>
            <div className="section-intro">
              <p>
                No port forwarding on your router.
                <br />
                No moving your app somewhere else.
              </p>
              <Link href="/docs/architecture/" className="text-link">
                Follow the connection <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <FlowArt />
          <div className="flow-bottom">
            <span>
              <LockKeyhole size={14} />
              Authentication at the connection. Access control at the edge.
            </span>
            <span>ONE CONNECTION. MULTIPLE STREAMS.</span>
          </div>
        </Reveal>
      </section>
      <section className="features-section" id="features">
        <div className="container section">
          <Reveal>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <i />
                  LESS INFRASTRUCTURE. MORE BUILDING.
                </span>
                <h2>
                  Everything you need.
                  <br />
                  <span>Nothing in your way.</span>
                </h2>
              </div>
              <p className="section-intro">
                From a quick demo to your own tunnel infrastructure.
                <br />
                The good parts are already in the binary.
              </p>
            </div>
          </Reveal>
          <div className="feature-grid">
            {features.map((feature, index) => (
              <Reveal
                key={feature.number}
                delay={index * 0.08}
                className="feature-card"
              >
                <div className="feature-card-top">
                  <feature.icon size={22} />
                  <span>{feature.number} / BUILT IN</span>
                </div>
                <div className={`feature-visual ${feature.visual}`}>
                  {feature.visual === "protocols" ? (
                    <>
                      <span>
                        HTTP <b>↗</b>
                      </span>
                      <span>
                        TCP <b>↗</b>
                      </span>
                      <span>
                        WS <b>↗</b>
                      </span>
                      <div className="protocol-track">
                        <i />
                        <i />
                        <i />
                      </div>
                    </>
                  ) : feature.visual === "shield" ? (
                    <>
                      <div className="shield-orbit" />
                      <ShieldCheck size={78} strokeWidth={1} />
                      <span className="shield-label">
                        <i />
                        ACCESS GRANTED
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="stream-inputs">
                        <i />
                        <i />
                        <i />
                      </div>
                      <svg viewBox="0 0 260 100" fill="none" aria-hidden="true">
                        <path
                          d="M0 10c80 0 60 40 120 40h140M0 50h260M0 90c80 0 60-40 120-40h140"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          className="stream-packets"
                          d="M0 10c80 0 60 40 120 40h140M0 50h260M0 90c80 0 60-40 120-40h140"
                          stroke="#E7A11B"
                          strokeWidth="4"
                          strokeDasharray="14 300"
                        />
                      </svg>
                    </>
                  )}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <Link href={feature.href} className="text-link">
                  {feature.label}
                  <ArrowRight size={14} />
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="small-features">
            <div>
              <RefreshCw size={20} />
              <span>
                <strong>Reconnect, automatically.</strong>
                <small>Exponential backoff. Tunnels recreated.</small>
              </span>
            </div>
            <div>
              <Fingerprint size={20} />
              <span>
                <strong>Bring your own domain.</strong>
                <small>DNS verification and custom routing.</small>
              </span>
            </div>
            <div>
              <Radio size={20} />
              <span>
                <strong>Know what’s happening.</strong>
                <small>Health checks and request ID tracing.</small>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="section container inspector-section">
        <Reveal>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i />
                LESS GUESSWORK. MORE CONTEXT.
              </span>
              <h2>
                Every request.
                <br />
                <span>A little less mystery.</span>
              </h2>
            </div>
            <div className="section-intro">
              <p>
                Inspect headers and bodies. Replay a webhook.
                <br />
                Debug the real conversation, right from your dashboard.
              </p>
              <Link href="/docs/inspector/" className="text-link">
                Meet your traffic inspector <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <InspectorDemo />
          <div className="inspector-caption">
            <span>Click a request. Inspect its response. Try a replay.</span>
            <span>Real features. Illustrative traffic.</span>
          </div>
        </Reveal>
      </section>
      <section className="quickstart-section" id="quickstart">
        <div className="section container">
          <Reveal>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <i />
                  YOUR NEXT IDEA IS ALREADY WAITING
                </span>
                <h2>
                  From “it works here”
                  <br />
                  <span>to “try this link.”</span>
                </h2>
              </div>
              <p className="section-intro">
                A client. A server. A connection.
                <br />
                Everything else is what you make of it.
              </p>
            </div>
            <Quickstart />
          </Reveal>
        </div>
      </section>
      <section className="section container usecases-section">
        <Reveal>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <i />
                BUILD HERE. GO ANYWHERE.
              </span>
              <h2>
                Make room for
                <br />
                <span>your next great thing.</span>
              </h2>
            </div>
            <p className="section-intro">
              A small tool for all the moments
              <br />
              localhost needs a little more reach.
            </p>
          </div>
          <div className="usecase-grid">
            {[
              [
                "01",
                "Show the work.",
                "Share a local preview with your team or a client. Keep iterating while they explore.",
                "PREVIEWS & DEMOS",
              ],
              [
                "02",
                "Catch the callback.",
                "Receive webhooks from external services on your development machine. Inspect, fix, replay.",
                "WEBHOOK DEVELOPMENT",
              ],
              [
                "03",
                "Beyond the browser.",
                "Connect to a database, game server or another TCP service through your own public edge.",
                "RAW TCP CONNECTIONS",
              ],
              [
                "04",
                "Share what you built.",
                "Serve a static folder directly through a tunnel. A quick path from build output to a public URL.",
                "STATIC FILE SHARING",
              ],
            ].map(([n, title, text, label]) => (
              <article key={n} className="usecase">
                <span className="usecase-number">{n}</span>
                <span className="mono">{label}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <ArrowUpRight size={24} />
              </article>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="section container faq-section">
        <div>
          <span className="eyebrow">
            <i />A FEW THINGS, UNTANGLED
          </span>
          <h2>
            Good questions.
            <br />
            <span>Clear answers.</span>
          </h2>
          <p>
            The code is open.
            <br />
            So is the conversation.
          </p>
          <a href={`${REPO}/issues`} className="text-link">
            Ask us on GitHub <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], index) => (
            <details key={q}>
              <summary>
                <span className="mono">0{index + 1}</span>
                {q}
                <ChevronDown size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="container">
        <Reveal className="cta-section">
          <div className="cta-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span className="eyebrow">SMALL BINARY. BIG POSSIBILITIES.</span>
          <h2>
            There’s a whole world
            <br />
            outside localhost.
          </h2>
          <p>Open a rift. See where it takes you.</p>
          <div className="hero-buttons">
            <Link className="button ink" href="/docs/getting-started/">
              Let’s make a connection <ArrowRight size={17} />
            </Link>
            <a className="button cta-github" href={REPO}>
              <Github size={17} />
              Star on GitHub
              <ArrowUpRight size={14} />
            </a>
          </div>
          <span className="cta-footnote">
            Pure Go. Zero dependencies. Entirely yours.
          </span>
        </Reveal>
      </section>
    </main>
  );
}
