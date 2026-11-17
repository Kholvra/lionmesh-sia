import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lionmesh SIA - Sistem Informasi Bisnis",
  description: "Sistem Informasi Akuntansi dan Bisnis PT Lionmesh Prima Tbk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}