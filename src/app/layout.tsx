import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "dbt Metric Explorer",
  description: "Explore dbt semantic metrics and their upstream lineage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
