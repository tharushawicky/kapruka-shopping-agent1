import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Kapruka AI Shopping Concierge - MCP Shopping Agent",
  description: "A premium AI shopping assistant that helps users discover items, get shipping quotes, and checkout using Kapruka Model Context Protocol.",
  keywords: ["Kapruka", "MCP", "AI Shopping Agent", "Model Context Protocol", "Sri Lanka eCommerce"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-background text-foreground flex flex-col antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
