import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4, Bitter } from "next/font/google";
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

const sourceSerif4 = Source_Serif_4({
  variable: "--font-lexend",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
});

const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} ${bitter.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var f=localStorage.getItem('readingFont');if(f==='bitter'||f==='tiempo'||f==='bookerly'||f==='source')document.body.dataset.readingFont=f;else document.body.dataset.readingFont='bitter';var s=localStorage.getItem('readingFontSize');var n=s?parseInt(s,10):20;if(!isNaN(n)&&n>=14&&n<=28)document.body.style.setProperty('--reading-font-size',n+'px');else document.body.style.setProperty('--reading-font-size','20px');}())`,
          }}
        />
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
