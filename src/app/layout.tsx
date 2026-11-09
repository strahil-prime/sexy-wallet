import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "Personal Finance Redefined. Nobby is the money app with Bella, your personal teller.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nobby-wallet.vercel.app"),
  title: "Nobby",
  description,
  applicationName: "Nobby",
  appleWebApp: { title: "Nobby", capable: true, statusBarStyle: "black-translucent" },
  openGraph: { type: "website", siteName: "Nobby", title: "Nobby | Personal Finance Redefined", description, url: "/" },
  twitter: { card: "summary_large_image", title: "Nobby | Personal Finance Redefined", description },
};

export const viewport: Viewport = {
  themeColor: "#03080c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${figtree.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
