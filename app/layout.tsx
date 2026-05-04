import type { Metadata } from "next";
import Script from "next/script";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Quickola",
  description: "Know the fair price before you book.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5953875387948501"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}