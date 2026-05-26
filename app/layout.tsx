import type { Metadata, Viewport } from "next";
import React from "react";

import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  applicationName: "JoinUs",
  title: "JoinUs",
  description: "Create, send, and track personalized event invitations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JoinUs",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0f766e",
    "msapplication-TileImage": "/icons/mstile-144.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
