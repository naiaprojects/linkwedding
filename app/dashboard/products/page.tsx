"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductTable from "@/components/ProductTable";
import { useRouter } from "next/navigation";
import {
  CubeIcon,
  ChartPieIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface ProductStats {
  totalProducts: number;
  productsThisWeek: number;
  productsThisMonth: number;
  productsLastMonth: number;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    productsThisWeek: 0,
    productsThisMonth: 0,
    productsLastMonth: 0,
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const { count: total } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { count: thisWeek } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfWeek.toISOString());

      const { count: thisMonth } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const { count: lastMonth } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfLastMonth.toISOString())
        .lte("created_at", endOfLastMonth.toISOString());

      setStats({
        totalProducts: total || 0,
        productsThisWeek: thisWeek || 0,
        productsThisMonth: thisMonth || 0,
        productsLastMonth: lastMonth || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/products/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      try {
        setLoading(true);
        const { error } = await supabase.from("products").delete().eq("id", id);

        if (error) throw error;

        fetchStats();
        router.refresh();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Gagal menghapus produk. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h3 className="text-2xl sm:text-3xl font-bold text-primary">Manajemen Produk</h3>

      {/* Stats Cards - Responsive Grid */}
      <div className="mt-4 sm:mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center px-4 sm:px-5 py-4 sm:py-6 rounded-xl sm:rounded-2xl border border-gray-200 bg-white">
            <div className="p-2.5 sm:p-3 bg-primary bg-opacity-75 rounded-full flex-shrink-0">
              <CubeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="ml-4 sm:mx-5">
              <h4 className="text-xl sm:text-2xl font-semibold text-gray-700">
                +{stats.productsThisWeek}
              </h4>
              <div className="text-gray-500 text-sm sm:text-base">Produk Ditambahkan</div>
              <div className="text-xs sm:text-sm text-primary">Minggu ini</div>
            </div>
          </div>

          <div className="flex items-center px-4 sm:px-5 py-4 sm:py-6 rounded-xl sm:rounded-2xl border border-gray-200 bg-white">
            <div className="p-2.5 sm:p-3 bg-primary bg-opacity-75 rounded-full flex-shrink-0">
              <ChartPieIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="ml-4 sm:mx-5">
              <h4 className="text-xl sm:text-2xl font-semibold text-gray-700">
                +{stats.productsThisMonth}
              </h4>
              <div className="text-gray-500 text-sm sm:text-base">Produk Bulan Ini</div>
            </div>
          </div>

          <div className="flex items-center px-4 sm:px-5 py-4 sm:py-6 rounded-xl sm:rounded-2xl border border-gray-200 bg-white sm:col-span-2 xl:col-span-1">
            <div className="p-2.5 sm:p-3 bg-secondary bg-opacity-75 rounded-full flex-shrink-0">
              <ArchiveBoxIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="ml-4 sm:mx-5">
              <h4 className="text-xl sm:text-2xl font-semibold text-gray-700">
                {stats.totalProducts}
                <span className="text-xs sm:text-sm text-primary ml-2">
                  (+{stats.productsThisMonth})
                </span>
              </h4>
              <div className="text-gray-500 text-sm sm:text-base">Semua Produk</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <ProductTable onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
