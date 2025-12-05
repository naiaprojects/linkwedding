"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhotoIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import LinkManager from "./components/LinkManager"; // Import komponen baru

const settingsSchema = z.object({
  site_name: z.string().min(1, "Nama website wajib diisi"),
  site_description: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;
type Verification = { name: string; content: string };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("website"); // State untuk tab

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [newVerification, setNewVerification] = useState({
    name: "",
    content: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (data) {
          setSettingsId(data.id);
          reset({
            site_name: data.site_name || "",
            site_description: data.site_description || "",
            meta_title: data.meta_title || "",
            meta_description: data.meta_description || "",
            meta_keywords: data.meta_keywords?.join(", ") || "",
          });

          if (data.favicon_url) {
            setFaviconPreview(data.favicon_url);
          }

          if (data.logo_url) {
            setLogoPreview(data.logo_url);
          }

          setVerifications(
            Object.entries(data.meta_verification || {}).map(
              ([name, content]) => ({
                name,
                content: content as string,
              })
            )
          );
        } else {
          reset({
            site_name: "",
            site_description: "",
            meta_title: "",
            meta_description: "",
            meta_keywords: "",
          });
        }
      } catch (err: any) {
        console.error("Error loading settings:", err);
        alert("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabase, reset]);

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);

    let favicon_url = faviconPreview || null;
    let logo_url = logoPreview || null;

    try {
      const timestamp = Date.now();

      if (faviconFile) {
        const fileExt = faviconFile.name.split(".").pop() || "ico";
        const fileName = `favicon-${timestamp}.${fileExt}`;
        const filePath = `favicons/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("public")
          .upload(filePath, faviconFile, {
            upsert: true,
            contentType: faviconFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("public")
          .getPublicUrl(filePath);
        favicon_url = urlData.publicUrl;
      }

      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop() || "png";
        const fileName = `logo-${timestamp}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("public")
          .upload(filePath, logoFile, {
            upsert: true,
            contentType: logoFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("public")
          .getPublicUrl(filePath);
        logo_url = urlData.publicUrl;
      }

      const meta_verification: Record<string, string> = {};
      verifications.forEach((v) => {
        if (v.name && v.content) meta_verification[v.name] = v.content;
      });

      const updateData: any = {
        site_name: data.site_name,
        site_description: data.site_description,
        favicon_url: favicon_url,
        logo_url: logo_url,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        meta_keywords: data.meta_keywords
          ? data.meta_keywords.split(",").map((k) => k.trim())
          : null,
        meta_verification,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (settingsId) {
        result = await supabase
          .from("site_settings")
          .update(updateData)
          .eq("id", settingsId);
      } else {
        result = await supabase.from("site_settings").insert(updateData);
      }

      if (result.error) throw result.error;

      alert("Pengaturan berhasil disimpan!");
      window.location.reload();
    } catch (err: any) {
      console.error("Error detail:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addVerification = () => {
    if (newVerification.name && newVerification.content) {
      setVerifications([...verifications, newVerification]);
      setNewVerification({ name: "", content: "" });
    }
  };

  const removeVerification = (index: number) => {
    setVerifications(verifications.filter((_, i) => i !== index));
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFaviconFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setFaviconPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6 sm:mb-8">Pengaturan</h3>

      {/* Tab Navigation - Scrollable on mobile */}
      <div className="border-b border-gray-200 mb-6 sm:mb-8 -mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
          {[
            { id: "website", label: "Website" },
            { id: "nav", label: "Navigasi" },
            { id: "social", label: "Sosial" },
            { id: "footer", label: "Footer" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "website" && (
          <div>
            {/* --- AWAL: KODE ASLI ANDA TANPA MODIFIKASI --- */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Favicon
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-6">
                  <div className="shrink-0">
                    {faviconPreview ? (
                      <img
                        src={faviconPreview}
                        alt="Favicon preview"
                        className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-200 rounded flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="block flex-1">
                    <span className="sr-only">Pilih favicon</span>
                    <input
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconChange}
                      className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, ICO, JPG. Ukuran ideal: 32x32px
                </p>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Logo Website
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-6">
                  <div className="shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-12 sm:h-16 w-auto object-contain max-w-[150px]"
                      />
                    ) : (
                      <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-200 rounded flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="block flex-1">
                    <span className="sr-only">Pilih logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, SVG. Disarankan dengan transparansi.
                </p>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Informasi Umum
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Website
                    </label>
                    <input
                      {...register("site_name")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                    {errors.site_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.site_name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi Website
                    </label>
                    <textarea
                      {...register("site_description")}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Meta Tags SEO
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      {...register("meta_title")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Judul halaman di Google"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      {...register("meta_description")}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Deskripsi singkat di hasil pencarian"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Keywords
                    </label>
                    <input
                      {...register("meta_keywords")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="kata1, kata2, kata3"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                  Verifikasi Kepemilikan
                </h4>
                <div className="space-y-3">
                  {verifications.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{v.name}</p>
                        <p className="text-xs text-gray-600 truncate">
                          {v.content}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVerification(i)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder="Nama (google-site)"
                      value={newVerification.name}
                      onChange={(e) =>
                        setNewVerification({
                          ...newVerification,
                          name: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Kode verifikasi"
                      value={newVerification.content}
                      onChange={(e) =>
                        setNewVerification({
                          ...newVerification,
                          content: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={addVerification}
                      className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-opacity-90 flex-shrink-0"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center sm:justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                </button>
              </div>
            </form>
            {/* --- AKHIR: KODE ASLI ANDA --- */}
          </div>
        )}
        {activeTab === "nav" && <LinkManager type="nav" />}
        {activeTab === "social" && <LinkManager type="social" />}
        {activeTab === "footer" && <LinkManager type="footer" />}
      </div>
    </div>
  );
}
