"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 800));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-8 py-16 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4 h-10 w-10 text-stone-400"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="font-serif text-lg text-stone-700">Message sent.</p>
        <p className="mt-1 text-sm text-stone-400">
          I&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-xs tracking-widest text-stone-400 uppercase hover:text-stone-600 transition-colors"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-widest text-stone-400 uppercase">
            Name
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Your name"
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-300 focus:border-stone-400 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs tracking-widest text-stone-400 uppercase">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-300 focus:border-stone-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs tracking-widest text-stone-400 uppercase">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="What would you like to say?"
          className="resize-none rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-300 focus:border-stone-400 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start rounded-full bg-stone-900 px-8 py-3 text-xs font-medium tracking-widest text-white uppercase transition-colors hover:bg-stone-700 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
