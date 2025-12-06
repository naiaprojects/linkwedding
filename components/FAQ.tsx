"use client";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQData {
  title: string;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

const defaultFaqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "Berapa lama proses pembuatan undanganya kak ?",
    answer:
      "cepet banget, setelah data lengkap masuk pengerjaanya cuma butuh 1 - 3 hari aja",
  },
  {
    id: "faq-2",
    question: "Kalo mau revisi bisa ?",
    answer:
      "Tenang di linkwedding.id kamu bisa revisi sampai hari H, jadi jika ada data yang mau diubah tinggal chat admin saja",
  },
  {
    id: "faq-3",
    question: "Bisa pasang lagu favorite ngak sih ?",
    answer: "Bisa banget, kamu bisa pasang lagu favorite di undangan",
  },
  {
    id: "faq-4",
    question: "Bisa request desain sendiri ?",
    answer:
      "Mohon maaf saat ini linkwedding.id belum melayani custom undangan ya kak, desain undangan hanya yang tersedia di catalog",
  },
  {
    id: "faq-5",
    question: "Kalau ada kendala, siapa yang bantu ?",
    answer:
      "Tenang tim suport linkwedding.id siap bantu kendalamu sampai hari pernikahanmu",
  },
];

const FAQItem = ({ item }: { item: FAQItem }) => {
  return (
    <details className="group py-4">
      <summary className="flex items-center justify-between font-medium list-none cursor-pointer">
        <span>{item.question}</span>
        <span className="transition group-open:rotate-180">
          <svg
            className="dark:stroke-gray-400"
            fill="none"
            height="24"
            shapeRendering="geometricPrecision"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            width="24"
          >
            <path d="M6 9l6 6 6-6"></path>
          </svg>
        </span>
      </summary>
      <p className="text-base font-normal mt-3 text-slate-500 group-open:animate-fadeIn">
        {item.answer}
      </p>
    </details>
  );
};

const FAQ = ({ data }: { data: FAQData }) => {
  const faqItems = data?.faqs
    ? data.faqs.map((faq, index) => ({
      id: `faq-${index + 1}`,
      question: faq.question,
      answer: faq.answer,
    }))
    : defaultFaqItems;

  return (
    <section
      className="w-full max-w-4xl px-6 mx-auto py-12 lg:py-24 dark:bg-transparent dark:text-gray-200"
      id="faq"
    >
      <h3 className="mt-3 text-3xl sm:text-4xl font-bold text-primary text-center sm:text-left">
        {data?.title || "Frequently Asked Questions"}
      </h3>
      <div className="grid max-w-5xl mx-auto mt-6 lg:mt-8 divide-y divide-gray-200 dark:divide-gray-700 text-base text-slate-700">
        {faqItems.map((item) => (
          <FAQItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default FAQ;
