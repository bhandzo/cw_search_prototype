import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SettingsDialog } from "@/components/settings-dialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clockwork AI Prototype",
  description: "AI-powered search interface for Clockwork Recruiting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed top-4 right-4 z-50">
          <SettingsDialog />
        </div>
        {children}
      </body>
    </html>
  );
}
