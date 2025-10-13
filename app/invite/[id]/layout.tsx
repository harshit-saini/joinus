// app/invite/[id]/layout.tsx
import '../../globals.css';
import React from 'react';

export const metadata = {
  title: 'You are Invited!',
  description: 'View your special invitation',
};

export default function InviteDisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
