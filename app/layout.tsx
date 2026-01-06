import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ATProto Browser",
    template: "%s | ATProto Browser",
  },
  description: "Browse ATProto repositories and generate OG previews",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/logo.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />
        <main className="relative">
          {children}
        </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-border/50 py-6">
        <div className="max-w-2xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy policy
          </Link>
          <a
            href="https://github.com/owen-lacey/atproto-heatmap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Source code
          </a>
        </div>
      </footer>
      </body>
    </html>
  );
}
