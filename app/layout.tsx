import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.quickola.co.uk"),
  title: {
    default: "Quickola | Check Fair Cleaning Prices Before You Book",
    template: "%s",
  },
  description:
    "Check fair cleaning prices before you book. See local price ranges for regular, deep and end of tenancy cleaning, then request a cleaner only if useful.",
  applicationName: "Quickola",
  authors: [{ name: "Quickola" }],
  creator: "Quickola",
  publisher: "Quickola",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    url: "https://www.quickola.co.uk",
    siteName: "Quickola",
    title: "Quickola | Check Fair Cleaning Prices Before You Book",
    description:
      "Check fair cleaning prices before you book. See local ranges and request a cleaner only if useful.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Quickola cleaning price guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quickola | Check Fair Cleaning Prices Before You Book",
    description:
      "Check fair cleaning prices before you book. See local ranges and request a cleaner only if useful.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5953875387948501"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}