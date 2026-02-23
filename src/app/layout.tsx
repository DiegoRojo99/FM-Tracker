import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/NavBar";
import Footer from "@/app/components/Footer";
import { AuthProvider } from '@/app/components/AuthProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    statusBarStyle: "default",
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
        <meta name="theme-color" content="#270f3f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FM Tracker" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#270f3f" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >        
        <AuthProvider>
          {/* Navbar should always be at the top */}
          <Navbar />
          {/* Main content should take up the remaining space */}
          <div className="flex-grow">
            {children}
          </div>
          {/* Footer should always be at the bottom */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
