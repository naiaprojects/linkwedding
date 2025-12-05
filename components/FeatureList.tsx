"use client";

interface FeatureData {
  title: string;
  features?: Array<{
    name: string;
    icon?: string;
  }>;
}

const FeatureList = ({ data }: { data: FeatureData }) => {
  const defaultFeatures = [
    { name: "Unlimited Guests" },
    { name: "Photo Gallery & Background" },
    { name: "Live Streaming" },
    { name: "RSVP & Wedding Wishes" },
    { name: "Countdown Timer" },
    { name: "Wedding Gift" },
    { name: "Backsound Music" },
    { name: "Prewedding Video" },
    { name: "Dresscode" },
    { name: "Maps" },
    { name: "Save The Date" },
    { name: "Love Story" },
  ];

  const features = data?.features || defaultFeatures;

  return (
    <section className="max-w-7xl mx-auto w-full py-24 px-8" id="featurelist">
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-6xl font-bold text-primary mb-8">
          {data?.title || "Fitur"}{" "}
          <span className="text-secondary">Unggulan</span>
        </h1>
        <div className="w-20 h-2 bg-primary my-4 mx-auto"></div>
      </div>

      <ul className="flex flex-wrap text-sm font-medium text-gray-700 sm:text-base md:mx-auto md:max-w-5xl mt-8 pt-12">
        {features.map((feature, index) => (
          <li key={index} className="my-4 flex w-1/2 md:w-1/3 items-center">
            <svg
              className="mr-2 flex-shrink-0 text-primary"
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
            {feature.name}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default FeatureList;
