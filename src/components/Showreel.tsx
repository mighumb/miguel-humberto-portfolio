"use client";

import { useState } from "react";

const SHOWREEL_ID = "NnuX3o_F5vg";

/** Chrome-reducing params; controls stay on after the facade click. */
const SHOWREEL_EMBED_SRC =
  `https://www.youtube.com/embed/${SHOWREEL_ID}` +
  "?autoplay=1&controls=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1";

const SHOWREEL_POSTER = `https://i.ytimg.com/vi/${SHOWREEL_ID}/maxresdefault.jpg`;

/** Media-only showreel — custom facade so YouTube UI is hidden until play. */
export default function Showreel() {
  const [playing, setPlaying] = useState(false);

  return (
    <section
      className="showreel-section relative z-[2] bg-bg-primary"
      aria-label="Showreel"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:max-w-4xl md:px-10 md:py-12">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-bg-secondary">
          {playing ? (
            <iframe
              src={SHOWREEL_EMBED_SRC}
              title="Showreel"
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 cursor-pointer"
              aria-label="Play showreel"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHOWREEL_POSTER}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span
                className="absolute inset-0 bg-bg-primary/25 transition-colors group-hover:bg-bg-primary/15"
                aria-hidden
              />
              <span
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bg-primary/70 text-text-primary backdrop-blur-sm transition-transform group-hover:scale-105 md:h-16 md:w-16"
                aria-hidden
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-0.5"
                >
                  <path d="M8 5.14v13.72L19 12 8 5.14z" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
