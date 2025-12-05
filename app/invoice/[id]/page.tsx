"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Order } from "@/types/order";
import { BankAccount } from "@/types/bank";
import Link from "next/link";
import {
    ArrowDownTrayIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function InvoicePage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);
    const [inputEmail, setInputEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [copied, setCopied] = useState(false);

    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const supabase = createClient();

    useEffect(() => {
        fetchOrder();
        fetchBankAccount();
    }, [orderId]);

    useEffect(() => {
        const verifiedEmail = sessionStorage.getItem(`invoice_${orderId}_email`);
        if (verifiedEmail && order && verifiedEmail === order.customer_email) {
            setEmailVerified(true);
        }
    }, [order, orderId]);

    useEffect(() => {
        if (!order || order.payment_status !== "pending") return;

        const updateCountdown = () => {
            const deadline = new Date(order.payment_deadline).getTime();
            const now = new Date().getTime();
            const diff = deadline - now;

            if (diff <= 0) {
                setCountdown({ hours: 0, minutes: 0, seconds: 0 });
                updateOrderStatus("expired");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ hours, minutes, seconds });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [order]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", orderId)
                .single();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBankAccount = async () => {
        try {
            const { data } = await supabase
                .from("bank_accounts")
                .select("*")
                .eq("is_active", true)
                .limit(1)
                .single();

            if (data) {
                setBankAccount(data);
            }
        } catch (error) {
            console.error("Error fetching bank account:", error);
        }
    };

    const updateOrderStatus = async (status: string) => {
        try {
            await supabase
                .from("orders")
                .update({ payment_status: status, updated_at: new Date().toISOString() })
                .eq("id", orderId);
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };

    const verifyEmail = () => {
        if (!order) return;

        if (inputEmail.toLowerCase() === order.customer_email.toLowerCase()) {
            setEmailVerified(true);
            setEmailError("");
            sessionStorage.setItem(`invoice_${orderId}_email`, order.customer_email);
        } else {
            setEmailError("Email tidak cocok dengan data pesanan");
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";
            case "in_progress":
                return "bg-blue-100 text-blue-700";
            case "paid":
                return "bg-green-100 text-green-700";
            case "expired":
            case "cancelled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending":
                return "Pending Payment";
            case "in_progress":
                return "In Progress";
            case "paid":
                return "Dibayar";
            case "expired":
                return "Expired";
            case "cancelled":
                return "Dibatalkan";
            default:
                return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-24">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Invoice tidak ditemukan
                    </h1>
                    <Link href="/products" className="text-primary hover:underline">
                        Kembali ke produk
                    </Link>
                </div>
            </div>
        );
    }

    if (!emailVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-md mx-auto">
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ExclamationCircleIcon className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Verifikasi Email
                            </h1>
                            <p className="text-gray-600 mb-6">
                                Masukkan email yang digunakan saat pemesanan untuk melihat invoice.
                            </p>

                            <div className="space-y-4">
                                <input
                                    type="email"
                                    value={inputEmail}
                                    onChange={(e) => setInputEmail(e.target.value)}
                                    placeholder="Masukkan email Anda"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                />
                                {emailError && (
                                    <p className="text-red-500 text-sm">{emailError}</p>
                                )}
                                <button
                                    onClick={verifyEmail}
                                    className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Verifikasi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-primary">
                        Invoice #{order.invoice_number}
                    </h1>
                    <div className="flex gap-2">
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Unduh
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                            Cetak
                        </button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="grid sm:grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Bayar ke:</p>
                                    <p className="font-semibold text-gray-800">LinkWedding.id</p>
                                    <p className="text-sm text-gray-600">Indonesia</p>
                                    <p className="text-sm text-primary">support@linkwedding.id</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Invoice untuk:</p>
                                    <p className="font-semibold text-gray-800">{order.customer_name}</p>
                                    <p className="text-sm text-primary">{order.customer_email}</p>
                                    <p className="text-sm text-gray-600">{order.customer_phone}</p>
                                </div>
                            </div>

                            <table className="w-full mb-6">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                                        <th className="pb-3 font-medium">PAKET</th>
                                        <th className="pb-3 font-medium">HARGA</th>
                                        <th className="pb-3 font-medium">DISKON</th>
                                        <th className="pb-3 font-medium text-right">TOTAL HARGA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-4">
                                            <p className="font-semibold text-gray-800">{order.package_name}</p>
                                            <p className="text-sm text-gray-500">{order.product_name}</p>
                                        </td>
                                        <td className="py-4 text-gray-700">
                                            {formatPrice(order.package_price)}
                                        </td>
                                        <td className="py-4 text-gray-700">
                                            {order.discount_amount > 0 ? formatPrice(order.discount_amount) : formatPrice(0)}
                                        </td>
                                        <td className="py-4 text-right font-semibold text-primary">
                                            {formatPrice(order.total)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Diskon ({order.discount_code})</span>
                                        <span>- {formatPrice(order.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>{formatPrice(order.tax)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </div>

                            {order.payment_status === "pending" && (
                                <div className="mt-6 p-4 bg-yellow-50 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ClockIcon className="w-6 h-6 text-yellow-600" />
                                        <div>
                                            <p className="font-medium text-gray-800">Batas Waktu Pembayaran</p>
                                            <p className="text-sm text-gray-600">Selesaikan pembayaran sebelum waktu habis</p>
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {String(countdown.hours).padStart(2, "0")} :{" "}
                                        {String(countdown.minutes).padStart(2, "0")} :{" "}
                                        {String(countdown.seconds).padStart(2, "0")}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
                                <button className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Unduh Invoice
                                </button>
                                <button
                                    onClick={copyLink}
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                                >
                                    <ClipboardDocumentIcon className="w-5 h-5" />
                                    {copied ? "Tersalin!" : "Salin Tautan"}
                                </button>
                                {order.payment_status === "pending" && (
                                    <Link
                                        href={`/invoice/${order.id}/confirm`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Konfirmasi Pembayaran
                                    </Link>
                                )}
                                {order.payment_status === "paid" && (
                                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-xl">
                                        <CheckCircleIcon className="w-5 h-5" />
                                        Dibayar
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-500">Total Invoice:</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {formatPrice(order.total)}
                                </p>
                            </div>

                            <div className="mb-6">
                                <div
                                    className={`w-full py-3 px-4 rounded-xl font-medium text-center ${getStatusColor(
                                        order.payment_status
                                    )}`}
                                >
                                    {getStatusLabel(order.payment_status)}
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Created:</span>
                                    <span className="font-medium text-gray-800">
                                        {formatDate(order.created_at)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Batas Waktu Pembayaran:</span>
                                    <span className="font-medium text-primary">
                                        {formatDate(order.payment_deadline)}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 mt-6 pt-6 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Metode Pembayaran:</span>
                                    <span className="font-medium text-gray-800">Bank</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Bank/E-wallet:</span>
                                    <span className="font-medium text-gray-800">
                                        {bankAccount?.bank_name || order.payment_bank || "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">No Akun/Rekening:</span>
                                    <span className="font-medium text-gray-800">
                                        {bankAccount?.account_number || "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Atas Nama:</span>
                                    <span className="font-medium text-gray-800">
                                        {bankAccount?.account_name || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
