import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
      </body>
    </html>
  );
}
