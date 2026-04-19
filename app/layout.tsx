import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pdinventory.vercel.app"),
  title: {
    default: "VoltHub — Genuine electronics with islandwide delivery",
    template: "%s · VoltHub",
  },
  description:
    "Shop genuine JBL, Sony, Philips, Anker, Xiaomi and more. Islandwide delivery across Sri Lanka, cash on delivery, 12-month manufacturer warranty.",
  keywords: [
    "electronics Sri Lanka",
    "JBL Sri Lanka",
    "Sony headphones",
    "LED lights",
    "solar lights",
    "islandwide delivery",
    "cash on delivery",
  ],
  openGraph: {
    type: "website",
    siteName: "VoltHub",
    locale: "en_LK",
    title: "VoltHub — Genuine electronics",
    description: "Genuine electronics. Islandwide delivery. COD available.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
