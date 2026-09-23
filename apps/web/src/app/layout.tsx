import type { Metadata } from "next";
import { Hanken_Grotesk, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono-label",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Titan Kinetic",
  description:
    "Des compétences qui ouvrent de nouvelles perspectives. Découvrez vos formations, échangez avec vos formateurs et avancez à votre rythme.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${hankenGrotesk.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
