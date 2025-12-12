// app/layout.tsx
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";
import { createClient } from "@/lib/supabase/server";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000000";

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

// === DINAMIS METADATA ===
export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("site_name, meta_title, meta_description, meta_keywords")
    .eq("id", SETTINGS_ID)
    .single();


  return {
    title: data?.meta_title || data?.site_name || "LinkWedding",
    description:
      data?.meta_description || "Platform undangan pernikahan digital",
    keywords: data?.meta_keywords?.join(", ") || undefined,
    manifest: "/manifest.json",
  };
}


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("favicon_url, meta_verification, meta_pixel_id")
    .eq("id", SETTINGS_ID)
    .single();

  const faviconUrl = data?.favicon_url || "/favicon.ico";
  const verifications =
    (data?.meta_verification as Record<string, string>) || {};
  const metaPixelId = data?.meta_pixel_id || null;

  return (
    <html lang="id">
      <head>
        <link rel="icon" href={faviconUrl} />
        {Object.entries(verifications).map(([name, content]) => (
          <meta key={name} name={name} content={content} />
        ))}
      </head>
      <body className="bg-slate-100 bg-fixed bg-center bg-no-repeat bg-cover bg-[url('https://kacfrxzjryuxnrhbkifu.supabase.co/storage/v1/object/public/public/hero-images/Bg.jpg')] min-h-screen">
        {/* Meta Pixel Code - Only render if Pixel ID is configured */}
        {metaPixelId && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${metaPixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        {/* End Meta Pixel Code */}
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
