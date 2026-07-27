import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MoneyMovementUsingAgentsAndIdentity",
  description:
    "Send money to anyone using just their phone number or email. Our Routing Agent selects the fastest, cheapest, and most reliable payment rail automatically.",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
