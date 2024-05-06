import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simple Chatbot",
  description: "OpenAI Chatbot with Literal AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
