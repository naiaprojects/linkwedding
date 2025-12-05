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
          {product.packages && product.packages.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              {product.packages.map((pkg, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-white/90 backdrop-blur-sm text-primary rounded-full font-medium"
                >
                  {pkg.name}
                </span>
              ))}
            </div>
          )}
          {product.demo_url && (
            <a
              href={product.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
            </a>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h2 className="text-lg font-bold text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h2>
        </Link>
        <div className="mt-2">
          <span className="text-xl font-bold text-primary">
            {formatPrice(lowestPrice)}
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Link
          href={`/products/${product.id}`}
          className="block w-full text-center py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Lihat Detail
        </Link>
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
    <section id="products" className="bg-gradient-to-b from-white to-gray-50 py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Produk <span className="text-primary">Unggulan</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mudah diakses, hemat biaya, dan banyak metode pembayarannya!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCardHome key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
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
