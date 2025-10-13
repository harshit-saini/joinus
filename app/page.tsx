// app/page.tsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Animated confetti background */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 opacity-80"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                background: ['#ec4899', '#8b5cf6', '#3b82f6', '#fbbf24', '#10b981', '#f97316'][Math.floor(Math.random() * 6)],
                animation: `confetti-fall ${5 + Math.random() * 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        {/* Party emojis floating */}
        <div className="text-6xl mb-8 flex justify-center gap-6">
          <span className="inline-block animate-[float_3s_ease-in-out_infinite]">🎉</span>
          <span className="inline-block animate-[float_3s_ease-in-out_infinite_0.5s]">🎊</span>
          <span className="inline-block animate-[float_3s_ease-in-out_infinite_1s]">🎈</span>
          <span className="inline-block animate-[float_3s_ease-in-out_infinite_1.5s]">🎁</span>
        </div>

        {/* Hero title */}
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite]">
          Let's Celebrate!
        </h1>

        {/* Subtitle */}
        <p className="text-2xl md:text-3xl mb-4 text-purple-200 font-semibold">
          Create Beautiful Invitations
        </p>

        <p className="text-lg md:text-xl mb-12 text-purple-300 max-w-2xl mx-auto">
          Design stunning invites for birthdays, weddings, parties, and any special occasion.
          Share the joy with a single link!
        </p>

        {/* CTA Button */}
        <Link
          href="/invite"
          className="group relative inline-block"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-[pulse-glow_2s_ease-in-out_infinite]"></div>
          <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-xl px-12 py-5 rounded-full transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl">
            Create Your Invite 🎨
          </div>
        </Link>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-purple-300/30 hover:border-pink-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2 text-pink-300">Beautiful Designs</h3>
            <p className="text-purple-200">Create eye-catching invitations that your guests will love</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-purple-300/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2 text-blue-300">Instant Sharing</h3>
            <p className="text-purple-200">Share your invitation with a simple link, no downloads needed</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-purple-300/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="text-4xl mb-4">💝</div>
            <h3 className="text-xl font-bold mb-2 text-yellow-300">Any Occasion</h3>
            <p className="text-purple-200">Perfect for birthdays, weddings, parties, and celebrations</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-[float_4s_ease-in-out_infinite]">🎈</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-[float_5s_ease-in-out_infinite]">🎁</div>
      <div className="absolute top-1/3 right-20 text-5xl opacity-20 animate-[float_6s_ease-in-out_infinite]">⭐</div>
      <div className="absolute bottom-1/3 left-20 text-5xl opacity-20 animate-[float_4.5s_ease-in-out_infinite]">🌟</div>
    </div>
  );
}