import type { Metadata } from "next";
import { EB_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "CV-gen",
  description: "Harvard-style CV editor with drag-and-drop sections.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${garamond.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
