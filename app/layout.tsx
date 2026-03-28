import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AudioProvider } from "@/components/AudioProvider";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#080f1e" },
  ],
};

export const metadata: Metadata = {
  title: "Liftly — Stop Scrolling. Start Proving.",
  description:
    "The app where watching isn't enough. See a reel, do the thing, snap your proof. Build streaks, earn your feed, prove you took action.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Liftly",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
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
          <AudioProvider>
            <AppUpdateBanner />
            {children}
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
