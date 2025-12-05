"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { Product } from "@/types/product";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  description: z.string().optional(),
  price: z.string().min(1, "Harga wajib diisi"),
  category: z.string().optional(),
  brand: z.string().optional(),
  demo_url: z.string().optional(),
  order_url: z.string().optional(),
  stock_status: z.enum(["in_stock", "out_of_stock"]).default("in_stock"),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;

        if (data) {
          reset({
            name: data.name,
            description: data.description || "",
            price: data.price.toString(),
            category: data.category || "",
            brand: data.brand || "",
            demo_url: data.demo_url || "",
            order_url: data.order_url || "",
            stock_status: data.stock_status,
          });

          if (data.image_url) {
            setImagePreview(data.image_url);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Gagal memuat data produk. Silakan coba lagi.");
        router.push("/dashboard/products");
      } finally {
        setFetchingProduct(false);
      }
    };

    fetchProduct();
  }, [params.id, supabase, router, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploadingImage(true);
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    setLoading(true);
    try {
      let image_url = imagePreview || null;

      if (imageFile) {
        image_url = await uploadImageToImgBB(imageFile);
      }

      const { error } = await supabase
        .from("products")
        .update({
          ...data,
          price: parseFloat(data.price),
          image_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (error) throw error;

      alert("Produk berhasil diperbarui!");
      router.push("/dashboard/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      alert("Gagal memperbarui produk: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
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
    <div className="container mx-auto px-6 py-8">
      <h3 className="text-3xl font-bold text-primary mb-8">Edit Produk</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Gambar Produk
          </h4>
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product image preview"
                  className="h-32 w-auto object-cover rounded"
                />
              ) : (
                <div className="h-32 w-48 bg-gray-200 rounded flex items-center justify-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <label className="block">
              <span className="sr-only">Pilih gambar produk</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Upload gambar produk (PNG, JPG, SVG). Disarankan menggunakan gambar
            dengan aspek rasio 16:9.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Informasi Produk
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Produk
              </label>
              <input
                {...register("name")}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga
                </label>
                <input
                  {...register("price")}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <input
                  {...register("category")}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  {...register("brand")}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Stok
                </label>
                <select
                  {...register("stock_status")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Demo
                </label>
                <input
                  {...register("demo_url")}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Pemesanan
                </label>
                <input
                  {...register("order_url")}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || uploadingImage}
            className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading || uploadingImage ? "Menyimpan..." : "Perbarui Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
