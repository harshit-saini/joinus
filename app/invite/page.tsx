'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EventType = 'Birthday' | 'Wedding';

interface InviteData {
  eventType: EventType;
  receiverName: string;
  title: string;
  message: string;
  date: string;
  time: string;
  venue: string;
  mapLink: string;
  bride?: string;
  groom?: string;
}

export default function CreateInvitePage() {
  const router = useRouter();
  const [eventType, setEventType] = useState<EventType>('Birthday');
  const [formData, setFormData] = useState<InviteData>({
    eventType: 'Birthday',
    receiverName: '',
    title: '',
    message: '',
    date: '',
    time: '',
    venue: '',
    mapLink: '',
    bride: '',
    groom: '',
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventTypeChange = (type: EventType) => {
    setEventType(type);
    setFormData((prev) => ({ ...prev, eventType: type }));
    setGeneratedLink('');
    setShowSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        const inviteUrl = `${window.location.origin}/invite/${data.id}`;
        setGeneratedLink(inviteUrl);
        setShowSuccess(true);

        // Save to local storage
        const savedInvites = JSON.parse(localStorage.getItem('myInvites') || '[]');
        savedInvites.push({
          id: data.id,
          ...formData,
          url: inviteUrl,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('myInvites', JSON.stringify(savedInvites));
      } else {
        alert('Error creating invite: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create invite');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copied to clipboard!');
  };

  const shareOnWhatsApp = () => {
    const message = `You're invited! Check out this invitation: ${generatedLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const createNewInvite = () => {
    setFormData({
      eventType,
      receiverName: '',
      title: '',
      message: '',
      date: '',
      time: '',
      venue: '',
      mapLink: '',
      bride: '',
      groom: '',
    });
    setGeneratedLink('');
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            Create Your Invitation
          </h1>
          <p className="text-purple-200 text-lg">
            Design beautiful invites for your special moments
          </p>
        </div>

        {/* Event Type Selector */}
        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => handleEventTypeChange('Birthday')}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              eventType === 'Birthday'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/50 scale-105'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            🎂 Birthday Party
          </button>
          <button
            onClick={() => handleEventTypeChange('Wedding')}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              eventType === 'Wedding'
                ? 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white shadow-lg shadow-pink-500/50 scale-105'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            💍 Wedding
          </button>
        </div>

        {/* Form */}
        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/30">
            <div className="space-y-6">
              {/* Receiver Name */}
              <div>
                <label className="block text-purple-200 font-semibold mb-2">
                  Receiver's Name
                </label>
                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleInputChange}
                  placeholder="Who is this invite for?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                  required
                />
              </div>

              {/* Wedding specific fields */}
              {eventType === 'Wedding' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-200 font-semibold mb-2">
                        Bride's Name
                      </label>
                      <input
                        type="text"
                        name="bride"
                        value={formData.bride}
                        onChange={handleInputChange}
                        placeholder="Bride's name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-purple-200 font-semibold mb-2">
                        Groom's Name
                      </label>
                      <input
                        type="text"
                        name="groom"
                        value={formData.groom}
                        onChange={handleInputChange}
                        placeholder="Groom's name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Title */}
              <div>
                <label className="block text-purple-200 font-semibold mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={eventType === 'Birthday' ? "e.g., Sarah's Sweet 16" : "e.g., Royal Wedding Celebration"}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-purple-200 font-semibold mb-2">
                  Invitation Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Write your invitation message..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all resize-none"
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 font-semibold mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-purple-200 font-semibold mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-purple-200 font-semibold mb-2">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="Event location"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                  required
                />
              </div>

              {/* Google Maps Link */}
              <div>
                <label className="block text-purple-200 font-semibold mb-2">
                  Google Maps Link (Optional)
                </label>
                <input
                  type="url"
                  name="mapLink"
                  value={formData.mapLink}
                  onChange={handleInputChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-300/30 text-white placeholder-purple-300/50 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 transition-all"
                />
                <p className="text-purple-400 text-xs mt-2">
                  Share a Google Maps link so guests can easily find the venue
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-xl py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Generate Invitation Link 🎉'}
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-purple-300/30 text-center">
            <div className="text-6xl mb-6">🎊</div>
            <h2 className="text-4xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text mb-4">
              Invitation Created!
            </h2>
            <p className="text-purple-200 mb-8">
              Your beautiful invitation is ready to share
            </p>

            {/* Generated Link */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-purple-300/30">
              <p className="text-purple-300 text-sm mb-2">Your Invitation Link:</p>
              <p className="text-white break-all font-mono text-sm">{generatedLink}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={copyToClipboard}
                className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                📋 Copy Link
              </button>
              <button
                onClick={shareOnWhatsApp}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                📱 Share on WhatsApp
              </button>
              <button
                onClick={() => router.push(generatedLink)}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
              >
                👁️ View Invite
              </button>
            </div>

            {/* Create Another */}
            <button
              onClick={createNewInvite}
              className="mt-8 text-purple-300 hover:text-pink-300 underline transition-colors"
            >
              Create Another Invitation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}