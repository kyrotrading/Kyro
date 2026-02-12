import type { Metadata } from "next";
import "./globals.css";
import { SidebarNav } from "@/components/SidebarNav";

export const metadata: Metadata = {
  title: "Trading Platform",
  description: "Real-time stock quotes via Polygon.io",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-surface text-white">
        <div className="flex min-h-screen">
          <SidebarNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
