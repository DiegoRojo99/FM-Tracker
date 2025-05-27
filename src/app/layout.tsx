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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
