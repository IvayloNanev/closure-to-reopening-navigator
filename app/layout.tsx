import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./theme.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = productionHost
  ? `https://${productionHost}`
  : "https://six-days-nyc.ethannanev.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Six Days — Understand your NYC restaurant closure",
  description: "Live public records and historical comparisons for NYC restaurant owners navigating closure and reopening.",
  icons: { icon: "/favicon.svg?v=2", shortcut: "/favicon.svg?v=2" },
  openGraph: {
    title: "Six Days — Understand your NYC restaurant closure",
    description: "See the official record, compare similar closures, learn from repeat closures, and follow what changes next.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Six Days — NYC restaurant closure-to-reopening data story" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
