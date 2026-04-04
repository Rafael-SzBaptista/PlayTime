import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="mesh-bg">
      {/* Só Navbar + Hero entram na 1.ª vista; o rodapé fica abaixo do limiar (scroll) */}
      <div className="flex min-h-[100dvh] flex-col">
        <Navbar />
        <Hero />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
