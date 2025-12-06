"use client";

import { useState } from "react";
import {
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

interface ContactData {
  title: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const Contact = ({ data }: { data: ContactData }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tel: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Form submitted successfully!");
  };

  return (
    <section className="relative flex items-top justify-center py-12 lg:py-24 my-12 lg:my-24 bg-gradient-to-r from-primary/30 to-primary sm:items-center sm:pt-4">
      <div className="max-w-6xl mx-auto px-8 sm:px-6 lg:px-8 my-6 lg:my-12 w-full">
        <div className="mt-4 lg:mt-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-0">
            <div className="p-6 mr-0 md:mr-2 bg-white rounded-2xl shadow-md">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-primary">
                {data?.title || "Hubungi Kami"}
              </h1>
              <p className="text-base sm:text-lg mb-6 lg:mb-10 text-primary mt-4">
                {data?.description ||
                  "Isi form untuk memulai percakapan dengan kami"}
              </p>

              <div className="flex items-center mt-6 lg:mt-8 text-slate-600">
                <MapPinIcon className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="ml-2 text-sm sm:text-md tracking-wide font-semibold">
                  {data?.address || "Yogyakarta, Indonesia"}
                </div>
              </div>

              <div className="flex items-center mt-4 text-slate-600">
                <DevicePhoneMobileIcon className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="ml-2 text-sm sm:text-md tracking-wide font-semibold">
                  {data?.phone || "+6289524556302"}
                </div>
              </div>

              <div className="flex items-center mt-2 text-slate-600">
                <EnvelopeIcon className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="ml-2 text-sm sm:text-md tracking-wide font-semibold">
                  {data?.email || "info@acme.org"}
                </div>
              </div>
            </div>

            <form
              className="mt-4 md:mt-0 md:p-6 flex flex-col justify-center"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col">
                <label htmlFor="name" className="hidden">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Nama Lengkap anda..."
                  className="w-full mt-2 py-3 px-3 rounded-lg bg-white border text-slate-800 focus:border-secondary focus:outline-none shadow focus:shadow focus:shadow-secondary"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col mt-2">
                <label htmlFor="email" className="hidden">
                  Alamat Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Alamat Email anda..."
                  className="w-full mt-2 py-3 px-3 rounded-lg bg-white border text-slate-800 focus:border-secondary focus:outline-none shadow focus:shadow focus:shadow-secondary"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex flex-col mt-2">
                <label htmlFor="tel" className="hidden">
                  No Whatsapp
                </label>
                <input
                  type="tel"
                  name="tel"
                  id="tel"
                  placeholder="No Whatsapp anda..."
                  className="w-full mt-2 py-3 px-3 rounded-lg bg-white border text-slate-800 focus:border-secondary focus:outline-none shadow focus:shadow focus:shadow-secondary"
                  value={formData.tel}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-secondary hover:bg-secondary-dark text-white font-bold py-3 px-6 rounded-lg mt-3 transition ease-in-out duration-300 w-full md:w-auto self-start"
              >
                Kirim Pesan
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
