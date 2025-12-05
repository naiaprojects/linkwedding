"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bars3BottomLeftIcon,
  BellIcon,
  BuildingStorefrontIcon,
  BuildingLibraryIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [siteName, setSiteName] = useState<string>("Dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient();
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
          if (data.logo_url) {
            setLogoUrl(data.logo_url);
          }
          if (data.site_name) {
            setSiteName(data.site_name);
          }
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    loadSettings();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { name: "Pesanan", href: "/dashboard/orders", icon: ShoppingCartIcon },
    {
      name: "Produk",
      href: "/dashboard/products",
      icon: BuildingStorefrontIcon,
    },
    { name: "Rekening", href: "/dashboard/bank-accounts", icon: BuildingLibraryIcon },
    { name: "LandingPage", href: "/dashboard/landing", icon: ViewColumnsIcon },
    { name: "Pengaturan", href: "/dashboard/settings", icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-200">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 transition-opacity bg-black opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transition duration-300 transform bg-primary lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0 ease-out" : "-translate-x-full ease-in"
          }`}
      >
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-8 object-contain brightness-0 invert opacity-90"
              />
            ) : (
              <svg
                className="w-12 h-12"
                viewBox="0 0 512 512"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M364.61 390.213C304.625 450.196 207.37 450.196 147.386 390.213C117.394 360.22 102.398 320.911 102.398 281.6C102.398 242.291 117.394 202.981 147.386 172.989C147.386 230.4 153.6 281.6 230.4 307.2C230.4 256 256 102.4 294.4 76.7999C320 128 334.618 142.997 364.608 172.989C394.601 202.981 409.597 242.291 409.597 281.6C409.597 320.911 394.601 360.22 364.61 390.213Z"
                  fill="#4C51BF"
                  stroke="#4C51BF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M201.694 387.105C231.686 417.098 280.312 417.098 310.305 387.105C325.301 372.109 332.8 352.456 332.8 332.8C332.8 313.144 325.301 293.491 310.305 278.495C295.309 263.498 288 256 275.2 230.4C256 243.2 243.201 320 243.201 345.6C201.694 345.6 179.2 332.8 179.2 332.8C179.2 352.456 186.698 372.109 201.694 387.105Z"
                  fill="white"
                ></path>
              </svg>
            )}
          </div>
        </div>

        <nav className="mt-10">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-6 py-4 mt-4 text-white transition ${isActive
                  ? "bg-slate-700 bg-opacity-25"
                  : "hover:bg-slate-700 hover:bg-opacity-25"
                  }`}
              >
                <Icon className="w-6 h-6" />
                <span className="mx-3">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-primary border-b-4 border-primary">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="focus:outline-none lg:hidden mr-3"
            >
              <Bars3BottomLeftIcon className="w-6 h-6 text-white" />
            </button>

            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-primary" />
              </span>
              <input
                className="w-48 md:w-64 pl-10 py-2 rounded-md form-input focus:border-primary text-sm"
                type="text"
                placeholder="Pencarian..."
              />
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="flex mx-4 text-gray-600 focus:outline-none"
              >
                <BellIcon className="w-6 h-6 text-white" />
              </button>

              {notificationOpen && (
                <div
                  className="fixed inset-0 z-10 w-full h-full"
                  onClick={() => setNotificationOpen(false)}
                ></div>
              )}

              {notificationOpen && (
                <div className="absolute right-0 z-10 mt-2 overflow-hidden bg-white rounded-lg shadow-xl w-80">
                  <a
                    href="#"
                    className="flex items-center px-4 py-3 -mx-2 text-gray-600 hover:text-white hover:bg-primary"
                  >
                    <img
                      className="object-cover w-8 h-8 mx-1 rounded-full"
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"
                      alt="avatar"
                    />
                    <p className="mx-2 text-sm">
                      <span className="font-bold">Sara Salah</span> replied on{" "}
                      <span className="font-bold text-indigo-400">
                        Upload Image
                      </span>{" "}
                      artical . 2m
                    </p>
                  </a>
                  <a
                    href="#"
                    className="flex items-center px-4 py-3 -mx-2 text-gray-600 hover:text-white hover:bg-primary"
                  >
                    <img
                      className="object-cover w-8 h-8 mx-1 rounded-full"
                      src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80"
                      alt="avatar"
                    />
                    <p className="mx-2 text-sm">
                      <span className="font-bold">Slick Net</span> start
                      following you . 45m
                    </p>
                  </a>
                  <a
                    href="#"
                    className="flex items-center px-4 py-3 -mx-2 text-gray-600 hover:text-white hover:bg-primary"
                  >
                    <img
                      className="object-cover w-8 h-8 mx-1 rounded-full"
                      src="https://images.unsplash.com/photo-1450297350677-623de575f31c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"
                      alt="avatar"
                    />
                    <p className="mx-2 text-sm">
                      <span className="font-bold">Jane Doe</span> Like Your
                      reply on{" "}
                      <span className="font-bold text-indigo-400">
                        Test with TDD
                      </span>{" "}
                      artical . 1h
                    </p>
                  </a>
                  <a
                    href="#"
                    className="flex items-center px-4 py-3 -mx-2 text-gray-600 hover:text-white hover:bg-primary"
                  >
                    <img
                      className="object-cover w-8 h-8 mx-1 rounded-full"
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=398&q=80"
                      alt="avatar"
                    />
                    <p className="mx-2 text-sm">
                      <span className="font-bold">Abigail Bennett</span> start
                      following you . 3h
                    </p>
                  </a>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative block w-8 h-8 overflow-hidden rounded-full shadow focus:outline-none"
              >
                {profile?.avatar_url ? (
                  <img
                    className="object-cover w-full h-full"
                    src={profile.avatar_url}
                    alt="Your avatar"
                  />
                ) : (
                  <img
                    className="object-cover w-full h-full"
                    src="https://images.unsplash.com/photo-1528892952291-009c663ce843?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=296&q=80"
                    alt="Your avatar"
                  />
                )}
              </button>

              {dropdownOpen && (
                <div
                  className="fixed inset-0 z-10 w-full h-full"
                  onClick={() => setDropdownOpen(false)}
                ></div>
              )}

              {dropdownOpen && (
                <div className="absolute right-0 z-10 w-48 mt-2 overflow-hidden bg-white rounded-md shadow-xl">
                  <Link
                    href="/dashboard/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Akun
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white"
                  >
                    {loading ? "Memuat..." : "Keluar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
