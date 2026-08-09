import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import { HERITAGE_SPLINE_SCENE_URL } from "@/lib/splineScenes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miguel Humberto, AI Creative Designer",
  description:
    "I design distinctive digital experiences, connecting art and technology. Portfolio of Miguel Humberto.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Miguel Humberto",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

/** Edge-to-edge on notched phones so ambient/WebGL can paint under the status area. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e11" },
    { color: "#0d0e11" },
  ],
};

const modeBootstrap = `
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var mode = params.get("mode");
    // Bare URL always opens AI. Craft is URL-only while that track is unfinished.
    if (mode !== "ai" && mode !== "craft") mode = "ai";
    var theme = mode === "craft" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.dataset.mode = mode;

    var color = theme === "light" ? "#f5f5f7" : "#0d0e11";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);

    var statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusBar) {
      statusBar = document.createElement("meta");
      statusBar.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(statusBar);
    }
    statusBar.setAttribute("content", "black-translucent");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href={HERITAGE_SPLINE_SCENE_URL}
          as="fetch"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: modeBootstrap }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
