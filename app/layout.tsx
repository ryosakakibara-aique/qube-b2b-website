import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  /*
    Two favicon files, chosen by the browser's colour scheme. The `app/favicon.ico` file convention
    cannot express this — it emits one icon with no media query — so the pair is declared here, and
    `/favicon.ico` is served from `public/` instead for clients that request that path directly.
    Neither entry carries a `media`-less duplicate: an icon with no media query matches every scheme,
    so adding one would make the winner depend on which icon the engine prefers rather than on the
    visitor's theme.
  */
  icons: {
    icon: [
      {
        url: "/qube-light-favicon.png",
        type: "image/png",
        sizes: "48x48",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/qube-dark-favicon.png",
        type: "image/png",
        sizes: "48x48",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full">
        {/*
          Reveal-on-scroll ships its hidden state in the markup so the element can animate in. That
          would leave the page's lower sections permanently invisible with JavaScript switched off,
          so this restores them. `!important` is needed because the hidden state is an inline style.
        */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>[data-reveal]{opacity:1!important;transform:none!important}</style>",
          }}
        />
        {children}
      </body>
    </html>
  );
}
