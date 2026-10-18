import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Code } from "@/components/code";
import { docs } from "@/lib/docs";
import { REPO, VERSION } from "@/lib/site";

export function generateStaticParams() {
  return docs.map((doc) => ({ slug: doc.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = docs.find((d) => d.slug === slug);
  return {
    title: doc?.title ?? "Documentation",
    description: doc?.description,
    alternates: { canonical: `/docs/${slug}/` },
  };
}
export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = docs.findIndex((d) => d.slug === slug);
  const doc = docs[index];
  if (!doc) notFound();
  return (
    <main id="main" className="docs-layout container">
      <aside className="docs-sidebar">
        <nav aria-label="Documentation">
          {["Start here", "Tunnels", "Operate", "Reference"].map((category) => (
            <div className="docs-nav-group" key={category}>
              <h2>{category}</h2>
              {docs
                .filter((d) => d.category === category)
                .map((d) => (
                  <Link
                    key={d.slug}
                    href={`/docs/${d.slug}/`}
                    aria-current={d.slug === slug ? "page" : undefined}
                  >
                    {d.title}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <a
          className="docs-sidebar-bottom"
          href={`${REPO}/releases/tag/v${VERSION}`}
        >
          <BookOpen size={13} />
          Version {VERSION}
          <ArrowUpRight size={12} />
        </a>
      </aside>
      <article className="doc-content">
        <details className="docs-mobile-nav">
          <summary>Browse documentation</summary>
          <nav aria-label="Documentation topics">
            {docs.map((d) => (
              <Link
                key={d.slug}
                href={`/docs/${d.slug}/`}
                aria-current={d.slug === slug ? "page" : undefined}
              >
                {d.title}
              </Link>
            ))}
          </nav>
        </details>
        <header className="doc-header">
          <span className="eyebrow">
            DOCUMENTATION / {doc.category.toUpperCase()}
          </span>
          <h1>{doc.title}</h1>
          <p>{doc.description}</p>
        </header>
        {doc.sections.map((section) => (
          <section className="doc-section" key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
            {section.code && <Code>{section.code}</Code>}
            {section.note && <p className="doc-note">{section.note}</p>}
            {section.table && (
              /* biome-ignore lint/a11y/useSemanticElements: Keep the table overflow wrapper. */
              <div
                className="doc-table-wrap"
                role="region"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Allow keyboard scrolling of the endpoint table.
                tabIndex={0}
                aria-label="API endpoints"
              >
                <table className="doc-table">
                  <thead>
                    <tr>
                      {section.table[0].map((cell) => (
                        <th key={cell} scope="col">
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.slice(1).map((row) => (
                      <tr key={row.join(":")}>
                        {row.map((cell) => (
                          <td key={cell}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
        <div className="doc-footer">
          <p>
            Based on the{" "}
            <a href={`${REPO}/blob/v${VERSION}/README.md`}>
              upstream WireRift reference <ArrowUpRight size={12} />
            </a>
            {` for v${VERSION}. Check the source for the complete options.`}
          </p>
          <div className="doc-pagination">
            {index > 0 ? (
              <Link href={`/docs/${docs[index - 1].slug}/`}>
                <ArrowLeft size={16} />
                <span>
                  <small>Previous</small>
                  {docs[index - 1].title}
                </span>
              </Link>
            ) : (
              <Link href="/download/">
                <ArrowLeft size={16} />
                <span>
                  <small>Get the binary</small>Downloads
                </span>
              </Link>
            )}
            {index < docs.length - 1 ? (
              <Link href={`/docs/${docs[index + 1].slug}/`}>
                <span>
                  <small>Up next</small>
                  {docs[index + 1].title}
                </span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href={`${REPO}/issues`}>
                <span>
                  <small>Need a hand?</small>Ask on GitHub
                </span>
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </article>
      <aside className="doc-toc">
        <h2>On this page</h2>
        <nav aria-label="On this page">
          {doc.sections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </nav>
      </aside>
    </main>
  );
}
