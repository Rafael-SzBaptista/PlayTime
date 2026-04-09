import Navbar from "@/components/landing/Navbar";
import PlatformHighlights from "@/components/landing/PlatformHighlights";
import Footer from "@/components/landing/Footer";

const PorqueNos = () => {
  return (
    <div className="mesh-bg min-h-screen">
      <Navbar />
      <main className="-mt-4 sm:-mt-6">
        <PlatformHighlights />
      </main>
      <Footer />
    </div>
  );
};

export default PorqueNos;
