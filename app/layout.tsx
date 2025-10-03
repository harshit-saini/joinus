// app/layout.tsx
import './globals.css';
import React from 'react';


export const metadata = {
  title: 'Invite App',
  description: 'Create and share invitations',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
          <header style={{ marginBottom: 24 }}>
            <h1>Invite App</h1>
            <p>Create invitations for birthdays, weddings and more.</p>
            <hr />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}