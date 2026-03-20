import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AudioProvider } from "@/components/AudioProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Liftly — Positive Reels for Positive Minds",
  description:
    "Invitation-only microlearning reels for books, gym, diet, and mindset. Build streaks, track your impact, grow with a community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#050816" />
        {/* Polyfill crypto.randomUUID for Safari on HTTP (needed by Supabase Auth) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof crypto!=='undefined'&&typeof crypto.randomUUID!=='function'){crypto.randomUUID=function(){return'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,function(c){var n=parseInt(c,10);return(n^crypto.getRandomValues(new Uint8Array(1))[0]&15>>n/4).toString(16);});};}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <AuthProvider>
          <AudioProvider>{children}</AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
