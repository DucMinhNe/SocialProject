import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Social Chat App — Real-time Messaging",
  description:
    "A real-time 1-to-1 chat app with read receipts, push notifications, blue-tick verification, and a role-gated admin console.",
  applicationName: "Social Chat App",
  openGraph: {
    title: "Social Chat App — Real-time Messaging",
    description:
      "Real-time 1-to-1 chat with read receipts, push notifications, and blue-tick verification.",
    type: "website",
  },
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
        {children}
      </body>
    </html>
  );
}
