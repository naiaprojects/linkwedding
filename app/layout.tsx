// app/layout.tsx
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000000";

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
  };
}

// === LAYOUT UTAMA ===
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("favicon_url, meta_verification")
    .eq("id", SETTINGS_ID)
    .single();

  const faviconUrl = data?.favicon_url || "/favicon.ico";
  const verifications =
    (data?.meta_verification as Record<string, string>) || {};

  return (
    <html lang="id">
      <head>
        <link rel="icon" href={faviconUrl} />
        {Object.entries(verifications).map(([name, content]) => (
          <meta key={name} name={name} content={content} />
        ))}
      </head>
      <body className="bg-slate-100 bg-fixed bg-center bg-no-repeat bg-cover bg-[url('https://kacfrxzjryuxnrhbkifu.supabase.co/storage/v1/object/public/public/hero-images/Bg.jpg')] min-h-screen">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
