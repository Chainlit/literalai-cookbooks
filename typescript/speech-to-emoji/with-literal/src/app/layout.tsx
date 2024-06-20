import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Speech to Emoji 🗣️➡️🎨",
  description: "Convert your speech to emojis !",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="literal.svg" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
