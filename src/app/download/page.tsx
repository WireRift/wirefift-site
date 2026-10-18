import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DownloadPicker } from "@/components/download-picker";
import { REPO, VERSION } from "@/lib/site";
export const metadata: Metadata = {
  title: "Download",
  description:
    "Download WireRift for macOS, Linux, Windows and FreeBSD. Single binaries, no runtime dependencies.",
  alternates: { canonical: "/download/" },
};
export default function Download() {
  return (
    <main id="main" className="container">
      <header className="subpage-header">
        <span className="eyebrow">
          <i />
          SMALL DOWNLOAD. OPEN POSSIBILITIES.
        </span>
        <h1>
          Your next connection
          <br />
          starts here.
        </h1>
        <p>
          Two binaries. Zero runtime dependencies. Pick the one for your machine
          and get back to what you’re building.
        </p>
      </header>
      <div className="download-layout">
        <DownloadPicker />
        <aside className="download-aside">
          <span className="release-label">LATEST RELEASE / v{VERSION}</span>
          <h2>The client goes with you.</h2>
          <p>
            Run <code>wirerift</code> alongside your local app. It connects
            outbound to a server you control and brings public requests back to
            your machine.
          </p>
          <h2>The server is your edge.</h2>
          <p>
            Run <code>wirerift-server</code> on a reachable machine. Configure
            your domain, token and TLS, then open your first tunnel.
          </p>
          <Link href="/docs/server/" className="text-link">
            Set up your server <ArrowRight size={15} />
          </Link>
          <p>
            Developing locally? v{VERSION} includes trusted HTTPS on loopback
            with <code>--dev</code>, plus temporary tunnels and connection
            diagnostics.
          </p>
          <Link href="/changelog/" className="text-link">
            What’s new in v{VERSION} <ArrowRight size={15} />
          </Link>
          <hr />
          <h2>Prefer to build it yourself?</h2>
          <p>
            All you need is Go 1.23 or later and the source. The tunnel engine
            uses the standard library.
          </p>
          <Link href="/docs/installation/#source" className="text-link">
            Build from source <ArrowRight size={15} />
          </Link>
          <a href={`${REPO}/releases`} className="button secondary">
            <Github size={16} />
            All releases <ArrowUpRight size={14} />
          </a>
          <p className="download-note">
            Release files are served directly by GitHub. The website does not
            install or execute anything on your machine.
          </p>
        </aside>
      </div>
    </main>
  );
}
