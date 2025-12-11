"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Order } from "@/types/order";
import { BankAccount } from "@/types/bank";
import Link from "next/link";
import {
    ArrowLeftIcon,
    CloudArrowUpIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { trackContact } from "@/lib/meta-pixel";

export default function ConfirmPaymentPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [emailVerified, setEmailVerified] = useState(false);

    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const supabase = createClient();

    useEffect(() => {
        fetchOrder();
        fetchBankAccount();
        checkEmailVerification();
    }, [orderId]);

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

    const checkEmailVerification = () => {
        const verifiedEmail = sessionStorage.getItem(`invoice_${orderId}_email`);
        if (verifiedEmail) {
            setEmailVerified(true);
        } else {
            router.push(`/invoice/${orderId}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProofFile(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadProof = async (file: File): Promise<string> => {
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop() || "png";
        const fileName = `payment-proof-${orderId}-${timestamp}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("public")
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from("public")
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!proofFile) {
            alert("Mohon upload bukti pembayaran");
            return;
        }

        setSubmitting(true);

        try {
            const proofUrl = await uploadProof(proofFile);

            const { error } = await supabase
                .from("orders")
                .update({
                    payment_proof_url: proofUrl,
                    payment_status: "in_progress",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", orderId);

            if (error) throw error;

            alert("Konfirmasi pembayaran berhasil dikirim!");
            router.push(`/invoice/${orderId}`);
        } catch (error: any) {
            console.error("Error confirming payment:", error);
            alert("Gagal mengirim konfirmasi: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const generateWhatsAppLink = () => {
        if (!order) return "#";

        const phoneNumber = "6289524556302"; // Admin WhatsApp linkwedding

        let message = `Halo Admin LinkWedding, saya ingin konfirmasi pembayaran untuk:\n\n`;
        message += `📋 Order ID: *${order.invoice_number}*\n`;
        message += `💰 Total: *${formatPrice(order.total)}*\n`;
        message += `\nMohon dicek ya, terima kasih.`;

        return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    };

    const handleWhatsAppClick = () => {
        trackContact();
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

    if (!order || !emailVerified) {
        return null;
    }

    if (order.payment_status !== "pending") {
        return (
            <div className="min-h-screen bg-gray-50 py-24">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Pembayaran Sudah Dikonfirmasi
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Status pembayaran: {order.payment_status}
                        </p>
                        <Link
                            href={`/invoice/${orderId}`}
                            className="inline-block px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90"
                        >
                            Lihat Invoice
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    <Link
                        href={`/invoice/${orderId}`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        Kembali ke Invoice
                    </Link>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h1 className="text-2xl font-bold text-gray-800">
                                Konfirmasi Pembayaran
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Invoice #{order.invoice_number}
                            </p>
                        </div>

                        <div className="p-6 bg-blue-50 border-b border-blue-100">
                            <h3 className="font-semibold text-gray-800 mb-4">
                                Transfer ke Rekening:
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Bank</p>
                                    <p className="font-semibold text-gray-800">
                                        {bankAccount?.bank_name || order.payment_bank || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Nomor Rekening</p>
                                    <p className="font-semibold text-gray-800">
                                        {bankAccount?.account_number || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Atas Nama</p>
                                    <p className="font-semibold text-gray-800">
                                        {bankAccount?.account_name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Jumlah Transfer</p>
                                    <p className="font-semibold text-primary text-lg">
                                        {formatPrice(order.total)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Bukti Transfer
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${previewUrl
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    {previewUrl ? (
                                        <div>
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="max-h-64 mx-auto rounded-lg mb-4"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProofFile(null);
                                                    setPreviewUrl("");
                                                }}
                                                className="text-sm text-red-500 hover:underline"
                                            >
                                                Hapus gambar
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-2">
                                                Klik untuk upload atau drag & drop
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                PNG, JPG hingga 5MB
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !proofFile}
                                className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                {submitting ? "Mengirim..." : "Kirim Konfirmasi"}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Atau</span>
                                </div>
                            </div>

                            <a
                                href={generateWhatsAppLink()}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleWhatsAppClick}
                                className="w-full py-3 bg-white border-2 border-green-500 text-green-600 font-medium rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                Konfirmasi via WhatsApp
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
