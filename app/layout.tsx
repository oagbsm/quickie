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
    default: "Quickola | Managed cleaning for properties and businesses",
    template: "%s",
  },
  description:
    "Managed cleaning for property professionals, accommodation operators, offices and businesses in the Slough area.",
  applicationName: "Quickola",
  authors: [{ name: "Quickola" }],
  creator: "Quickola",
  publisher: "Quickola",
  icons: {
    icon: [
      { url: "/quickola/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/quickola/logo-mark.png", type: "image/png" },
    ],
    shortcut: "/quickola/favicon.png",
    apple: {
      url: "/quickola/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  openGraph: {
    type: "website",
    url: "https://www.quickola.co.uk",
    siteName: "Quickola",
    title: "Quickola | Managed cleaning for properties and businesses",
    description:
      "Organise and track managed cleaning for properties, portfolios and business premises in the Slough area.",
    images: [
      {
        url: "/quickola/logo-mark.png",
        width: 1200,
        height: 630,
        alt: "Quickola Property Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quickola | Managed cleaning for properties and businesses",
    description:
      "Managed cleaning for property professionals and businesses in the Slough area.",
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
          href="/quickola/favicon.png"
          type="image/png"
          sizes="32x32"
        />
        <link rel="shortcut icon" href="/quickola/favicon.png" />
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
