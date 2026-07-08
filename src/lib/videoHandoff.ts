export function syncVideoPlayback(
  video: HTMLVideoElement,
  time: number,
  { autoplay = true }: { autoplay?: boolean } = {},
) {
  const start = () => {
    if (time > 0 && Number.isFinite(time)) {
      try {
        video.currentTime = time;
      } catch {
        // Ignore seek errors while metadata is still loading.
      }
    }
    if (autoplay) {
      void video.play().catch(() => {});
    }
  };

  if (video.readyState >= 1) {
    start();
    return;
  }

  video.addEventListener("loadedmetadata", start, { once: true });
}
