import type { Metadata } from "next";
import { Sora, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/app/components/NavBar";
import Footer from "@/app/components/Footer";
import { AuthProvider } from '@/app/components/AuthProvider'
import { Analytics } from '@vercel/analytics/next'
import "./globals.css";

const sora = Sora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FM Tracker",
  keywords: [
    "Football Manager",
    "FM Tracker",
    "Football Manager Tracker",
    "FM Legacy",
    "Football Manager Legacy",
    "FM Stats",
    "Football Manager Stats",
    "FM Achievements",
    "Football Manager Achievements",
    "FM Challenges",
    "Football Manager Challenges",
  ],
  authors: [{ name: "Diego Rojo" }],
  creator: "Diego Rojo",
  description: "Track your Football Manager legacy with FM Tracker. Log saves, earn achievements, complete challenges, and build your career history.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FM Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "FM Tracker",
    title: "FM Tracker",
    description: "Track your Football Manager legacy with FM Tracker. Log saves, earn achievements, complete challenges, and build your career history.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FM Tracker",
    description: "Track your Football Manager legacy with FM Tracker. Log saves, earn achievements, complete challenges, and build your career history.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0f1e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FM Tracker" />
        <link rel="apple-touch-icon" href="/logos/icon-192x192.png" />
        <meta name="msapplication-TileImage" content="/logos/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#0a0f1e" />
      </head>
      <body
        className={`${sora.variable} ${ibmPlexMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <Navbar />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
