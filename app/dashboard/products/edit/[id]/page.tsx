"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { PhotoIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const packageSchema = z.object({
    name: z.string().min(1, "Nama paket wajib diisi"),
    price: z.string().min(1, "Harga wajib diisi"),
    undangan: z.string().optional(),
    foto: z.string().optional(),
    video: z.string().optional(),
    share: z.string().optional(),
});

const productSchema = z.object({
    name: z.string().min(1, "Nama produk wajib diisi"),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    jenis: z.string().optional().nullable(),
    design: z.string().optional().nullable(),
    demo_url: z.string().optional().nullable(),
    packages: z.array(packageSchema).min(1, "Minimal 1 paket wajib diisi"),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EditProductPage() {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [existingImageUrl, setExistingImageUrl] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
    } = useForm<ProductForm>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            packages: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "packages",
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", productId)
                    .single();

                if (error) throw error;

                if (data) {
                    const packagesData = (data.packages || []).map((pkg: any) => ({
                        name: pkg.name || "",
                        price: pkg.price?.toString() || "",
                        undangan: pkg.undangan || "",
                        foto: pkg.foto || "",
                        video: pkg.video || "",
                        share: pkg.share || "",
                    }));

                    reset({
                        name: data.name,
                        description: data.description || "",
                        category: data.category || "",
                        jenis: data.jenis || "",
                        design: data.design || "",
                        demo_url: data.demo_url || "",
                        packages: packagesData.length > 0 ? packagesData : [
                            { name: "Basic", price: "", undangan: "", foto: "", video: "", share: "" }
                        ],
                    });

                    if (data.image_url) {
                        setExistingImageUrl(data.image_url);
                        setImagePreview(data.image_url);
                    }
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                alert("Gagal memuat data produk");
                router.push("/dashboard/products");
            } finally {
                setInitialLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId, supabase, reset, router]);

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

    const uploadImageToSupabase = async (file: File): Promise<string> => {
        try {
            setUploadingImage(true);

            const timestamp = Date.now();
            const fileExt = file.name.split(".").pop() || "png";
            const fileName = `product-${timestamp}.${fileExt}`;
            const filePath = `products/${fileName}`;

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
            let image_url = existingImageUrl || null;

            if (imageFile) {
                image_url = await uploadImageToSupabase(imageFile);
            }

            const packagesData = data.packages.map((pkg) => ({
                name: pkg.name,
                price: parseFloat(pkg.price),
                undangan: pkg.undangan || "",
                foto: pkg.foto || "",
                video: pkg.video || "",
                share: pkg.share || "",
            }));

            const { error } = await supabase
                .from("products")
                .update({
                    name: data.name,
                    description: data.description || null,
                    category: data.category || null,
                    jenis: data.jenis || null,
                    design: data.design || null,
                    demo_url: data.demo_url || null,
                    packages: packagesData,
                    image_url,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

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

    if (initialLoading) {
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
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = "/placeholder-product.png";
                                    }}
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
                                placeholder="Contoh: Floral 9"
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
                                placeholder="Contoh: Undangan Website Special Edition - Floral"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jenis
                                </label>
                                <input
                                    {...register("jenis")}
                                    type="text"
                                    placeholder="Contoh: Undangan website"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kategori
                                </label>
                                <input
                                    {...register("category")}
                                    type="text"
                                    placeholder="Contoh: Special Edition"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Design
                                </label>
                                <input
                                    {...register("design")}
                                    type="text"
                                    placeholder="Contoh: Floral"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL Demo
                            </label>
                            <input
                                {...register("demo_url")}
                                type="url"
                                placeholder="https://..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                            Paket Harga
                        </h4>
                        <button
                            type="button"
                            onClick={() =>
                                append({
                                    name: "",
                                    price: "",
                                    undangan: "",
                                    foto: "Max 12 foto",
                                    video: "1 Video embed",
                                    share: "Shareable",
                                })
                            }
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Tambah Paket
                        </button>
                    </div>

                    {errors.packages && (
                        <p className="mb-4 text-sm text-red-600">{errors.packages.message}</p>
                    )}

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="p-4 border border-gray-200 rounded-xl bg-gray-50"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-medium text-gray-700">
                                        Paket {index + 1}
                                    </h5>
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Nama Paket
                                        </label>
                                        <input
                                            {...register(`packages.${index}.name`)}
                                            type="text"
                                            placeholder="Basic / Plus / Unlimited"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Harga
                                        </label>
                                        <input
                                            {...register(`packages.${index}.price`)}
                                            type="number"
                                            placeholder="129000"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Undangan
                                        </label>
                                        <input
                                            {...register(`packages.${index}.undangan`)}
                                            type="text"
                                            placeholder="100 undangan"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Foto
                                        </label>
                                        <input
                                            {...register(`packages.${index}.foto`)}
                                            type="text"
                                            placeholder="Max 12 foto"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Video
                                        </label>
                                        <input
                                            {...register(`packages.${index}.video`)}
                                            type="text"
                                            placeholder="1 Video embed"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Share
                                        </label>
                                        <input
                                            {...register(`packages.${index}.share`)}
                                            type="text"
                                            placeholder="Shareable"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
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
