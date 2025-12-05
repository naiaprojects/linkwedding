// app/dashboard/profile/page.tsx

"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// === VALIDASI FORM ===
const profileSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(6, "Minimal 6 karakter"),
    new_password: z.string().min(6, "Password baru minimal 6 karakter"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Password tidak cocok",
    path: ["confirm_password"],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// === HALAMAN PROFIL ===
export default function ProfilePage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form Profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Form Password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // === MUAT DATA USER & PROFIL ===
  useEffect(() => {
    const loadUser = async () => {
      // 1. Ambil user dari Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log("Tidak ada user login");
        setLoading(false);
        return;
      }

      setUser(user);

      // 2. Ambil data dari tabel `profiles`
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.log("Error ambil profil:", profileError);
      }

      if (profileData) {
        setProfile(profileData);
        resetProfile({
          full_name: profileData.full_name || "",
          email: user.email || "",
        });
        setAvatarUrl(profileData.avatar_url || null);
      } else {
        // Jika belum ada profil, buat otomatis
        const newProfile = {
          id: user.id,
          email: user.email,
          role: user.email === "linkweddinng@gmail.com" ? "admin" : "user",
          full_name: "Pengguna Baru",
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert(newProfile);

        if (!insertError) {
          resetProfile({
            full_name: newProfile.full_name,
            email: user.email || "",
          });
        }
      }

      setLoading(false);
    };

    loadUser();
  }, [supabase, resetProfile]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!user) return;
    setUpdating(true);

    try {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: data.full_name,
        email: data.email,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      if (data.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: data.email,
        });
        if (authError) throw authError;
      }

      alert("Profil berhasil diperbarui!");
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();
      setUser(updatedUser);
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      });
      if (error) throw error;
      alert("Kata sandi berhasil diubah!");
      resetPassword();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`; // WAJIB: user.id dulu
    const filePath = fileName; // Simpan di root bucket

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Gagal upload: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      alert("Gagal update avatar: " + updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      alert("Foto profil berhasil diubah!");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container px-6 py-8 mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded-2xl"></div>
              <div className="h-48 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container px-6 py-8 mx-auto">
        <h3 className="text-3xl font-bold text-primary mb-8">Profil Saya</h3>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto w-32 h-32 relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg"
                >
                  <PhotoIcon className="w-5 h-5" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <h4 className="mt-4 text-xl font-semibold text-gray-800">
                {profile?.full_name || "Pengguna"}
              </h4>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {profile?.role === "admin" ? "Administrator" : "Pengguna"}
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Informasi Pribadi
              </h4>
              <form
                onSubmit={handleSubmitProfile(onSubmitProfile)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    {...registerProfile("full_name")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {profileErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.full_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    {...registerProfile("email")}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {updating ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <LockClosedIcon className="w-5 h-5 text-primary" />
                Ganti Kata Sandi
              </h4>
              <form
                onSubmit={handleSubmitPassword(onSubmitPassword)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kata Sandi Saat Ini
                  </label>
                  <input
                    {...registerPassword("current_password")}
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    {...registerPassword("new_password")}
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {passwordErrors.new_password && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.new_password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi
                  </label>
                  <input
                    {...registerPassword("confirm_password")}
                    type="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {passwordErrors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirm_password.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-secondary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {updating ? "Mengubah..." : "Ubah Kata Sandi"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
