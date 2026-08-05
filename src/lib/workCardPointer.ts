/**
 * Cursor + hover affordance for the Work carousel.
 *
 * Cards are laid out at full size and then pushed back with a 3D transform, so a
 * card's layout box stays much taller and wider than the card that actually gets
 * painted. Chromium also stops hit-testing at the 3D root, so every point inside
 * that box resolves to the article — meaning CSS `:hover` and the cursor cover
 * empty space above and beside the visible card. Tracking the pointer against
 * the painted bounds instead keeps `grab` on carousel chrome and `pointer` on
 * cards only.
 */

const OVER_CARD_CLASS = "is-over-card";
const HOVERED_CLASS = "is-hovered";

function frontMost(a: HTMLElement, b: HTMLElement) {
  const za = Number.parseInt(a.style.zIndex || "0", 10) || 0;
  const zb = Number.parseInt(b.style.zIndex || "0", 10) || 0;
  return zb > za ? b : a;
}

export function attachWorkCardPointer(container: HTMLElement) {
  if (typeof window === "undefined") return () => {};
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return () => {};
  }

  let raf = 0;
  let pointerX = -1;
  let pointerY = -1;
  let hovered: HTMLElement | null = null;

  const setHovered = (card: HTMLElement | null) => {
    if (hovered === card) return;
    hovered?.classList.remove(HOVERED_CLASS);
    hovered = card;
    hovered?.classList.add(HOVERED_CLASS);
    container.classList.toggle(OVER_CARD_CLASS, card !== null);
  };

  const resolve = () => {
    raf = 0;
    if (pointerX < 0) return;

    let match: HTMLElement | null = null;
    container.querySelectorAll<HTMLElement>(".work-card-focus").forEach((card) => {
      const body = card.querySelector<HTMLElement>(".work-card-body");
      if (!body) return;

      const rect = body.getBoundingClientRect();
      if (rect.width < 40) return;
      if (
        pointerX < rect.left ||
        pointerX > rect.right ||
        pointerY < rect.top ||
        pointerY > rect.bottom
      ) {
        return;
      }

      match = match ? frontMost(match, card) : card;
    });

    setHovered(match);
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(resolve);
  };

  const onPointerMove = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    schedule();
  };

  const onPointerLeave = () => {
    pointerX = -1;
    pointerY = -1;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    setHovered(null);
  };

  // Cards travel under a stationary cursor while the strip scrolls.
  const onScroll = () => schedule();

  container.addEventListener("pointermove", onPointerMove, { passive: true });
  container.addEventListener("pointerleave", onPointerLeave);
  container.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    if (raf) cancelAnimationFrame(raf);
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerleave", onPointerLeave);
    container.removeEventListener("scroll", onScroll);
    container.classList.remove(OVER_CARD_CLASS);
    hovered?.classList.remove(HOVERED_CLASS);
    hovered = null;
  };
}
