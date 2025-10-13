// app/invite/[id]/page.tsx
import dbConnect from '../../../lib/mongoose';
import InviteModel from '../../../lib/models/invite';

interface Props {
  params: Promise<{ id: string }>;
}

// Helper function to convert Google Maps URL to embed URL
function getEmbedMapUrl(mapLink: string): string {
  try {
    // If already an embed URL, return as is
    if (mapLink.includes('/embed')) {
      return mapLink;
    }

    // Extract coordinates or place ID from various Google Maps URL formats
    const url = new URL(mapLink);

    // Format: https://www.google.com/maps/place/.../@lat,lng,...
    const coordMatch = mapLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const [, lat, lng] = coordMatch;
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s`;
    }

    // Format: https://maps.app.goo.gl/... or https://goo.gl/maps/...
    // For short URLs, just replace the domain
    if (mapLink.includes('goo.gl') || mapLink.includes('maps.app.goo.gl')) {
      return mapLink.replace('maps.app.goo.gl', 'www.google.com/maps/embed').replace('goo.gl/maps', 'www.google.com/maps/embed');
    }

    // Default: try simple replacement
    return mapLink.replace('/maps/', '/maps/embed/').replace('?', '&').replace('&', '?pb=!1m18!1m12!1m3!1d&');
  } catch (e) {
    // If URL parsing fails, return original
    return mapLink;
  }
}

// Birthday Invitation Component
function BirthdayInvitation({ data }: { data: any }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-[float_4s_ease-in-out_infinite]">🎈</div>
        <div className="absolute top-20 right-20 text-6xl animate-[float_5s_ease-in-out_infinite]">🎂</div>
        <div className="absolute bottom-20 left-20 text-6xl animate-[float_6s_ease-in-out_infinite]">🎁</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-[float_4.5s_ease-in-out_infinite]">🎉</div>
        <div className="absolute top-1/2 left-1/4 text-5xl animate-[float_5.5s_ease-in-out_infinite] opacity-50">⭐</div>
        <div className="absolute top-1/3 right-1/3 text-5xl animate-[float_4.8s_ease-in-out_infinite] opacity-50">✨</div>
      </div>

      {/* Main invitation card */}
      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-1 shadow-2xl animate-[pulse-glow_3s_ease-in-out_infinite]">
          <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-3xl p-8 md:p-12">
            {/* Top decoration */}
            <div className="text-center text-5xl mb-6">
              🎊 🎉 🎈
            </div>

            {/* Receiver greeting */}
            {data.receiverName && (
              <p className="text-center text-2xl text-pink-200 mb-6 font-semibold">
                Dear {data.receiverName},
              </p>
            )}

            {/* You're Invited */}
            <h1 className="text-center text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
              You're Invited!
            </h1>

            {/* Title */}
            <h2 className="text-center text-3xl md:text-4xl font-bold text-white mb-6">
              {data.title}
            </h2>

            {/* Message */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6 border border-pink-300/30">
              <p className="text-purple-100 text-lg text-center leading-relaxed">
                {data.message}
              </p>
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center gap-4 text-purple-200">
                <span className="text-3xl">📅</span>
                <div>
                  <p className="font-semibold text-white">Date</p>
                  <p>{new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {data.time && (
                <div className="flex items-center justify-center gap-4 text-purple-200">
                  <span className="text-3xl">⏰</span>
                  <div>
                    <p className="font-semibold text-white">Time</p>
                    <p>{data.time}</p>
                  </div>
                </div>
              )}

              {data.venue && (
                <div className="flex items-center justify-center gap-4 text-purple-200">
                  <span className="text-3xl">📍</span>
                  <div>
                    <p className="font-semibold text-white">Venue</p>
                    <p>{data.venue}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Google Maps */}
            {data.mapLink && (
              <div className="mb-8">
                <h3 className="text-center text-2xl font-bold text-pink-300 mb-4">📍 Location on Map</h3>
                <div className="rounded-xl overflow-hidden border-4 border-pink-400/40 shadow-2xl">
                  <iframe
                    src={getEmbedMapUrl(data.mapLink)}
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <a
                  href={data.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center mt-4 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
            )}

            {/* Bottom decoration */}
            <div className="text-center text-5xl mt-8">
              🎂 🎁 ✨
            </div>

            {/* RSVP note */}
            <p className="text-center text-purple-300 mt-8 text-sm">
              We can't wait to celebrate with you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Indian Royal Wedding Invitation Component
function WeddingInvitation({ data }: { data: any }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #4a0404 0%, #7a1515 25%, #4a0404 50%, #7a1515 75%, #4a0404 100%)',
    }}>
      {/* Royal background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #fbbf24 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Animated golden sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: '#fbbf24',
              animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              boxShadow: '0 0 10px #fbbf24',
            }}
          />
        ))}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-6xl animate-[float_5s_ease-in-out_infinite] opacity-80">🪔</div>
        <div className="absolute top-10 right-10 text-6xl animate-[float_5s_ease-in-out_infinite] opacity-80">🪔</div>
        <div className="absolute bottom-10 left-10 text-6xl animate-[float_4.5s_ease-in-out_infinite] opacity-80">🌺</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-[float_4.5s_ease-in-out_infinite] opacity-80">🌺</div>
        <div className="absolute top-1/4 left-1/4 text-5xl animate-[float_6s_ease-in-out_infinite] opacity-60">✨</div>
        <div className="absolute top-1/3 right-1/4 text-5xl animate-[float_5.5s_ease-in-out_infinite] opacity-60">💫</div>
      </div>

      {/* Main invitation card */}
      <div className="relative z-10 max-w-3xl w-full">
        {/* Golden glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-red-600 to-yellow-600 rounded-3xl blur-2xl opacity-50 animate-[pulse-glow_3s_ease-in-out_infinite]"></div>

        <div className="relative bg-gradient-to-br from-yellow-600/30 via-red-600/30 to-pink-600/30 backdrop-blur-xl rounded-3xl p-1 shadow-2xl">
          <div className="bg-gradient-to-br from-red-950/98 via-pink-950/98 to-yellow-950/98 rounded-3xl p-8 md:p-12 border-4 border-yellow-500/40 shadow-inner">
            {/* Top border decoration with enhanced royal elements */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-2 animate-[pulse-glow_2s_ease-in-out_infinite]" style={{ textShadow: '0 0 20px #fbbf24' }}>
                ॐ
              </div>
              <div className="flex justify-center gap-3 text-3xl">
                <span>🕉️</span>
                <span>✨</span>
                <span>🕉️</span>
              </div>
            </div>

            {/* Royal divider */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500 to-yellow-600 flex-1 rounded-full shadow-lg shadow-yellow-500/50"></div>
              <span className="text-5xl" style={{ textShadow: '0 0 15px #fbbf24' }}>💍</span>
              <div className="h-1 bg-gradient-to-r from-yellow-600 via-yellow-500 to-transparent flex-1 rounded-full shadow-lg shadow-yellow-500/50"></div>
            </div>

            {/* Receiver greeting with enhanced styling */}
            {data.receiverName && (
              <div className="text-center mb-8 bg-gradient-to-r from-transparent via-yellow-900/30 to-transparent py-4 rounded-xl">
                <p className="text-2xl md:text-3xl text-yellow-200 font-semibold italic" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)' }}>
                  Respected {data.receiverName},
                </p>
                <p className="text-yellow-300/80 text-sm mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                  We cordially invite you to grace the occasion
                </p>
              </div>
            )}

            {/* Wedding Title with royal styling */}
            <h1 className="text-center text-4xl md:text-5xl font-bold mb-8 text-yellow-300 tracking-wide" style={{
              fontFamily: 'Georgia, serif',
              textShadow: '0 0 30px rgba(251, 191, 36, 0.5), 0 4px 20px rgba(251, 191, 36, 0.3)'
            }}>
              {data.title}
            </h1>

            {/* Bride & Groom Names */}
            <div className="text-center mb-8">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-5xl mb-2">👰</div>
                  <p className="text-3xl font-bold text-pink-200">{data.bride}</p>
                </div>
                <div className="text-4xl text-yellow-500">💑</div>
                <div className="text-center">
                  <div className="text-5xl mb-2">🤵</div>
                  <p className="text-3xl font-bold text-blue-200">{data.groom}</p>
                </div>
              </div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 my-8">
              <span className="text-2xl">🌸</span>
              <span className="text-3xl">✨</span>
              <span className="text-2xl">🌸</span>
            </div>

            {/* Message with royal frame */}
            <div className="relative mb-8">
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 text-3xl text-yellow-500">◸</div>
              <div className="absolute -top-2 -right-2 text-3xl text-yellow-500">◹</div>
              <div className="absolute -bottom-2 -left-2 text-3xl text-yellow-500">◺</div>
              <div className="absolute -bottom-2 -right-2 text-3xl text-yellow-500">◿</div>

              <div className="bg-gradient-to-br from-yellow-900/50 to-red-900/50 rounded-2xl p-8 border-2 border-yellow-600/50 shadow-2xl shadow-yellow-500/20">
                <div className="text-center mb-4">
                  <span className="text-yellow-400 text-sm tracking-widest uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                    A Message from the Heart
                  </span>
                </div>
                <p className="text-yellow-100 text-lg md:text-xl text-center leading-relaxed italic" style={{ fontFamily: 'Georgia, serif', textShadow: '0 1px 5px rgba(0, 0, 0, 0.5)' }}>
                  "{data.message}"
                </p>
              </div>
            </div>

            {/* Event Details with Indian style */}
            <div className="space-y-6 mb-8 bg-gradient-to-br from-red-950/50 to-yellow-950/50 rounded-2xl p-8 border-2 border-yellow-600/40 shadow-2xl shadow-yellow-500/10">
              <div className="text-center border-b border-yellow-600/30 pb-6">
                <div className="text-5xl mb-3">📅</div>
                <p className="font-bold text-yellow-400 text-2xl mb-2" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)' }}>Date</p>
                <p className="text-pink-200 text-lg md:text-xl font-semibold">{new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {data.time && (
                <div className="text-center border-b border-yellow-600/30 pb-6">
                  <div className="text-5xl mb-3">⏰</div>
                  <p className="font-bold text-yellow-400 text-2xl mb-2" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)' }}>Time</p>
                  <p className="text-pink-200 text-lg md:text-xl font-semibold">{data.time}</p>
                </div>
              )}

              {data.venue && (
                <div className="text-center">
                  <div className="text-5xl mb-3">🏛️</div>
                  <p className="font-bold text-yellow-400 text-2xl mb-2" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)' }}>Venue</p>
                  <p className="text-pink-200 text-lg md:text-xl font-semibold">{data.venue}</p>
                </div>
              )}
            </div>

            {/* Google Maps for Wedding */}
            {data.mapLink && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent flex-1"></div>
                  <h3 className="text-center text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)' }}>
                    🗺️ Find Your Way
                  </h3>
                  <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent flex-1"></div>
                </div>
                <div className="rounded-2xl overflow-hidden border-4 border-yellow-500/50 shadow-2xl shadow-yellow-500/30">
                  <iframe
                    src={getEmbedMapUrl(data.mapLink)}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <a
                  href={data.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center mt-6 px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-red-950 font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-yellow-500/30"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  🧭 Open in Google Maps
                </a>
              </div>
            )}

            {/* Bottom decoration */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent flex-1"></div>
              <div className="flex gap-2 text-3xl">
                <span>🪔</span>
                <span>🌺</span>
                <span>🪔</span>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent flex-1"></div>
            </div>

            {/* RSVP note */}
            <p className="text-center text-yellow-200 text-lg italic" style={{ fontFamily: 'Georgia, serif' }}>
              Your presence will make our special day even more memorable
            </p>

            {/* Bottom border decoration */}
            <div className="text-center text-4xl mt-8">
              🙏
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: Props) {
  const resolvedParams = await params;
  await dbConnect();
  const doc = await InviteModel.findById(resolvedParams.id).lean();

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-3xl font-bold text-purple-300 mb-2">Invitation Not Found</h2>
          <p className="text-purple-200">This invitation link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // Render based on event type
  if (doc.eventType === 'Wedding') {
    return <WeddingInvitation data={doc} />;
  } else {
    return <BirthdayInvitation data={doc} />;
  }
}