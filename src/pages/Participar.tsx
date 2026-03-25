import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Participar = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const extractSlug = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (trimmed.includes("/evento/")) {
      const [_, afterEvento] = trimmed.split("/evento/");
      return (afterEvento ?? "").split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
    }

    return trimmed.replace(/^\/+|\/+$/g, "");
  };

  const handleJoin = () => {
    const slug = extractSlug(code);
    if (!slug) {
      toast.error("Cole um link válido do evento");
      return;
    }

    navigate(`/evento/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">🎟️</div>
          <h1 className="text-3xl font-bold mb-2">Participar de um Jogo</h1>
          <p className="text-muted-foreground mb-8">
            Cole o link do evento para participar
          </p>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cole o link do evento"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-14 text-base"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <Button variant="hero" size="xl" className="w-full" onClick={handleJoin}>
              Entrar no Jogo
            </Button>
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-2xl">
            <h3 className="font-display font-semibold mb-2">Como participar?</h3>
            <ol className="text-sm text-muted-foreground space-y-2 text-left">
              <li>1. Peça o link do evento ao organizador</li>
              <li>2. Cole o link acima</li>
            </ol>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Participar;
