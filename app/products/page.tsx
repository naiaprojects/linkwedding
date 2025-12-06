"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [designs, setDesigns] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDesign, setSelectedDesign] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const itemsPerPage = 12;

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const category = searchParams.get("category") || "";
    const design = searchParams.get("design") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");

    setSelectedCategory(category);
    setSelectedDesign(design);
    setSearchTerm(search);
    setCurrentPage(page);

    fetchProducts(category, design, search, page);
    fetchFilters();
  }, [searchParams]);

  const fetchProducts = async (category: string, design: string, search: string, page: number) => {
    try {
      setLoading(true);

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      if (design) {
        query = query.eq("design", design);
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setProducts(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const { data: catData } = await supabase
        .from("products")
        .select("category")
        .not("category", "is", null);

      const { data: designData } = await supabase
        .from("products")
        .select("design")
        .not("design", "is", null);

      const uniqueCategories = [...new Set(catData?.map((item) => item.category).filter(Boolean))];
      const uniqueDesigns = [...new Set(designData?.map((item) => item.design).filter(Boolean))];

      setCategories(uniqueCategories as string[]);
      setDesigns(uniqueDesigns as string[]);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const updateURL = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryChange = (category: string) => {
    updateURL({ category, page: "1" });
  };

  const handleDesignChange = (design: string) => {
    updateURL({ design, page: "1" });
  };

  const handleSearchChange = (search: string) => {
    updateURL({ search, page: "1" });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    updateURL({ category: "", design: "", search: "", page: "1" });
  };

  const hasActiveFilters = selectedCategory || selectedDesign || searchTerm;

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Koleksi <span className="text-primary">Undangan</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan template undangan digital yang sempurna untuk hari spesial Anda
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700"
            >
              <FunnelIcon className="w-5 h-5" />
              Filter Produk
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>
          </div>

          {/* Sidebar Filters */}
          <div className={`lg:w-72 ${showMobileFilter ? "block" : "hidden lg:block"}`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Filter</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Produk
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Ketik nama..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory
                      ? "bg-primary text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Semua Kategori
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category
                        ? "bg-primary text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Design Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDesignChange("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedDesign
                      ? "bg-primary text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Semua Design
                  </button>
                  {designs.map((design) => (
                    <button
                      key={design}
                      onClick={() => handleDesignChange(design)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedDesign === design
                        ? "bg-primary text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {design}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {selectedCategory}
                    <button onClick={() => handleCategoryChange("")}>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {selectedDesign && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {selectedDesign}
                    <button onClick={() => handleDesignChange("")}>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    "{searchTerm}"
                    <button onClick={() => handleSearchChange("")}>
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500 text-lg mb-4">
                  Tidak ada produk yang ditemukan.
                </p>
                <button
                  onClick={clearFilters}
                  className="text-primary hover:underline"
                >
                  Reset filter
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>

                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? "bg-primary text-white"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
