"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import PwaClient from "./pwa-client";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <PwaClient />
    </SessionProvider>
  );
}
