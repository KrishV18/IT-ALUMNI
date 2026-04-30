import type { Metadata } from "next";
import { Inter, Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "IT Connect — Student Alumni Network",
  description:
    "Discover and connect with IT department students and alumni. Browse profiles by specialization, explore skills, and network on LinkedIn and GitHub.",
  keywords: ["IT Connect", "student directory", "alumni network", "AIML", "FSD"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${caveat.variable}`}>
      <body className="font-sans bg-background text-foreground antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
