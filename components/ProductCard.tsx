"use client";

import Link from "next/link";
import { EyeIcon } from "@heroicons/react/24/outline";
import { Product, ProductPackage } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
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

  const getHighestPrice = (packages: ProductPackage[] | undefined) => {
    if (!packages || packages.length === 0) return 0;
    return Math.max(...packages.map((pkg) => pkg.price));
  };

  const lowestPrice = getLowestPrice(product.packages);
  const highestPrice = getHighestPrice(product.packages);

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
        <Link
          href={`/products/${product.id}`}
          className="block text-center py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Detail
        </Link>
      </div>
    </article>
  );
};

export default ProductCard;
