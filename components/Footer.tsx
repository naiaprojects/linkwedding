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
    <footer>
      <div className="flex flex-col mx-3 bg-white rounded-lg">
        <div className="w-full">
          <div className="container flex flex-col mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center w-full my-12 lg:my-20">
              <span className="mb-8">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 sm:h-12 w-auto" />
                ) : (
                  <div className="h-10 sm:h-12 w-10 sm:w-12 bg-gray-200 rounded"></div>
                )}
              </span>

              <div className="flex flex-col items-center gap-6 mb-8 w-full">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-12 text-sm sm:text-base text-dark-slate-900">
                  {footerLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.url}
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center text-center">
                <p className="text-sm sm:text-base font-normal leading-7 text-slate-700">
                  {new Date().getFullYear()} {siteName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3 my-5">
          <div className="w-full max-w-full sm:w-3/4 mx-auto text-center px-4">
            <p className="text-xs sm:text-sm text-slate-500 py-1 flex flex-wrap gap-1 justify-center items-center">
              <span>Developed & Designed by</span>
              <a
                href="https://www.naia.web.id"
                className="text-slate-700 hover:text-slate-900 font-medium"
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
