import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import "./globals.css";
import AdminLayout from "@/components/layout/AdminLayout";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RouteProvider } from "@/lib/route-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vivid",
  description: "Vivid - Content Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <RouteProvider>
            <AdminLayout>{children}</AdminLayout>
          </RouteProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
