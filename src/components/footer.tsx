import { ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";
import { REPO, SITE_REPO } from "@/lib/site";
import { Logo } from "./logo";
import { OxogMark } from "./oxog-mark";
import "./oxog-footer.css";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link href="/" aria-label="WireRift home">
            <Logo />
          </Link>
          <p>
            Local by nature.
            <br />
            Connected by choice.
          </p>
          <span className="built-go">
            <i />
            Built in Go. Open by design.
          </span>
        </div>
        <div className="footer-column">
          <h3>WireRift</h3>
          <Link href="/#features">Features</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/download/">Downloads</Link>
          <Link href="/changelog/">What’s new</Link>
        </div>
        <div className="footer-column">
          <h3>For developers</h3>
          <Link href="/docs/getting-started/">Documentation</Link>
          <Link href="/docs/server/">Self-hosting</Link>
          <Link href="/docs/api/">API reference</Link>
          <Link href="/docs/security/">Security</Link>
        </div>
        <div className="footer-column">
          <h3>Open source</h3>
          <a href={REPO}>
            GitHub <ArrowUpRight size={12} />
          </a>
          <a href={`${REPO}/issues`}>Report an issue</a>
          <Link href="/brand/">Brand assets</Link>
          <a href={`${REPO}/blob/master/LICENSE`}>MIT license</a>
        </div>
      </div>
      <div className="studio-section container">
        <a className="studio" href="https://oxog.net">
          <OxogMark />
          <div>
            <span className="eyebrow">PART OF A BIGGER PICTURE</span>
            <h2>
              Small studio. <span>Big ideas.</span>
            </h2>
            <p>Explore the tools and infrastructure from Oxog.</p>
          </div>
          <span className="studio-link">
            Meet oxog.net <ArrowUpRight size={18} />
          </span>
        </a>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getUTCFullYear()} WireRift contributors</span>
        <span className="footer-bottom-links">
          <a href={`${REPO}/blob/master/LICENSE`}>MIT licensed</a>
          <a href={SITE_REPO}>
            Website source <ArrowUpRight size={12} />
          </a>
          <a href={REPO} aria-label="WireRift on GitHub">
            <Github size={17} />
          </a>
        </span>
      </div>
    </footer>
  );
}
