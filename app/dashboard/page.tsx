"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ChartPieIcon,
  CubeIcon,
  WalletIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
}

interface RecentOrder {
  id: string;
  invoice_number: string;
  customer_name: string;
  product_name: string;
  package_name: string;
  total: number;
  payment_status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [chartData, setChartData] = useState<{ categories: string[]; series: number[] }>({
    categories: [],
    series: [],
  });
  const [statusChartData, setStatusChartData] = useState({
    series: [0, 0, 0],
    labels: ["Pending", "In Progress", "Paid"],
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const orders = ordersData || [];

      const pending = orders.filter((o) => o.payment_status === "pending").length;
      const inProgress = orders.filter((o) => o.payment_status === "in_progress").length;
      const paid = orders.filter((o) => o.payment_status === "paid").length;
      const totalRevenue = orders
        .filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const revenueThisMonth = orders
        .filter((o) => o.payment_status === "paid" && new Date(o.created_at) >= startOfMonth)
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const ordersThisWeek = orders.filter((o) => new Date(o.created_at) >= startOfWeek).length;
      const ordersThisMonth = orders.filter((o) => new Date(o.created_at) >= startOfMonth).length;

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orders.length,
        pendingOrders: pending,
        paidOrders: paid,
        totalRevenue,
        revenueThisMonth,
        ordersThisWeek,
        ordersThisMonth,
      });

      setStatusChartData({
        series: [pending, inProgress, paid],
        labels: ["Pending", "In Progress", "Paid"],
      });

      setRecentOrders(orders.slice(0, 5));

      const last7Days: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        last7Days[dateStr] = 0;
      }

      orders
        .filter((o) => o.payment_status === "paid")
        .forEach((order) => {
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
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
    };
    const labels: { [key: string]: string } = {
      pending: "Pending",
      in_progress: "Progress",
      paid: "Paid",
      expired: "Expired",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const areaChartOptions: ApexCharts.ApexOptions = {
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
    stroke: { curve: "smooth", width: 2 },
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
    grid: { borderColor: "#e5e7eb", strokeDashArray: 4 },
    tooltip: { y: { formatter: (val) => formatPrice(val) } },
  };

  const pieChartOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut" },
    labels: statusChartData.labels,
    colors: ["#fbbf24", "#3b82f6", "#22c55e"],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: false },
            value: { show: true, fontSize: "20px", fontWeight: "bold", color: "#111827" },
            total: {
              show: true,
              label: "Total",
              fontSize: "12px",
              color: "#6b7280",
              formatter: () => stats.totalOrders.toString(),
            },
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container px-4 sm:px-6 py-6 sm:py-8 mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard</h3>

        {/* Stats Cards - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <CubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Produk</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingCartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Pesanan</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">Lunas</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{stats.paidOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Cards - Stack on mobile */}
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className="bg-gradient-to-r from-primary to-cyan-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-white/80 text-xs sm:text-sm">Total Pendapatan</p>
                <p className="text-xl sm:text-3xl font-bold mt-1 truncate">{formatPriceShort(stats.totalRevenue)}</p>
                <p className="text-white/80 text-xs sm:text-sm mt-1 sm:mt-2">Dari {stats.paidOrders} pesanan lunas</p>
              </div>
              <WalletIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 flex-shrink-0" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-white/80 text-xs sm:text-sm">Pendapatan Bulan Ini</p>
                <p className="text-xl sm:text-3xl font-bold mt-1 truncate">{formatPriceShort(stats.revenueThisMonth)}</p>
                <p className="text-white/80 text-xs sm:text-sm mt-1 sm:mt-2">{stats.ordersThisMonth} pesanan bulan ini</p>
              </div>
              <ArrowTrendingUpIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Charts Row - Stack on mobile and tablet */}
        <div className="grid xl:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {/* Revenue Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Pendapatan 7 Hari Terakhir
            </h4>
            {typeof window !== "undefined" && (
              <Chart
                options={areaChartOptions}
                series={[{ name: "Pendapatan", data: chartData.series }]}
                type="area"
                height={250}
              />
            )}
          </div>

          {/* Status Pie Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Status Pesanan
            </h4>
            {typeof window !== "undefined" && (
              <Chart
                options={pieChartOptions}
                series={statusChartData.series}
                type="donut"
                height={200}
              />
            )}
            <div className="mt-4 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">Pending</span>
                </div>
                <span className="font-medium text-gray-800 text-sm">{statusChartData.series[0]}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">In Progress</span>
                </div>
                <span className="font-medium text-gray-800 text-sm">{statusChartData.series[1]}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-600">Paid</span>
                </div>
                <span className="font-medium text-gray-800 text-sm">{statusChartData.series[2]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mt-6">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800">Pesanan Terbaru</h4>
            <Link href="/dashboard/orders" className="text-primary hover:underline text-xs sm:text-sm">
              Lihat Semua
            </Link>
          </div>

          {/* Mobile Cards View */}
          <div className="block sm:hidden space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada pesanan</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/invoice/${order.id}`} className="text-primary hover:underline font-medium text-sm">
                      {order.invoice_number.replace("INV-", "")}
                    </Link>
                    {getStatusBadge(order.payment_status)}
                  </div>
                  <p className="text-sm text-gray-800">{order.customer_name}</p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{order.product_name}</span>
                    <span className="font-medium text-gray-800">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">INVOICE</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">PELANGGAN</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">PRODUK</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">TOTAL</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">STATUS</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">TANGGAL</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Belum ada pesanan
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3">
                        <Link href={`/invoice/${order.id}`} className="text-primary hover:underline font-medium text-sm">
                          {order.invoice_number.replace("INV-", "")}
                        </Link>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-800">{order.customer_name}</td>
                      <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-800">{order.product_name}</p>
                        <p className="text-xs text-gray-500">{order.package_name}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-3 sm:px-4 py-3">{getStatusBadge(order.payment_status)}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
