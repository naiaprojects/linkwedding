"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Feature from "@/components/Feature";
import FeatureList from "@/components/FeatureList";
import Products from "@/components/Products";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import LogoLoader from "@/components/LogoLoader";

export default function HomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [heroData, setHeroData] = useState<any>(null);
  const [featureData, setFeatureData] = useState<any>(null);
  const [featureListData, setFeatureListData] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [faqData, setFaqData] = useState<any>(null);

  useEffect(() => {
    const loadSections = async () => {
      try {
        setLoading(true);

        const { data: sections, error } = await supabase
          .from("landing_page_sections")
          .select("*")
          .returns<any[]>();

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (sections && sections.length > 0) {
          sections.forEach((section) => {
            if (section.section_name === "hero") {
              setHeroData(section.section_data);
            } else if (section.section_name === "feature") {
              setFeatureData(section.section_data);
            } else if (section.section_name === "features") {
              setFeatureListData(section.section_data);
            } else if (section.section_name === "contact") {
              setContactData(section.section_data);
            } else if (section.section_name === "faq") {
              setFaqData(section.section_data);
            }
          });
        }
      } catch (err: any) {
        console.error("Error loading sections:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LogoLoader className="w-32 h-32" />
      </div>
    );
  }

  return (
    <div>
      <Hero data={heroData} />
      <Feature data={featureData} />
      <FeatureList data={featureListData} />
      <Products />
      <Contact data={contactData} />
      <FAQ data={faqData} />
    </div>
  );
}
