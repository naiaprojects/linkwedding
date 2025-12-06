"use client";

interface FeatureData {
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  payment_methods?: Array<{
    name: string;
    image_url: string;
    alt_text: string;
  }>;
}

const Feature = ({ data }: { data: FeatureData }) => {
  const defaultPaymentMethods = [
    {
      name: "Bank BCA",
      image_url:
        "https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg",
      alt_text: "Bank BCA",
    },
    {
      name: "Bank Mandiri",
      image_url:
        "https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg",
      alt_text: "Bank Mandiri",
    },
    {
      name: "Bank BRI",
      image_url:
        "https://upload.wikimedia.org/wikipedia/commons/5/59/BRI_2025.svg",
      alt_text: "Bank BRI",
    },
    {
      name: "Dana",
      image_url:
        "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg",
      alt_text: "Dana",
    },
    {
      name: "Ovo",
      image_url:
        "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg",
      alt_text: "Ovo",
    },
  ];

  const paymentMethods = data?.payment_methods || defaultPaymentMethods;

  return (
    <section className="max-w-7xl px-6 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto flex flex-col-reverse lg:flex-row-reverse items-center gap-10">
      <div className="w-full lg:w-7/12">
        <div className="container mx-auto h-full">
          <div className="flex items-center h-full">
            <div className="w-full">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-primary">
                {data?.title || "Kenapa harus di"}{" "}
                <span className="text-secondary">
                  {data?.subtitle || "linkwedding.id?"}
                </span>
              </h1>
              <div className="w-20 h-2 bg-secondary my-4"></div>

              <p className="text-base sm:text-xl mb-10 text-primary">
                {data?.description ||
                  "Mudah diakses, hemat biaya, dan banyak metode pembayarannya!"}
              </p>

              <div className="mt-8 lg:mt-12 flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:opacity-60 dark:invert dark:hover:invert-0"
                    >
                      <img
                        alt={method.alt_text}
                        className="h-6 sm:h-7 w-auto"
                        src={method.image_url}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-5/12">
        {data?.image_url ? (
          <img
            alt="Fitur Linkwedding"
            className="w-full h-auto object-contain"
            src={data.image_url}
            title="Fitur Linkwedding"
          />
        ) : (
          <img
            alt="Fitur Linkwedding"
            className="w-full h-auto object-contain"
            src="https://wp.envelope.id/wp-content/uploads/2025/11/LP-V2-3.webp"
            title="Fitur Linkwedding"
          />
        )}
      </div>
    </section>
  );
};

export default Feature;
