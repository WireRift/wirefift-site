import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { releases } from "@/lib/releases";
import { REPO, VERSION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Changelog",
  description: `What’s new in WireRift v${VERSION}: local HTTPS, tunnel time limits, connection diagnostics and helpful error pages.`,
  alternates: { canonical: "/changelog/" },
};
export default function Changelog() {
  return (
    <main id="main" className="container">
      <header className="subpage-header">
        <span className="eyebrow">
          <i />
          THE CONNECTION KEEPS GETTING BETTER
        </span>
        <h1>
          Built in the open.
          <br />
          Always moving.
        </h1>
        <p>
          Release notes, practical guides, and the source behind each change.
          Here’s what shipped in WireRift.
        </p>
      </header>
      <div className="release-layout">
        <div className="release-history">
          {releases.map((release, index) => (
            <article
              className="release-card"
              key={release.version}
              id={`v${release.version}`}
            >
              <div className="release-meta">
                <span className="release-label">
                  {index === 0 ? "LATEST RELEASE" : "RELEASE"} / v
                  {release.version}
                </span>
                <time dateTime={release.date}>{release.dateLabel}</time>
              </div>
              <h2>{release.title}</h2>
              <p>{release.summary}</p>
              {release.changes.length > 0 && (
                <ul className="release-changes">
                  {release.changes.map((change) => (
                    <li key={change.title}>
                      <h3>{change.title}</h3>
                      <p>{change.text}</p>
                      <Link href={change.href} className="text-link">
                        {change.label} <ArrowRight size={14} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="release-actions">
                <a
                  href={`${REPO}/releases/tag/v${release.version}`}
                  className="text-link"
                >
                  GitHub release <ArrowUpRight size={14} />
                </a>
                <a
                  href={`${REPO}/compare/v${release.previous}...v${release.version}`}
                  className="text-link"
                >
                  Compare changes <ArrowUpRight size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>
        <aside className="release-card release-aside">
          <span className="release-label">WIRERIFT / v{VERSION}</span>
          <h2>Every change has a trail.</h2>
          <p>
            These notes summarize published releases. The upstream changelog
            records the complete history; source commits may include work that
            has not shipped yet.
          </p>
          <Link href="/download/" className="button primary">
            Get v{VERSION} <ArrowRight size={16} />
          </Link>
          <div className="release-source-links">
            <a
              href={`${REPO}/blob/v${VERSION}/CHANGELOG.md`}
              className="text-link"
            >
              Full upstream changelog <ArrowUpRight size={15} />
            </a>
            <a href={`${REPO}/releases`} className="text-link">
              All releases <ArrowUpRight size={15} />
            </a>
            <a href={`${REPO}/commits/master/`} className="text-link">
              Source history <ArrowUpRight size={15} />
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
