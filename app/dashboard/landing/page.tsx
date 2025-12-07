"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhotoIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const heroSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  stats: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional()
    .nullable(),
});

const featureSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  payment_methods: z
    .array(
      z.object({
        name: z.string(),
        image_url: z.string(),
        alt_text: z.string(),
      })
    )
    .optional()
    .nullable(),
});

const featuresSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  features: z
    .array(
      z.object({
        name: z.string(),
        icon: z.string().optional().nullable(),
      })
    )
    .optional()
    .nullable(),
});

const contactSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

const faqSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional()
    .nullable(),
});

type HeroForm = z.infer<typeof heroSchema>;
type FeatureForm = z.infer<typeof featureSchema>;
type FeaturesForm = z.infer<typeof featuresSchema>;
type ContactForm = z.infer<typeof contactSchema>;
type FAQForm = z.infer<typeof faqSchema>;

export default function LandingPagePage() {
  const [activeTab, setActiveTab] = useState("hero");
  const supabase = createClient() as any;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string>("");
  const [featureImageFile, setFeatureImageFile] = useState<File | null>(null);
  const [featureImagePreview, setFeatureImagePreview] = useState<string>("");
  const [sectionIds, setSectionIds] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ name: string; image_url: string; alt_text: string }>
  >([]);

  const {
    register: registerHero,
    handleSubmit: handleHeroSubmit,
    reset: resetHero,
    formState: { errors: heroErrors },
    trigger: triggerHeroValidation,
  } = useForm<HeroForm>({
    resolver: zodResolver(heroSchema),
    mode: "onChange",
  });

  const {
    register: registerFeature,
    handleSubmit: handleFeatureSubmit,
    reset: resetFeature,
    formState: { errors: featureErrors },
  } = useForm<FeatureForm>({
    resolver: zodResolver(featureSchema),
  });

  const {
    register: registerFeatures,
    handleSubmit: handleFeaturesSubmit,
    reset: resetFeatures,
    formState: { errors: featuresErrors },
  } = useForm<FeaturesForm>({
    resolver: zodResolver(featuresSchema),
  });

  const {
    register: registerContact,
    handleSubmit: handleContactSubmit,
    reset: resetContact,
    formState: { errors: contactErrors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    []
  );
  const {
    register: registerFAQ,
    handleSubmit: handleFAQSubmit,
    reset: resetFAQ,
    formState: { errors: faqErrors },
  } = useForm<FAQForm>({
    resolver: zodResolver(faqSchema),
  });

  useEffect(() => {
    const loadSections = async () => {
      try {
        const { data: sections, error } = await supabase
          .from("landing_page_sections")
          .select("*");

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (sections && sections.length > 0) {
          const ids: Record<string, string> = {};

          sections.forEach((section: any) => {
            ids[section.section_name] = section.id;

            if (section.section_name === "hero") {
              const heroData = section.section_data as HeroForm;
              resetHero(heroData);
              if (heroData.image_url) {
                setHeroImagePreview(heroData.image_url);
              }
              setTimeout(() => triggerHeroValidation(), 100);
            } else if (section.section_name === "feature") {
              const featureData = section.section_data as FeatureForm;
              resetFeature(featureData);
              if (featureData.image_url) {
                setFeatureImagePreview(featureData.image_url);
              }
              const dbPaymentMethods = featureData.payment_methods || (featureData as any).paymentMethods;
              if (dbPaymentMethods) {
                setPaymentMethods(dbPaymentMethods);
              }
            } else if (section.section_name === "features") {
              const featureData = section.section_data as FeaturesForm;
              resetFeatures(featureData);
            } else if (section.section_name === "contact") {
              const contactData = section.section_data as ContactForm;
              resetContact(contactData);
            } else if (section.section_name === "faq") {
              const faqData = section.section_data as FAQForm;
              resetFAQ(faqData);
              if (faqData.faqs && faqData.faqs.length > 0) {
                setFaqs(faqData.faqs);
              }
            }
          });

          setSectionIds(ids);
        }
      } catch (err: any) {
        console.error("Error loading sections:", err);
        alert("Gagal memuat data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSections();
  }, [
    supabase,
    resetHero,
    resetFeature,
    resetFeatures,
    resetContact,
    resetFAQ,
    triggerHeroValidation,
  ]);

  const onHeroSubmit = async (data: HeroForm) => {
    setSaving(true);
    try {
      let image_url = heroImagePreview || null;

      if (heroImageFile) {
        const timestamp = Date.now();
        const fileExt = heroImageFile.name.split(".").pop() || "png";
        const fileName = `hero-${timestamp}.${fileExt}`;
        const filePath = `hero-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("public")
          .upload(filePath, heroImageFile, {
            upsert: true,
            contentType: heroImageFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("public")
          .getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      const updateData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        section_name: "hero",
        section_data: {
          ...data,
          image_url,
        },
        updated_at: new Date().toISOString(),
      };

      let result: any;
      if (sectionIds.hero) {
        result = await supabase
          .from("landing_page_sections")
          .update(updateData)
          .eq("id", sectionIds.hero);
      } else {
        result = await supabase
          .from("landing_page_sections")
          .insert(updateData);
        if (result.data && result.data.length > 0) {
          setSectionIds((prev) => ({ ...prev, hero: result.data[0].id }));
        }
      }

      if (result.error) throw result.error;

      alert("Bagian Hero berhasil disimpan!");
    } catch (err: any) {
      console.error("Error detail:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const onFeatureSubmit = async (data: FeatureForm) => {
    setSaving(true);
    try {
      let image_url = featureImagePreview || null;

      if (featureImageFile) {
        const timestamp = Date.now();
        const fileExt = featureImageFile.name.split(".").pop() || "png";
        const fileName = `feature-${timestamp}.${fileExt}`;
        const filePath = `feature-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("public")
          .upload(filePath, featureImageFile, {
            upsert: true,
            contentType: featureImageFile.type,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("public")
          .getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }

      const updateData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        section_name: "feature",
        section_data: {
          ...data,
          image_url,
          payment_methods: paymentMethods,
        },
        updated_at: new Date().toISOString(),
      };

      let result: any;
      if (sectionIds.feature) {
        result = await supabase
          .from("landing_page_sections")
          .update(updateData)
          .eq("id", sectionIds.feature);
      } else {
        result = await supabase
          .from("landing_page_sections")
          .insert(updateData);
        if (result.data && result.data.length > 0) {
          setSectionIds((prev) => ({ ...prev, feature: result.data[0].id }));
        }
      }

      if (result.error) throw result.error;

      alert("Bagian Fitur berhasil disimpan!");
    } catch (err: any) {
      console.error("Error detail:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const onFeaturesSubmit = async (data: FeaturesForm) => {
    setSaving(true);
    try {
      const updateData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        section_name: "features",
        section_data: data,
        updated_at: new Date().toISOString(),
      };

      let result: any;
      if (sectionIds.features) {
        result = await supabase
          .from("landing_page_sections")
          .update(updateData)
          .eq("id", sectionIds.features);
      } else {
        result = await supabase
          .from("landing_page_sections")
          .insert(updateData);
        if (result.data && result.data.length > 0) {
          setSectionIds((prev) => ({ ...prev, features: result.data[0].id }));
        }
      }

      if (result.error) throw result.error;

      alert("Bagian Daftar Fitur berhasil disimpan!");
    } catch (err: any) {
      console.error("Error detail:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const onContactSubmit = async (data: ContactForm) => {
    setSaving(true);
    try {
      const updateData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        section_name: "contact",
        section_data: data,
        updated_at: new Date().toISOString(),
      };

      let result: any;
      if (sectionIds.contact) {
        result = await supabase
          .from("landing_page_sections")
          .update(updateData)
          .eq("id", sectionIds.contact);
      } else {
        result = await supabase
          .from("landing_page_sections")
          .insert(updateData);
        if (result.data && result.data.length > 0) {
          setSectionIds((prev) => ({ ...prev, contact: result.data[0].id }));
        }
      }

      if (result.error) throw result.error;

      alert("Bagian Kontak berhasil disimpan!");
    } catch (err: any) {
      console.error("Error detail:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const onFAQSubmit = async (data: FAQForm) => {
    setSaving(true);
    try {
      const updateData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        section_name: "faq",
        section_data: {
          ...data,
          faqs,
        },
        updated_at: new Date().toISOString(),
      };

      let result: any;
      if (sectionIds.faq) {
        result = await supabase
          .from("landing_page_sections")
          .update(updateData)
          .eq("id", sectionIds.faq);
      } else {
        result = await supabase
          .from("landing_page_sections")
          .insert(updateData);
        if (result.data && result.data.length > 0) {
          setSectionIds((prev) => ({ ...prev, faq: result.data[0].id }));
        }
      }

      if (result.error) throw result.error;

      alert("Bagian FAQ berhasil disimpan!");
    } catch (err: any) {
      console.error("Error detail:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeroImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setHeroImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeatureImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFeatureImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setFeatureImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const updateFAQ = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const addPaymentMethod = () => {
    setPaymentMethods([
      ...paymentMethods,
      { name: "", image_url: "", alt_text: "" },
    ]);
  };

  const updatePaymentMethod = (
    index: number,
    field: "name" | "image_url" | "alt_text",
    value: string
  ) => {
    if (index >= 0 && index < paymentMethods.length) {
      const newMethods = [...paymentMethods];
      newMethods[index][field] = value;
      setPaymentMethods(newMethods);
    }
  };

  const removePaymentMethod = (index: number) => {
    if (index >= 0 && index < paymentMethods.length) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
      <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-6 sm:mb-8">
        Landing Page
      </h3>

      <div className="border-b border-gray-200 mb-6 sm:mb-8 -mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
          {[
            { id: "hero", label: "Hero" },
            { id: "feature", label: "Kenapa" },
            { id: "features", label: "Fitur" },
            { id: "contact", label: "Kontak" },
            { id: "faq", label: "FAQ" },
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

      <div>
        {activeTab === "hero" && (
          <form onSubmit={handleHeroSubmit(onHeroSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Gambar Hero
              </h4>
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  {heroImagePreview ? (
                    <img
                      src={heroImagePreview}
                      alt="Hero image preview"
                      className="h-32 w-auto object-cover rounded"
                    />
                  ) : (
                    <div className="h-32 w-48 bg-gray-200 rounded flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Pilih gambar hero</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Upload gambar hero (PNG, JPG, SVG). Disarankan menggunakan
                gambar dengan aspek rasio 16:9.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Konten Hero
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    {...registerHero("subtitle")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerHero("title")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  {heroErrors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {heroErrors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    {...registerHero("description")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Statistik
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label 1
                    </label>
                    <input
                      {...registerHero("stats.0.label")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai 1
                    </label>
                    <input
                      {...registerHero("stats.0.value")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label 2
                    </label>
                    <input
                      {...registerHero("stats.1.label")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai 2
                    </label>
                    <input
                      {...registerHero("stats.1.value")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label 3
                    </label>
                    <input
                      {...registerHero("stats.2.label")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nilai 3
                    </label>
                    <input
                      {...registerHero("stats.2.value")}
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Bagian Hero"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "feature" && (
          <form
            onSubmit={handleFeatureSubmit(onFeatureSubmit)}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Gambar Fitur
              </h4>
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  {featureImagePreview ? (
                    <img
                      src={featureImagePreview}
                      alt="Feature image preview"
                      className="h-32 w-auto object-cover rounded"
                    />
                  ) : (
                    <div className="h-32 w-48 bg-gray-200 rounded flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Pilih gambar fitur</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeatureImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Upload gambar fitur (PNG, JPG, SVG). Disarankan menggunakan
                gambar dengan aspek rasio 16:9.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Konten Fitur
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul (Bagian 1)
                  </label>
                  <input
                    {...registerFeature("title")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  {featureErrors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {featureErrors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle (Bagian 2)
                  </label>
                  <input
                    {...registerFeature("subtitle")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    {...registerFeature("description")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Metode Pembayaran
                </h4>
                <button
                  type="button"
                  onClick={addPaymentMethod}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Tambah Metode
                </button>
              </div>
              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Metode {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePaymentMethod(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={method.name}
                        onChange={(e) =>
                          updatePaymentMethod(index, "name", e.target.value)
                        }
                        placeholder="Nama (contoh: Bank BCA)"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={method.image_url}
                        onChange={(e) =>
                          updatePaymentMethod(
                            index,
                            "image_url",
                            e.target.value
                          )
                        }
                        placeholder="URL Gambar"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={method.alt_text}
                        onChange={(e) =>
                          updatePaymentMethod(index, "alt_text", e.target.value)
                        }
                        placeholder="Alt Text"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Bagian Fitur"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "features" && (
          <form
            onSubmit={handleFeaturesSubmit(onFeaturesSubmit)}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Judul Bagian Fitur
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul
                </label>
                <input
                  {...registerFeatures("title")}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                {featuresErrors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {featuresErrors.title.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Daftar Fitur
              </h4>
              <div className="space-y-4">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-primary"
                        fill="currentColor"
                        height="20"
                        viewBox="0 0 20 20"
                        width="20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          clipRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <input
                        {...registerFeatures(`features.${index}.name`)}
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Bagian Daftar Fitur"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "contact" && (
          <form
            onSubmit={handleContactSubmit(onContactSubmit)}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Informasi Kontak
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul
                  </label>
                  <input
                    {...registerContact("title")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  {contactErrors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {contactErrors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    {...registerContact("description")}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...registerContact("email")}
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <input
                    {...registerContact("phone")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <input
                    {...registerContact("address")}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Bagian Kontak"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "faq" && (
          <form onSubmit={handleFAQSubmit(onFAQSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Judul Bagian FAQ
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul
                </label>
                <input
                  {...registerFAQ("title")}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                {faqErrors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {faqErrors.title.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  Daftar Pertanyaan
                </h4>
                <button
                  type="button"
                  onClick={addFAQ}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 flex items-center"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Tambah Pertanyaan
                </button>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Pertanyaan {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFAQ(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) =>
                          updateFAQ(index, "question", e.target.value)
                        }
                        placeholder="Pertanyaan"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                      <textarea
                        value={faq.answer}
                        onChange={(e) =>
                          updateFAQ(index, "answer", e.target.value)
                        }
                        placeholder="Jawaban"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Bagian FAQ"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
