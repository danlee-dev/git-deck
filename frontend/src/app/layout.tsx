import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevDeck",
  description: "The AI-Powered Developer Branding Platform",
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
