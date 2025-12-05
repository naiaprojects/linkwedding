"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Jangan tampilkan Header dan Footer di halaman dashboard
  const isDashboardPage = pathname?.startsWith("/dashboard");

  return (
    <>
      {!isDashboardPage && <Header />}
      <main>{children}</main>
      {!isDashboardPage && <Footer />}
    </>
  );
}
