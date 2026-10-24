import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.SITE_URL ?? "http://localhost:3233";

const HEAD_SCRIPT = [
  "var d=document.documentElement;d.classList.add('js');",
  "try{var m=function(q){return window.matchMedia(q).matches};",
  "if(window.WebGL2RenderingContext&&!m('(prefers-reduced-motion: reduce)')&&(m('(min-width: 768px) and (min-height: 520px)')||m('(min-height: 700px)'))",
  "&&!(navigator.connection&&navigator.connection.saveData)){d.classList.add('immersive');window.__d4dxImmersive=1}}catch(e){}",
  // If the app's scripts never arrive, show everything plainly instead of leaving parts hidden.
  "setTimeout(function(){if(!d.classList.contains('hydrated')){d.classList.remove('immersive');d.classList.add('no-hydrate')}},20000);",
].join("");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "D4DX Innovations · Apps, websites, ERP and SaaS from Calicut",
    template: "%s · D4DX Innovations",
  },
  description:
    "D4DX Innovations LLP builds mobile apps, websites, ERP and SaaS from a studio on Mavoor Road, Calicut (Kozhikode), Kerala.",
  applicationName: "D4DX Innovations",
  openGraph: {
    type: "website",
    siteName: "D4DX Innovations",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geist.variable}`} suppressHydrationWarning>
      <head>
        {/* Hidden-until-revealed states only apply when scripts run, so content never depends on JS.
            `immersive` turns the home hero into its 3D flight before first paint, so nothing shifts. */}
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
