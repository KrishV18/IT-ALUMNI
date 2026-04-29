import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 72px)" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
