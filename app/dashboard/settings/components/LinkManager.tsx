"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Database } from "@/types/database";

type Link = Database["public"]["Tables"]["links"]["Row"];

const LinkManager = ({ type }: { type: "nav" | "social" | "footer" }) => {
  const supabase = createClient();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    svg: "", // Hanya relevan untuk 'social'
    sort_order: 0,
    is_active: true,
  });

  const fetchLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("type", type)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching links:", error);
    } else {
      setLinks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, [type]);

  const resetForm = () => {
    setFormData({
      title: "",
      url: "",
      svg: "",
      sort_order: 0,
      is_active: true,
    });
    setEditingLink(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      type,
      sort_order: Number(formData.sort_order),
    };

    let result;
    if (editingLink) {
      result = await supabase
        .from("links")
        .update(payload)
        .eq("id", editingLink.id);
    } else {
      result = await supabase.from("links").insert(payload);
    }

    if (result.error) {
      alert("Gagal menyimpan link: " + result.error.message);
    } else {
      alert("Link berhasil disimpan!");
      resetForm();
      fetchLinks();
    }
    setSaving(false);
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      svg: link.svg || "",
      sort_order: link.sort_order,
      is_active: link.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus link ini?")) return;

    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus link: " + error.message);
    } else {
      alert("Link berhasil dihapus!");
      fetchLinks();
    }
  };

  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
          {editingLink
            ? "Edit Link"
            : `Tambah Link ${
                type === "nav"
                  ? "Navigasi"
                  : type === "social"
                  ? "Sosial Media"
                  : "Footer"
              }`}
        </h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judul Link
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {type === "social" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kode SVG
              </label>
              <textarea
                value={formData.svg}
                onChange={(e) =>
                  setFormData({ ...formData, svg: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary font-mono text-xs"
                placeholder="<svg>...</svg>"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urutan
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label
                htmlFor="is_active"
                className="ml-2 block text-sm text-gray-700"
              >
                Aktif
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : editingLink ? "Update" : "Tambah"}
            </button>
            {editingLink && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
          Daftar Link{" "}
          {type === "nav"
            ? "Navigasi"
            : type === "social"
            ? "Sosial Media"
            : "Footer"}
        </h4>
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {type === "social" && link.svg && (
                    <span
                      className="w-5 h-5 text-gray-600"
                      dangerouslySetInnerHTML={{ __html: link.svg }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{link.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {link.url}
                    </p>
                  </div>
                  {!link.is_active && (
                    <span className="text-xs text-red-500 font-semibold">
                      (Non-aktif)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(link)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {links.length === 0 && !loading && (
              <p className="text-center text-gray-500 py-4">Belum ada link.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkManager;
