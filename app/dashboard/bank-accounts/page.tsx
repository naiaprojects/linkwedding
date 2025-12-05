"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BankAccount } from "@/types/bank";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

export default function BankAccountsPage() {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

    // Form state
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    const supabase = createClient() as any;

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const { data, error } = await supabase
                .from("bank_accounts")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAccounts(data || []);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (account?: BankAccount) => {
        if (account) {
            setEditingAccount(account);
            setBankName(account.bank_name);
            setAccountNumber(account.account_number);
            setAccountName(account.account_name);
            setIsActive(account.is_active);
        } else {
            setEditingAccount(null);
            setBankName("");
            setAccountNumber("");
            setAccountName("");
            setIsActive(true);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAccount(null);
        setBankName("");
        setAccountNumber("");
        setAccountName("");
        setIsActive(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingAccount) {
                const { error } = await supabase
                    .from("bank_accounts")
                    .update({
                        bank_name: bankName,
                        account_number: accountNumber,
                        account_name: accountName,
                        is_active: isActive,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", editingAccount.id);

                if (error) throw error;
            } else {
                const { error } = await supabase.from("bank_accounts").insert({
                    bank_name: bankName,
                    account_number: accountNumber,
                    account_name: accountName,
                    is_active: isActive,
                });

                if (error) throw error;
            }

            await fetchAccounts();
            closeModal();
        } catch (error: any) {
            console.error("Error saving account:", error);
            alert("Gagal menyimpan: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus rekening ini?")) return;

        try {
            const { error } = await supabase
                .from("bank_accounts")
                .delete()
                .eq("id", id);

            if (error) throw error;
            await fetchAccounts();
        } catch (error: any) {
            console.error("Error deleting account:", error);
            alert("Gagal menghapus: " + error.message);
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("bank_accounts")
                .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;
            await fetchAccounts();
        } catch (error: any) {
            console.error("Error toggling status:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-primary">Rekening Bank</h3>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Kelola rekening bank untuk pembayaran
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm sm:text-base"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Tambah Rekening</span>
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
                    <BuildingLibraryIcon className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-base sm:text-lg mb-4">
                        Belum ada rekening bank
                    </p>
                    <button
                        onClick={() => openModal()}
                        className="text-primary hover:underline"
                    >
                        Tambah rekening pertama
                    </button>
                </div>
            ) : (
                <div className="grid gap-3 sm:gap-4">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6"
                        >
                            {/* Mobile Layout */}
                            <div className="flex flex-col sm:hidden gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <BuildingLibraryIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">
                                                {account.bank_name}
                                            </h4>
                                            <p className="text-gray-600 text-sm">{account.account_number}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleActive(account.id, account.is_active)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${account.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                            }`}
                                    >
                                        {account.is_active ? "Aktif" : "Nonaktif"}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">a.n. {account.account_name}</p>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openModal(account)}
                                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden sm:flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <BuildingLibraryIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">
                                            {account.bank_name}
                                        </h4>
                                        <p className="text-gray-600">{account.account_number}</p>
                                        <p className="text-sm text-gray-500">a.n. {account.account_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleActive(account.id, account.is_active)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${account.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                            }`}
                                    >
                                        {account.is_active ? "Aktif" : "Nonaktif"}
                                    </button>
                                    <button
                                        onClick={() => openModal(account)}
                                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Responsive */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden animate-slide-up sm:animate-none">
                        <div className="p-5 sm:p-6 border-b border-gray-100">
                            <h4 className="text-lg font-semibold text-gray-800">
                                {editingAccount ? "Edit Rekening" : "Tambah Rekening"}
                            </h4>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Bank
                                </label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="BCA, Mandiri, BRI, dll"
                                    required
                                    className="w-full px-4 py-3 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-base sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Rekening
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="1234567890"
                                    required
                                    className="w-full px-4 py-3 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-base sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Atas Nama
                                </label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="Nama pemilik rekening"
                                    required
                                    className="w-full px-4 py-3 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-base sm:text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-5 h-5 sm:w-4 sm:h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">
                                    Aktif (tampilkan di halaman pembayaran)
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
                                >
                                    {saving ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
