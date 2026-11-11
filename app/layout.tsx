import type { Metadata, Viewport } from "next";
import "@fontsource-variable/schibsted-grotesk";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muhammad Rayyan, full-stack developer",
  description:
    "Full-stack developer in Karachi. I design and build websites and web apps, from the first sketch to the live link.",
  openGraph: {
    title: "Muhammad Rayyan, full-stack developer",
    description: "Websites and web apps, from the first sketch to the live link.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#16181b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
