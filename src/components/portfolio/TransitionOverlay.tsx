"use client";

interface TransitionOverlayProps {
  active: boolean;
  tint: "ai" | "product";
}

export default function TransitionOverlay({ active, tint }: TransitionOverlayProps) {
  return (
    <div
      className={`portfolio-transition-overlay pointer-events-none fixed inset-0 z-[50] ${
        active ? "is-active" : ""
      } is-${tint}`}
      aria-hidden
    >
      <div className="portfolio-transition-layer portfolio-transition-r" />
      <div className="portfolio-transition-layer portfolio-transition-g" />
      <div className="portfolio-transition-layer portfolio-transition-b" />
      <div className="portfolio-transition-blur" />
    </div>
  );
}
