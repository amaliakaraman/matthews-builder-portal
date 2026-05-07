import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Builder Portal",
    template: "%s — Builder Portal",
  },
  description:
    "Builder Portal — the operational system for Matthews CRE's Citizen Builder Program. Register, classify, and track every internal app.",
  applicationName: "Builder Portal",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e1a34",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-matthews-deep antialiased">
        {children}
      </body>
    </html>
  );
}
