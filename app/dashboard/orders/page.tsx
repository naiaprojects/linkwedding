"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types/order";
import {
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        paid: 0,
        revenue: 0,
        thisWeek: 0,
        thisMonth: 0,
    });
    const [chartData, setChartData] = useState<{ categories: string[]; series: number[] }>({
        categories: [],
        series: [],
    });

    const itemsPerPage = 10;
    const supabase = createClient();

    useEffect(() => {
        fetchOrders();
        fetchStats();
        fetchChartData();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const { data: allOrders } = await supabase.from("orders").select("*");

            if (allOrders) {
                const pending = allOrders.filter((o) => o.payment_status === "pending").length;
                const inProgress = allOrders.filter((o) => o.payment_status === "in_progress").length;
                const paid = allOrders.filter((o) => o.payment_status === "paid").length;
                const revenue = allOrders
                    .filter((o) => o.payment_status === "paid")
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                const thisWeek = allOrders.filter(
                    (o) => new Date(o.created_at) >= startOfWeek
                ).length;
                const thisMonth = allOrders.filter(
                    (o) => new Date(o.created_at) >= startOfMonth
                ).length;

                setStats({
                    total: allOrders.length,
                    pending,
                    inProgress,
                    paid,
                    revenue,
                    thisWeek,
                    thisMonth,
                });
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchChartData = async () => {
        try {
            const { data } = await supabase
                .from("orders")
                .select("created_at, total, payment_status")
                .eq("payment_status", "paid")
                .order("created_at", { ascending: true });

            if (data) {
                const last7Days: { [key: string]: number } = {};
                const today = new Date();

                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
                    last7Days[dateStr] = 0;
                }

                data.forEach((order) => {
                    const date = new Date(order.created_at);
                    const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
                    if (last7Days.hasOwnProperty(dateStr)) {
                        last7Days[dateStr] += order.total || 0;
                    }
                });

                setChartData({
                    categories: Object.keys(last7Days),
                    series: Object.values(last7Days),
                });
            }
        } catch (error) {
            console.error("Error fetching chart data:", error);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const updateData: any = {
                payment_status: newStatus,
                updated_at: new Date().toISOString(),
            };

            if (newStatus === "paid") {
                updateData.paid_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from("orders")
                .update(updateData)
                .eq("id", orderId);

            if (error) throw error;

            await fetchOrders();
            await fetchStats();
            await fetchChartData();
        } catch (error: any) {
            console.error("Error updating order:", error);
            alert("Gagal update status: " + error.message);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatPriceShort = (price: number) => {
        if (price >= 1000000) {
            return `Rp${(price / 1000000).toFixed(1)}jt`;
        }
        if (price >= 1000) {
            return `Rp${(price / 1000).toFixed(0)}rb`;
        }
        return formatPrice(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = {
            pending: "bg-yellow-100 text-yellow-700",
            in_progress: "bg-blue-100 text-blue-700",
            paid: "bg-green-100 text-green-700",
            expired: "bg-red-100 text-red-700",
            cancelled: "bg-gray-100 text-gray-700",
        };

        const labels: { [key: string]: string } = {
            pending: "Pending",
            in_progress: "Progress",
            paid: "Paid",
            expired: "Expired",
            cancelled: "Cancel",
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || order.payment_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const currentOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "area",
            toolbar: { show: false },
            fontFamily: "inherit",
        },
        colors: ["#0891b2"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 100],
            },
        },
        stroke: {
            curve: "smooth",
            width: 2,
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: chartData.categories,
            labels: { style: { colors: "#6b7280", fontSize: "10px" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: "#6b7280", fontSize: "10px" },
                formatter: (val) => formatPriceShort(val),
            },
        },
        grid: {
            borderColor: "#e5e7eb",
            strokeDashArray: 4,
        },
        tooltip: {
            y: {
                formatter: (val) => formatPrice(val),
            },
        },
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
            <div className="mb-6 sm:mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary">Manajemen Pesanan</h3>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Kelola dan pantau semua pesanan</p>
            </div>

            {/* Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Pending</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Progress</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Paid</p>
                            <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.paid}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-xs sm:text-sm">Rp</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500">Revenue</p>
                            <p className="text-sm sm:text-xl font-bold text-primary truncate">{formatPriceShort(stats.revenue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                    Pendapatan 7 Hari Terakhir
                </h4>
                {typeof window !== "undefined" && (
                    <Chart
                        options={chartOptions}
                        series={[{ name: "Pendapatan", data: chartData.series }]}
                        type="area"
                        height={250}
                    />
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari invoice, nama..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 sm:flex-none px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        >
                            <option value="">Semua Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="paid">Paid</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                </div>

                {/* Orders Table - Mobile Responsive */}
                <div className="overflow-x-auto">
                    {/* Mobile Cards View */}
                    <div className="block sm:hidden">
                        {currentOrders.length === 0 ? (
                            <div className="px-4 py-12 text-center text-gray-500">
                                Tidak ada pesanan ditemukan
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {currentOrders.map((order) => (
                                    <div key={order.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Link
                                                    href={`/invoice/${order.id}`}
                                                    className="text-primary hover:underline font-medium text-sm"
                                                >
                                                    {order.invoice_number}
                                                </Link>
                                                <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                                            </div>
                                            {getStatusBadge(order.payment_status)}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{order.customer_name}</p>
                                                <p className="text-xs text-gray-500">{order.product_name}</p>
                                            </div>
                                            <p className="font-semibold text-gray-800">{formatPrice(order.total)}</p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            {order.payment_status === "in_progress" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "paid")}
                                                    className="flex-1 py-2 text-sm text-green-600 bg-green-50 rounded-lg font-medium"
                                                >
                                                    Tandai Lunas
                                                </button>
                                            )}
                                            {order.payment_status === "pending" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "cancelled")}
                                                    className="flex-1 py-2 text-sm text-red-600 bg-red-50 rounded-lg font-medium"
                                                >
                                                    Batalkan
                                                </button>
                                            )}
                                            {order.payment_proof_url && (
                                                <a
                                                    href={order.payment_proof_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium text-center"
                                                >
                                                    Lihat Bukti
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <table className="w-full hidden sm:table">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500">INVOICE</th>
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500">PELANGGAN</th>
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500 hidden lg:table-cell">PRODUK</th>
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500">TOTAL</th>
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500">STATUS</th>
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500 hidden md:table-cell">TANGGAL</th>
                                <th className="px-4 sm:px-5 py-4 text-xs font-medium text-gray-500">AKSI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                                        Tidak ada pesanan ditemukan
                                    </td>
                                </tr>
                            ) : (
                                currentOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 sm:px-5 py-4">
                                            <Link
                                                href={`/invoice/${order.id}`}
                                                className="text-primary hover:underline font-medium text-sm"
                                            >
                                                {order.invoice_number.replace("INV-", "")}
                                            </Link>
                                        </td>
                                        <td className="px-4 sm:px-5 py-4">
                                            <p className="font-medium text-gray-800 text-sm">{order.customer_name}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">{order.customer_email}</p>
                                        </td>
                                        <td className="px-4 sm:px-5 py-4 hidden lg:table-cell">
                                            <p className="text-gray-800 text-sm">{order.product_name}</p>
                                            <p className="text-xs text-gray-500">{order.package_name}</p>
                                        </td>
                                        <td className="px-4 sm:px-5 py-4 font-medium text-gray-800 text-sm whitespace-nowrap">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="px-4 sm:px-5 py-4">{getStatusBadge(order.payment_status)}</td>
                                        <td className="px-4 sm:px-5 py-4 text-gray-600 text-sm hidden md:table-cell">{formatDate(order.created_at)}</td>
                                        <td className="px-4 sm:px-5 py-4">
                                            <div className="flex gap-1">
                                                {order.payment_status === "in_progress" && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, "paid")}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Tandai Lunas"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {order.payment_status === "pending" && (
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, "cancelled")}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Batalkan"
                                                    >
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {order.payment_proof_url && (
                                                    <a
                                                        href={order.payment_proof_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Lihat Bukti"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs sm:text-sm text-gray-500">
                            {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length}
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
