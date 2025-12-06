"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { EyeIcon } from "@heroicons/react/24/outline";
import { Product, ProductPackage } from "@/types/product";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
};

const getLowestPrice = (packages: ProductPackage[] | undefined) => {
  if (!packages || packages.length === 0) return 0;
  return Math.min(...packages.map((pkg) => pkg.price));
};

const ProductCardHome = ({ product }: { product: Product }) => {
  const lowestPrice = getLowestPrice(product.packages);

  return (
    <article className="group w-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-56 overflow-hidden bg-gray-100">
          <img
            alt={product.name}
            className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
            src={product.image_url || "/placeholder-product.png"}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "/placeholder-product.png";
            }}
          />

        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h2 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h2>
        </Link>
        {product.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400 ml-1">
              Harga Mulai dari
            </span>

          </div>
          <span className="text-xl font-bold text-primary">
            {formatPrice(lowestPrice)}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 flex justify-between">
        <Link
          href={`/products/${product.id}`}
          className="block text-center py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Detail
        </Link>


        {product.demo_url && (
          <Link
            href={product.demo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block text-center py-2 px-4 bg-white text-primary border-2 border-primary font-medium rounded-lg hover:border-primary/90 transition-colors"
          >
            Demo
          </Link>
        )}
      </div>
    </article>
  );
};

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section id="products" className="px-6 py-12 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Produk <span className="text-primary">Unggulan</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Mudah diakses, hemat biaya, dan banyak metode pembayarannya!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {products.map((product) => (
                <ProductCardHome key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 lg:mt-12 text-center">
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors w-full sm:w-auto"
              >
                Lihat Semua Produk
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
