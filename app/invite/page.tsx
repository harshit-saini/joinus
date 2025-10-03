// app/invite/page.tsx
'use client';
import React, { useState } from 'react';


export default function CreateInvite() {
  const [eventType, setEventType] = useState('Birthday');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [bride, setBride] = useState('');
  const [groom, setGroom] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLink('');


    const payload: any = {
      eventType,
      title,
      message,
      date,
    };
    if (eventType === 'Wedding') {
      payload.bride = bride;
      payload.groom = groom;
    }


    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create invite');
      const url = `${window.location.origin}/invite/${data.id}`;
      setLink(url);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div>
      <h2>Create Invite</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <label>
          Event Type
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option>Birthday</option>
            <option>Wedding</option>
            <option>Anniversary</option>
            <option>Other</option>
          </select>
        </label>


        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. John's 30th" />
        </label>


        <label>
          Message
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a friendly note" />
        </label>


        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>


        {eventType === 'Wedding' && (
          <>
            <label>
              Bride Name
              <input value={bride} onChange={(e) => setBride(e.target.value)} placeholder="Bride name" />
            </label>
            <label>
              Groom Name
              <input value={groom} onChange={(e) => setGroom(e.target.value)} placeholder="Groom name" />
            </label>
          </>
        )}


        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Invite'}</button>
      </form>


      {error && <p style={{ color: 'red' }}>{error}</p>}


      {link && (
        <div style={{ marginTop: 12 }}>
          <p>Invite created — copy & share this link:</p>
          <input readOnly value={link} style={{ width: '100%' }} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}