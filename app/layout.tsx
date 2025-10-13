// app/layout.tsx
import './globals.css';
import React from 'react';
import Link from 'next/link';


export const metadata = {
  title: 'JoinUs - Create Beautiful Party Invitations',
  description: 'Create and share stunning invitations for any celebration',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen">
          {/* Header */}
          <header className="relative z-20 backdrop-blur-sm bg-white/5 border-b border-purple-500/20">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="text-3xl group-hover:scale-110 transition-transform">🎉</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                  JoinUs
                </h1>
              </Link>
              <nav className="flex gap-6">
                <Link
                  href="/invite"
                  className="text-purple-200 hover:text-pink-300 transition-colors font-medium"
                >
                  Create Invite
                </Link>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="relative z-10">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-20 mt-20 backdrop-blur-sm bg-white/5 border-t border-purple-500/20">
            <div className="max-w-7xl mx-auto px-6 py-8 text-center">
              <p className="text-purple-300 mb-2">
                Made with 💜 for celebrations
              </p>
              <p className="text-purple-400 text-sm">
                Create memorable invitations for every special moment
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}