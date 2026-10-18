import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { SiteBackground } from "@/components/site-background";
import { description, SITE } from "@/lib/site";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import "./appearance.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "WireRift — Localhost. Meet the world.",
    template: "%s · WireRift",
  },
  description,
  openGraph: {
    title: "WireRift — Localhost. Meet the world.",
    description,
    url: SITE,
    siteName: "WireRift",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "WireRift — Your localhost, connected to the world",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WireRift — Localhost. Meet the world.",
    description,
    images: ["/og.png"],
  },
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffdf8" },
    { media: "(prefers-color-scheme: dark)", color: "#111310" },
  ],
};
const themeScript =
  "try{var t=localStorage.getItem('wirerift-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:'system'}catch{}";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Fixed local theme bootstrap; contains no external input. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteBackground />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
