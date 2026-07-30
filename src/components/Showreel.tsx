const SHOWREEL_EMBED_SRC =
  "https://www.youtube.com/embed/NnuX3o_F5vg?si=vo-9tLnK7TxL9HvJ&controls=0";

/** Media-only showreel between Who I am and Contact — no section title. */
export default function Showreel() {
  return (
    <section
      className="showreel-section relative z-[2] bg-bg-primary"
      aria-label="Showreel"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:max-w-4xl md:px-10 md:py-12">
        <div className="aspect-video overflow-hidden rounded-lg bg-bg-secondary">
          <iframe
            src={SHOWREEL_EMBED_SRC}
            title="Showreel"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
