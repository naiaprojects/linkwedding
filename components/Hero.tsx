"use client";

interface HeroData {
  subtitle?: string;
  title: string;
  description?: string;
  image_url?: string;
  stats?: Array<{
    label: string;
    value: string;
  }>;
}

const Hero = ({ data }: { data: HeroData | undefined }) => {
  const defaultStats = [
    { label: "Pengguna", value: "21" },
    { label: "Undangan Dibuat", value: "17" },
    { label: "Ucapan Dikirim", value: "24" },
  ];

  const stats = data?.stats || defaultStats;

  return (
    <section
      className="z-0 relative max-w-7xl px-4 sm:px-0 py-24 mx-auto flex flex-wrap h-screen"
      id="hero"
    >
      <div className="w-full sm:w-7/12 mb-10">
        <div className="container mx-auto h-full sm:p-10">
          <div className="container px-4 lg:flex items-center h-full lg:mt-0">
            <div className="w-full">
              <nav className="flex justify-between items-center mb-12">
                <div className="text-3xl sm:text-3xl font-bold text-primary">
                  {data?.subtitle || "Linkwedding.id"}
                </div>
              </nav>

              <h1 className="text-4xl lg:text-6xl font-bold text-primary leading-tight">
                <span className="text-secondary">
                  {data?.title || "Kirim Undangan Gak Perlu Ribet lagi"}
                </span>
              </h1>
              <div className="w-20 h-2 bg-secondary my-4"></div>

              <p className="text-xl mb-10 text-primary">
                {data?.description ||
                  "Karena linkwedding.id menghadirkan solusi undangan pernikahan berbasis website yang nggak cuma keren, tapi juga sangat praktis."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full min-w-0">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex flex-col px-6 py-4 bg-white shadow hover:shadow hover:shadow-primary rounded-lg overflow-hidden"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-3xl font-bold tracking-tight leading-none text-primary">
                        {stat.value}
                      </div>
                      <div className="text-md font-medium text-primary">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full sm:w-5/12">
        {data?.image_url ? (
          <img
            alt="Wedding Invitation Mockup"
            className="w-full"
            src={data.image_url}
            title="Wedding Invitation Mockup"
          />
        ) : (
          <img
            alt="Wedding Invitation Mockup"
            className="w-full"
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj6UXpz-iGk4lHnEtxDllUepxJbEcmPAc3SwUk2SUVeEZObY49wOeMdYHMl0dhFXfuxagAAo-IHJEdOmvk9jMe9VsT6wtQcS50YK_UYcxYIdatVKvnvfT-9IlIYSnrwb0AFD3ar4isVnQQAMIc5vYlZRltrOAlTm8J4pVNuHMd9-H9bbysKLdadJRdTGEPX/s1920/Mockup.png"
            title="Wedding Invitation Mockup"
          />
        )}
      </div>
    </section>
  );
};

export default Hero;
