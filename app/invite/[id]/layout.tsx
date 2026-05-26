// app/invite/[id]/layout.tsx
import React from "react";

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout can be expanded to add specific styles or context for invites
  return <>{children}</>;
}
