import Link from "next/link";
import { useEffect, useState } from "react";

const workflow = [
  {
    label: "Design",
    title: "Virtual and uploaded cards",
    copy: "Create a polished digital card, attach the real printed card, or publish both in one invite.",
  },
  {
    label: "Send",
    title: "Guest-wise sharing",
    copy: "Prepare WhatsApp, email, or SMS links for every guest with their own personalized invite URL.",
  },
  {
    label: "Track",
    title: "Delivery and opens",
    copy: "Keep a local delivery board and record invite opens from guest links when MongoDB is connected.",
  },
];

const events = [
  "Wedding",
  "Birthday",
  "Housewarming",
  "Anniversary",
  "Baby Shower",
  "Graduation",
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen">
      <section className="border-b border-stone-300 bg-[#fffaf2]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
              JoinUs
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-950 md:text-3xl">
              Invitation studio and delivery desk
            </h1>
          </div>
          <Link
            href="/invite"
            className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900"
          >
            Create invite
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-coral-700">
            For every celebration
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-stone-950 md:text-6xl">
            Create personal invites, attach memories, and know who has seen
            them.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
            Build wedding, birthday, family, and milestone invitations with a
            real-card upload, a virtual card, photo and video moments, guest
            sharing, and invite tracking.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/invite"
              className="rounded-md bg-teal-800 px-5 py-3 text-center font-semibold text-white transition hover:bg-teal-900"
            >
              Open builder
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-stone-400 px-5 py-3 text-center font-semibold text-stone-900 transition hover:border-teal-700 hover:text-teal-900"
            >
              My dashboard
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {events.map((event) => (
              <span
                key={event}
                className="rounded-md border border-stone-300 bg-white/60 px-3 py-2 text-sm font-medium text-stone-700"
              >
                {event}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-lg border border-stone-300 bg-[#fffaf2] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                  Live invite
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-stone-950">
                  Aarav and Mira
                </h3>
              </div>
              <span className="rounded-md bg-coral-100 px-3 py-1 text-sm font-semibold text-coral-800">
                Wedding
              </span>
            </div>

            <div className="mt-5 rounded-lg border border-stone-300 bg-white p-5">
              <p className="text-sm uppercase tracking-wide text-stone-500">
                Together with their families
              </p>
              <p className="mt-5 text-4xl font-semibold text-stone-950">
                Aarav & Mira
              </p>
              <p className="mt-4 leading-7 text-stone-700">
                Request the pleasure of your company for dinner, music, and
                blessings.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-teal-50 p-3">
                  <p className="font-semibold text-teal-900">Date</p>
                  <p className="mt-1 text-stone-700">Saturday, Nov 21</p>
                </div>
                <div className="rounded-md bg-amber-50 p-3">
                  <p className="font-semibold text-amber-900">Venue</p>
                  <p className="mt-1 text-stone-700">Rose Hall</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-stone-200 bg-white px-3 py-4">
                <p className="text-2xl font-semibold text-stone-950">48</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                  Guests
                </p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-3 py-4">
                <p className="text-2xl font-semibold text-teal-800">39</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                  Sent
                </p>
              </div>
              <div className="rounded-md border border-stone-200 bg-white px-3 py-4">
                <p className="text-2xl font-semibold text-coral-700">26</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                  Opened
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-300 bg-white/55">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3">
          {workflow.map((item) => (
            <article
              key={item.label}
              className="rounded-lg border border-stone-300 bg-[#fffaf2] p-5"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-plum-800">
                {item.label}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-stone-950">
                {item.title}
              </h3>
              <p className="mt-3 leading-7 text-stone-700">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
