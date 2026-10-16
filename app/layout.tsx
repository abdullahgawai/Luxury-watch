import type { Metadata } from "next";
import "./globals.css";
import "./photos.css";
import "./search.css";
import "./history.css";
import {env} from 'cloudflare:workers';

export async function generateMetadata():Promise<Metadata>{return {
  title: `${env.SITE_NAME||'Luxury Watch Explorer'} | India & UAE`,
  metadataBase:new URL(env.SITE_ORIGIN||'https://luxury-watch-explorer-india-uae.spicyrat3.chatgpt.site'),
  alternates:{canonical:'/'},
  description: "An independent guide to exact watch references and carefully sourced market information.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};}

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
