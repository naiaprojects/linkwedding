"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type Link = Database["public"]["Tables"]["links"]["Row"];

const Footer = () => {
  const supabase = createClient();

  const [footerLinks, setFooterLinks] = useState<Link[]>([]);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("LinkWedding");

  useEffect(() => {
    const fetchLinks = async () => {
      const { data } = await supabase
        .from("links")
        .select("*")
        .eq("type", "footer")
        .eq("is_active", true)
        .order("sort_order");

      setFooterLinks(data || []);
    };

    fetchLinks();
  }, [supabase]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("logo_url, site_name")
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error loading settings:", error);
          return;
        }

        if (data) {
          if (data.logo_url) setLogoUrl(data.logo_url);
          if (data.site_name) setSiteName(data.site_name);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    loadSettings();
  }, [supabase]);

  return (
    <footer className="bg-white">
      <div className="flex flex-col mx-3 bg-white rounded-lg">
        <div className="w-full">
          <div className="container flex flex-col mx-auto">
            <div className="flex flex-col items-center w-full my-20">
              <span className="mb-8">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto" />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                )}
              </span>

              <div className="flex flex-col items-center gap-6 mb-8">
                <div className="flex flex-wrap items-center justify-center gap-5 lg:gap-12 gap-y-3 lg:flex-nowrap text-dark-slate-900">
                  {footerLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.url}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <p className="text-base font-normal leading-7 text-center text-slate-700">
                  {new Date().getFullYear()} {siteName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 my-5">
          <div className="w-full max-w-full sm:w-3/4 mx-auto text-center">
            <p className="text-sm text-slate-500 py-1 flex gap-1 justify-center">
              <span>Developed & Designed by</span>
              <a
                href="https://www.naia.web.id"
                className="text-slate-700 hover:text-slate-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                Naia.Web.id
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
