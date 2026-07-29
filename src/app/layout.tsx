import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miguel Humberto, AI Creative Producer",
  description:
    "Gen AI creative workflows from concept to delivery. Portfolio of Miguel Humberto.",
};

const modeBootstrap = `
(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var mode = params.get("mode");
    if (mode !== "ai" && mode !== "craft") {
      mode = localStorage.getItem("portfolio-mode");
    }
    if (mode !== "ai" && mode !== "craft") mode = "ai";
    var theme = mode === "craft" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.dataset.mode = mode;
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
        <script dangerouslySetInnerHTML={{ __html: modeBootstrap }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
