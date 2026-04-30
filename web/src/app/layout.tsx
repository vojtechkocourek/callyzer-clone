import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Callyzer Clone",
  description: "Call analytics & team monitoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
