import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = productionHost
  ? `https://${productionHost}`
  : "https://six-days-nyc.ethannanev.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Six Days — Restaurant Reopening Service",
  description: "Affordable online support for NYC restaurants preparing to reopen after a DOHMH closure.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Six Days — Restaurant Reopening Service",
    description: "Affordable online support for NYC restaurants preparing to reopen after a DOHMH closure.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Six Days — NYC restaurant closure-to-reopening data story" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
