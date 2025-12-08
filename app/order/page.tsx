"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Product, ProductPackage } from "@/types/product";
import { BankAccount } from "@/types/bank";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import LogoLoader from "@/components/LogoLoader";
import { trackInitiateCheckout, trackPurchase } from "@/lib/meta-pixel";

export default function OrderPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [discountCode, setDiscountCode] = useState("");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountApplied, setDiscountApplied] = useState(false);

    // Form fields
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [selectedBankId, setSelectedBankId] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get("product");
    const packageIndex = searchParams.get("package");
    const supabase = createClient();

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
        fetchBankAccounts();
        if (packageIndex) {
            setSelectedPackageIndex(parseInt(packageIndex));
        }
    }, [productId, packageIndex]);

    const fetchProduct = async () => {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", productId)
                .single();

            if (error) throw error;
            setProduct(data);

            // Track InitiateCheckout event
            if (data && data.packages && data.packages.length > 0) {
                const pkgIndex = packageIndex ? parseInt(packageIndex) : 0;
                const pkg = data.packages[pkgIndex] || data.packages[0];
                trackInitiateCheckout({
                    content_name: `${data.name} - ${pkg.name}`,
                    content_ids: [data.id],
                    value: pkg.price,
                    currency: "IDR",
                    num_items: 1,
                });
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            router.push("/products");
        } finally {
            setLoading(false);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            const { data, error } = await supabase
                .from("bank_accounts")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setBankAccounts(data || []);
            if (data && data.length > 0) {
                setSelectedBankId(data[0].id);
            }
        } catch (error) {
            console.error("Error fetching bank accounts:", error);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const generateInvoiceNumber = () => {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `INV-${dateStr}-${random}`;
    };

    const applyDiscount = () => {
        if (discountCode.toUpperCase() === "HEMAT10") {
            const discount = currentPackage ? currentPackage.price * 0.1 : 0;
            setDiscountAmount(discount);
            setDiscountApplied(true);
        } else if (discountCode.toUpperCase() === "HEMAT20") {
            const discount = currentPackage ? currentPackage.price * 0.2 : 0;
            setDiscountAmount(discount);
            setDiscountApplied(true);
        } else {
            alert("Kode diskon tidak valid");
            setDiscountAmount(0);
            setDiscountApplied(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!product || !currentPackage) return;

        if (!customerName || !customerEmail || !customerPhone) {
            alert("Mohon lengkapi semua data");
            return;
        }

        if (!selectedBankId) {
            alert("Mohon pilih metode pembayaran");
            return;
        }

        setSubmitting(true);

        try {
            const invoiceNumber = generateInvoiceNumber();
            const subtotal = currentPackage.price;
            const tax = 0;
            const total = subtotal - discountAmount + tax;
            const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);

            // Payment deadline: 24 hours from now
            const paymentDeadline = new Date();
            paymentDeadline.setHours(paymentDeadline.getHours() + 24);

            const orderData = {
                invoice_number: invoiceNumber,
                product_id: product.id,
                product_name: product.name,
                package_name: currentPackage.name,
                package_price: currentPackage.price,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                package_details: {
                    undangan: currentPackage.undangan,
                    foto: currentPackage.foto,
                    video: currentPackage.video,
                    share: currentPackage.share,
                },
                subtotal,
                discount_code: discountApplied ? discountCode : null,
                discount_amount: discountAmount,
                tax,
                total,
                payment_method: "bank",
                payment_bank: selectedBank?.bank_name || "",
                payment_status: "pending",
                payment_deadline: paymentDeadline.toISOString(),
            };

            const { data, error } = await supabase
                .from("orders")
                .insert(orderData)
                .select()
                .single<any>();

            if (error) throw error;

            // Track Purchase event
            trackPurchase({
                content_name: `${product.name} - ${currentPackage.name}`,
                content_ids: [product.id],
                value: total,
                currency: "IDR",
                num_items: 1,
            });

            // Redirect to invoice page
            router.push(`/invoice/${data.id}`);
        } catch (error: any) {
            console.error("Error creating order:", error);
            alert("Gagal membuat pesanan: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center items-center h-64">
                        <LogoLoader className="w-12 h-12" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product || !product.packages || product.packages.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Produk tidak ditemukan
                    </h1>
                </div>
            </div>
        );
    }

    const currentPackage = product.packages[selectedPackageIndex];
    const subtotal = currentPackage?.price || 0;
    const tax = 0;
    const total = subtotal - discountAmount + tax;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-8">
                    Pembelian {product.name}
                </h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left: Package Details */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                                {/* Package Selection Tabs */}
                                <div className="flex border-b border-gray-200">
                                    {product.packages.map((pkg, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPackageIndex(index);
                                                setDiscountAmount(0);
                                                setDiscountApplied(false);
                                            }}
                                            className={`flex-1 px-3 md:px-6 py-4 font-medium text-sm transition-colors ${selectedPackageIndex === index
                                                ? "bg-primary text-white"
                                                : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {pkg.name}
                                        </button>
                                    ))}
                                </div>

                                {/* Package Details Section */}
                                <div className="p-4 md:p-6">
                                    {/* Desktop Headers */}
                                    <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm text-gray-500 border-b border-gray-100 pb-3 font-medium">
                                        <div className="md:col-span-4">PAKET</div>
                                        <div className="md:col-span-5">DETAIL</div>
                                        <div className="md:col-span-3 text-right">HARGA</div>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 py-4">
                                        {/* Paket Column */}
                                        <div className="md:col-span-4">
                                            <div className="font-semibold text-gray-800 text-lg md:text-base">
                                                {currentPackage?.name}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-2">
                                                <p className="font-medium mb-1">Fitur:</p>
                                                <ul className="list-disc list-inside text-primary space-y-1">
                                                    <li>{currentPackage?.undangan}</li>
                                                    <li>{currentPackage?.foto}</li>
                                                    <li>{currentPackage?.video}</li>
                                                    <li>{currentPackage?.share}</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Detail Column */}
                                        <div className="md:col-span-5">
                                            <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl md:bg-transparent md:p-0 md:rounded-none">
                                                <div className="flex justify-between md:block">
                                                    <span className="text-gray-500 md:hidden">Jenis:</span>
                                                    <span className="text-right md:text-left">{product.jenis || "-"}</span>
                                                </div>
                                                <div className="flex justify-between md:block">
                                                    <span className="text-gray-500 md:hidden">Kategori:</span>
                                                    <span className="text-right md:text-left">{product.category || "-"}</span>
                                                </div>
                                                <div className="flex justify-between md:block">
                                                    <span className="text-gray-500 md:hidden">Design:</span>
                                                    <span className="text-right md:text-left">{product.design || "-"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Harga Column */}
                                        <div className="md:col-span-3">
                                            <div className="flex justify-between items-center md:block md:text-right">
                                                <span className="font-medium text-gray-500 md:hidden">Harga:</span>
                                                <span className="text-xl md:text-lg font-bold text-primary">
                                                    {formatPrice(currentPackage?.price || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Breakdown */}
                                    <div className="border-t border-gray-100 mt-6 pt-6 space-y-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>{formatPrice(subtotal)}</span>
                                        </div>
                                        {discountApplied && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Diskon ({discountCode})</span>
                                                <span>- {formatPrice(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600">
                                            <span>Pajak</span>
                                            <span>{formatPrice(tax)}</span>
                                        </div>
                                        <div className="flex justify-between text-xl font-bold text-gray-800 pt-3 border-t border-gray-100">
                                            <span>Total</span>
                                            <span>{formatPrice(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Customer Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 sticky top-24">
                                <h3 className="text-lg font-semibold text-gray-800 mb-6">
                                    Data Pelanggan
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Masukkan nama lengkap"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                            placeholder="nama@email.com"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nomor WhatsApp
                                        </label>
                                        <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            required
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Metode Pembayaran
                                        </label>
                                        {bankAccounts.length > 0 ? (
                                            <select
                                                value={selectedBankId}
                                                onChange={(e) => setSelectedBankId(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                            >
                                                {bankAccounts.map((bank) => (
                                                    <option key={bank.id} value={bank.id}>
                                                        Bank - {bank.bank_name} ({bank.account_number})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm text-red-500 py-2">
                                                Tidak ada metode pembayaran tersedia
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || bankAccounts.length === 0}
                                        className="w-full mt-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCartIcon className="w-5 h-5" />
                                        {submitting ? "Memproses..." : "Bayar Sekarang"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
