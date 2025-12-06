"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type Link = Database["public"]["Tables"]["links"]["Row"];

export default function Header() {
  const supabase = createClient();

  const [navLinks, setNavLinks] = useState<Link[]>([]);
  const [socialLinks, setSocialLinks] = useState<Link[]>([]);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("LinkWedding");

  useEffect(() => {
    const fetchLinks = async () => {
      const { data: navData } = await supabase
        .from("links")
        .select("*")
        .eq("type", "nav")
        .eq("is_active", true)
        .order("sort_order");

      const { data: socialData } = await supabase
        .from("links")
        .select("*")
        .eq("type", "social")
        .eq("is_active", true)
        .order("sort_order");

      setNavLinks(navData || []);
      setSocialLinks(socialData || []);
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white tracking-wide relative z-50">
      <section className="bg-primary flex items-center lg:justify-center flex-wrap gap-5 relative py-3 sm:px-10 px-4 border-b border-gray-300 lg:min-h-[75px] max-lg:min-h-[60px]">
        <Link href="/">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName}
              className="md:w-[200px] w-[134px] brightness-0 invert opacity-90"
            />
          ) : (
            <img
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhusBeFoOK7V-yTmNC7VLQouEDjz5gv9kMaHqJ-v_B29d4k4jHkT1X0bEEVOTktYSGPDtEK3JUS03MTzxzfA3m4e_smm48HdoODmACRVfGziPlssQAU4lQYmsy073t_OkU0QJR-Hf3FfBVtvsyiwmstQqkcNvarY9PKrf4ZzTHPVRd00wZsaqNwKEMB1sSD/s320/Logo-01.webp"
              alt={siteName}
              className="md:w-[200px] w-[134px]"
            />
          )}
        </Link>

        <div className="space-x-4 md:absolute md:right-10 flex items-center max-md:ml-auto">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-md text-white hover:text-secondary transition-all"
              aria-label={link.title}
            >
              {link.svg && (
                <span
                  className="w-5 h-5"
                  dangerouslySetInnerHTML={{ __html: link.svg }}
                />
              )}
            </a>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap py-3.5 px-10 overflow-x-auto">
        <div
          id="collapseMenu"
          className={`w-full ${isMenuOpen ? "" : "max-lg:hidden"
            } lg:!block max-lg:before:fixed max-lg:before:bg-black max-lg:before:opacity-50 max-lg:before:inset-0 max-lg:before:z-50`}
        >
          <button
            id="toggleClose"
            className="lg:hidden fixed top-2 right-4 z-[100] rounded-full bg-white w-9 h-9 flex items-center justify-center border border-gray-200 cursor-pointer"
            onClick={toggleMenu}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5 fill-primary text-primary"
              viewBox="0 0 320.591 320.591"
            >
              <path
                d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z"
              ></path>
              <path
                d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z"
              ></path>
            </svg>
          </button>

          <ul className="lg:flex lg:justify-center lg:gap-x-10 max-lg:space-y-3 max-lg:fixed max-lg:bg-white max-lg:w-1/2 max-lg:min-w-[300px] max-lg:top-0 max-lg:left-0 max-lg:p-6 max-lg:h-full max-lg:shadow-md max-lg:overflow-auto z-50">
            <li className="mb-6 hidden max-lg:block">
              <Link href="/">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="w-36" />
                ) : (
                  <img
                    src="https://readymadeui.com/readymadeui.svg"
                    alt={siteName}
                    className="w-36"
                  />
                )}
              </Link>
            </li>
            {navLinks.map((link) => (
              <li className="max-lg:border-b max-lg:border-gray-300 max-lg:py-3">
                <Link
                  key={link.id}
                  href={link.url}
                  className="hover:text-primary text-primary/80 font-medium text-[15px] block"
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex ml-auto lg:hidden">
          <button
            id="toggleOpen"
            className="cursor-pointer"
            onClick={toggleMenu}
          >
            <svg
              className="w-7 h-7 text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
