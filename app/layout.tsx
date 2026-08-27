import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.quickola.co.uk"),
  title: {
    default: "Quickola | Get Home Jobs Done at a Fair Price",
    template: "%s",
  },
  description:
    "Need something done at home? Tell Quickola what you need once. Local providers send you their prices, so you can compare and choose without ringing around.",
  applicationName: "Quickola",
  authors: [{ name: "Quickola" }],
  creator: "Quickola",
  publisher: "Quickola",
  icons: {
    icon: [
      { url: "/quickola/logo-mark.png", type: "image/png", sizes: "32x32" },
      { url: "/quickola/logo-mark.png", type: "image/png" },
    ],
    shortcut: "/quickola/logo-mark.png",
    apple: {
      url: "/quickola/logo-mark.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  openGraph: {
    type: "website",
    url: "https://www.quickola.co.uk",
    siteName: "Quickola",
    title: "Quickola | Get Home Jobs Done at a Fair Price",
    description:
      "Need something done at home? Tell Quickola what you need once. Local providers send you their prices, so you can compare and choose without ringing around.",
    images: [
      {
        url: "/quickola/logo-mark.png",
        width: 1200,
        height: 630,
        alt: "Quickola",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quickola | Get Home Jobs Done at a Fair Price",
    description:
      "Need something done at home? Tell Quickola what you need once. Local providers send you their prices, so you can compare and choose without ringing around.",
    images: ["/quickola/logo-mark.png"],
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={nunito.variable}
    >
      <head>
        <link
          rel="icon"
          href="/quickola/logo-mark.png"
          type="image/png"
          sizes="32x32"
        />
        <link rel="shortcut icon" href="/quickola/logo-mark.png" />
        <link
          rel="apple-touch-icon"
          href="/quickola/apple-touch-icon.png"
          sizes="180x180"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
