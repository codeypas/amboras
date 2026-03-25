import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amboras Analytics Dashboard",
  description: "Multi-tenant store analytics dashboard demo built for Amboras."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
