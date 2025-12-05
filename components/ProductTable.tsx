"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Product, ProductPackage } from "@/types/product";
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const ProductTable = ({
  onEdit,
  onDelete,
}: {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const itemsPerPage = 12;

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.jenis &&
        product.jenis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getLowestPrice = (packages: ProductPackage[] | undefined) => {
    if (!packages || packages.length === 0) return 0;
    return Math.min(...packages.map((pkg) => pkg.price));
  };

  const getHighestPrice = (packages: ProductPackage[] | undefined) => {
    if (!packages || packages.length === 0) return 0;
    return Math.max(...packages.map((pkg) => pkg.price));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-5 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Daftar Produk
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredProducts.length} produk ditemukan
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/dashboard/products/add"
              className="bg-primary shadow-theme-xs hover:bg-primary/80 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Produk
            </a>
          </div>
        </div>

        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="flex gap-3 sm:justify-between items-center">
            <div className="relative flex-1 sm:flex-auto">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden sm:w-[300px] sm:min-w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg border ${viewMode === "grid"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg border ${viewMode === "table"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {currentItems.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={product.image_url || "/placeholder-product.png"}
                      className="w-full h-full object-cover"
                      alt={product.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder-product.png";
                      }}
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {product.demo_url && (
                        <a
                          href={product.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
                        >
                          <EyeIcon className="w-4 h-4 text-gray-600" />
                        </a>
                      )}
                      <button
                        onClick={() => onEdit(product.id)}
                        className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
                      >
                        <PencilIcon className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
                      >
                        <TrashIcon className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="text-sm font-semibold bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-primary">
                        {formatPrice(getLowestPrice(product.packages))}
                        {product.packages && product.packages.length > 1 && (
                          <span className="text-gray-500 text-xs"> - {formatPrice(getHighestPrice(product.packages))}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-1">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                        {product.description}
                      </p>
                    )}

                    {product.packages && product.packages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.packages.map((pkg, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {pkg.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{product.category || "-"}</span>
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Produk
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Jenis
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Kategori
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Paket
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Harga
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tanggal
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {currentItems.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12">
                          <img
                            src={product.image_url || "/placeholder-product.png"}
                            className="h-12 w-12 rounded-md object-cover"
                            alt={product.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "/placeholder-product.png";
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.jenis || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.category || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {product.packages?.map((pkg, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {pkg.name}
                          </span>
                        )) || "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700 dark:text-gray-400">
                        {formatPrice(getLowestPrice(product.packages))}
                        {product.packages && product.packages.length > 1 && (
                          <span className="text-gray-400 text-xs block">
                            - {formatPrice(getHighestPrice(product.packages))}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700 dark:text-gray-400">
                        {formatDate(product.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        {product.demo_url && (
                          <a
                            href={product.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 dark:text-gray-400 hover:text-primary"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </a>
                        )}
                        <button
                          onClick={() => onEdit(product.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-blue-500"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-500"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-center justify-between border-t border-gray-200 px-5 py-4 sm:flex-row dark:border-gray-800">
          <div className="pb-3 sm:pb-0">
            <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Menampilkan
              <span className="text-gray-800 dark:text-white/90">
                {" "}
                {indexOfFirstItem + 1}{" "}
              </span>
              sampai
              <span className="text-gray-800 dark:text-white/90">
                {" "}
                {Math.min(indexOfLastItem, filteredProducts.length)}{" "}
              </span>
              dari
              <span className="text-gray-800 dark:text-white/90">
                {" "}
                {filteredProducts.length}{" "}
              </span>
              produk
            </span>
          </div>
          <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:rounded-none sm:bg-transparent sm:p-0 dark:bg-gray-900 dark:sm:bg-transparent">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
              Halaman {currentPage} dari {totalPages || 1}
            </span>

            <ul className="hidden items-center gap-0.5 sm:flex">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
                (page) => (
                  <li key={page}>
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${currentPage === page
                        ? "bg-primary text-white"
                        : "hover:bg-primary text-gray-700 dark:text-gray-400 hover:text-white dark:hover:text-white"
                        }`}
                    >
                      {page}
                    </button>
                  </li>
                )
              )}
            </ul>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              className="shadow-theme-xs flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
