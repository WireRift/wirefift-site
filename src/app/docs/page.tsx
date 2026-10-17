import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { docs } from "@/lib/docs";
export const metadata: Metadata = {
  title: "Documentation",
  alternates: { canonical: "/docs/" },
};
export default function Docs() {
  return (
    <main id="main" className="container">
      <header className="subpage-header">
        <span className="eyebrow">THE WIRE MANUAL</span>
        <h1>Make the connection.</h1>
        <p>
          From your first binary to your own public edge. Everything you need to
          get WireRift running your way.
        </p>
      </header>
      <div className="resource-grid">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}/`}
            className="download-card"
          >
            <span className="eyebrow">{doc.category}</span>
            <h2>
              {doc.title} <ArrowRight size={20} />
            </h2>
            <p>{doc.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
