"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Product, ProductPackage } from "@/types/product";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    EyeIcon,
    ShoppingCartIcon,
    ChatBubbleLeftRightIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function ProductDetailPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<number>(0);
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const supabase = createClient();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", productId)
                    .single();

                if (error) throw error;
                setProduct(data);

                // Set default package (middle one if available, else first)
                if (data?.packages && data.packages.length > 0) {
                    const middleIndex = Math.floor(data.packages.length / 2);
                    setSelectedPackage(middleIndex);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                router.push("/products");
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId, supabase, router]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const generateWhatsAppLink = () => {
        if (!product) return "#";

        const currentPkg = product.packages?.[selectedPackage];
        const phoneNumber = "6281234567890"; // Ganti dengan nomor WA yang benar

        let message = `Halo, saya tertarik dengan produk:\n\n`;
        message += `📦 *${product.name}*\n`;
        if (currentPkg) {
            message += `📋 Paket: *${currentPkg.name}*\n`;
            message += `💰 Harga: *${formatPrice(currentPkg.price)}*\n`;
        }
        message += `\nMohon informasi lebih lanjut. Terima kasih!`;

        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
                        <div className="grid lg:grid-cols-2 gap-12">
                            <div className="h-96 bg-gray-200 rounded-2xl"></div>
                            <div className="space-y-4">
                                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-20 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Produk tidak ditemukan
                    </h1>
                    <Link href="/products" className="text-primary hover:underline">
                        Kembali ke daftar produk
                    </Link>
                </div>
            </div>
        );
    }

    const currentPackage = product.packages?.[selectedPackage];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Kembali
                </button>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Product Image */}
                    <div className="relative">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                            <img
                                src={product.image_url || "/placeholder-product.png"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = "/placeholder-product.png";
                                }}
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                            {product.name}
                        </h1>
                        {product.description && (
                            <p className="text-gray-500 mb-4">{product.description}</p>
                        )}

                        {/* Price */}
                        {currentPackage && (
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-primary">
                                    {formatPrice(currentPackage.price)}
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            <a
                                href={generateWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                Konsultasi
                            </a>

                            {product.demo_url && (
                                <a
                                    href={product.demo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition-colors"
                                >
                                    <EyeIcon className="w-5 h-5" />
                                    Lihat Demo
                                </a>
                            )}

                            <Link
                                href={`/order?product=${product.id}&package=${selectedPackage}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <ShoppingCartIcon className="w-5 h-5" />
                                Pesan Sekarang
                            </Link>
                        </div>

                        {/* Package Tabs */}
                        {product.packages && product.packages.length > 0 && (
                            <div className="mb-8">
                                <div className="flex border-b border-gray-200">
                                    {product.packages.map((pkg, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedPackage(index)}
                                            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${selectedPackage === index
                                                ? "border-primary text-primary"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                                }`}
                                        >
                                            {pkg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Package Details */}
                        {currentPackage && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Detail Produk ({currentPackage.name})
                                </h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Jenis</p>
                                        <p className="font-medium text-primary">
                                            {product.jenis || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Kategori</p>
                                        <p className="font-medium text-primary">
                                            {product.category || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Design</p>
                                        <p className="font-medium text-primary">
                                            {product.design || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Undangan</p>
                                        <p className="font-medium text-primary">
                                            {currentPackage.undangan || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Foto</p>
                                        <p className="font-medium text-primary">
                                            {currentPackage.foto || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Video</p>
                                        <p className="font-medium text-primary">
                                            {currentPackage.video || "-"}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-400">Share</p>
                                        <p className="font-medium text-primary">
                                            {currentPackage.share || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
