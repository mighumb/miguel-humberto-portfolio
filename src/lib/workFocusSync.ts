type FocusPass = () => void;

const passes = new WeakMap<HTMLElement, FocusPass>();

/**
 * The carousel's perspective pass normally runs one frame behind the scroll,
 * which is invisible while scrolling continuously. Loop wraps move the scroll by
 * a whole cycle at once, so that same frame of lateness shows every visible card
 * with the styling of the position it used to hold. Programmatic wraps register
 * here and re-run the pass in the same frame they move the scroll.
 */
export function registerWorkFocusPass(container: HTMLElement, pass: FocusPass) {
  passes.set(container, pass);
  return () => {
    if (passes.get(container) === pass) passes.delete(container);
  };
}

export function runWorkFocusPass(container: HTMLElement) {
  passes.get(container)?.();
}
