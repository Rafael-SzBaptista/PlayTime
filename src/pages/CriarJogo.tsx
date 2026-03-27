import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft, Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const gameTypes = [
  { id: "amigo-secreto", emoji: "🤫", name: "Amigo Secreto" },
  { id: "rouba-presente", emoji: "🏴‍☠️", name: "Rouba Presente" },
  { id: "bingo-presentes", emoji: "🎱", name: "Bingo de Presentes" },
] as const;

const VALID_IDS = new Set<string>(gameTypes.map((g) => g.id));

const CARD_IMAGES: Record<
  (typeof gameTypes)[number]["id"],
  { src: string; alt: string }
> = {
  "amigo-secreto": {
    src: "/card-amigo-secreto.png",
    alt: "Amigo Secreto — abrir configuração do jogo",
  },
  "rouba-presente": {
    src: "/card-rouba-presente.png",
    alt: "Rouba Presente — abrir configuração do jogo",
  },
  "bingo-presentes": {
    src: "/card-bingo-presentes.png",
    alt: "Bingo de Presentes — abrir configuração do jogo",
  },
};

const CriarJogo = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const selectedType = useMemo(() => {
    if (tipo && VALID_IDS.has(tipo)) return tipo;
    return "";
  }, [tipo]);

  const [eventName, setEventName] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [exchangeDate, setExchangeDate] = useState("");
  const [rules, setRules] = useState("");
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Você precisa estar logado para criar um jogo");
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (tipo && !VALID_IDS.has(tipo)) {
      navigate("/criar-jogo", { replace: true });
    }
  }, [tipo, navigate]);

  const slug = eventName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const eventLink = `${window.location.origin}/evento/${createdSlug || slug || "meu-evento"}`;

  const selectedGameType = gameTypes.find((t) => t.id === selectedType);
  const usesSingleEventDate =
    selectedType === "rouba-presente" || selectedType === "bingo-presentes";

  const showForm = Boolean(selectedType);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !eventName) {
      toast.error("Preencha o nome do evento!");
      return;
    }
    if (!user) {
      toast.error("Você precisa estar logado!");
      navigate("/login");
      return;
    }

    setSaving(true);

    const finalSlug = slug + "-" + Date.now().toString(36);

    const { error } = await supabase.from("games").insert({
      owner_id: user.id,
      slug: finalSlug,
      name: eventName,
      game_type: selectedGameType?.name ?? selectedType,
      emoji: selectedGameType?.emoji ?? "🎁",
      min_value: minValue ? parseInt(minValue) : null,
      max_value: maxValue ? parseInt(maxValue) : null,
      draw_date: usesSingleEventDate ? (eventDate || null) : (drawDate || null),
      exchange_date: usesSingleEventDate ? (eventDate || null) : (exchangeDate || null),
      rules: rules || null,
      allow_suggestions: true,
    });

    setSaving(false);

    if (error) {
      toast.error("Erro ao criar jogo: " + error.message);
      return;
    }

    setCreatedSlug(finalSlug);
    setCreated(true);
    toast.success("🎉 Jogo criado com sucesso!");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(eventLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetFormAndGoToPicker = () => {
    setCreated(false);
    setEventName("");
    setMinValue("");
    setMaxValue("");
    setEventDate("");
    setDrawDate("");
    setExchangeDate("");
    setRules("");
    setCreatedSlug("");
    navigate("/criar-jogo");
  };

  if (created) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-lg text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold">Jogo Criado!</h1>
            <p className="text-muted-foreground">Compartilhe o link abaixo com os participantes:</p>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <code className="flex-1 text-sm truncate">{eventLink}</code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="hero" size="lg" onClick={() => navigate(`/evento/${createdSlug}`)}>
                Ver Evento
              </Button>
              <Button variant="festiveOutline" size="lg" onClick={resetFormAndGoToPicker}>
                Criar outro jogo
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-[min(100%,90rem)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {!showForm ? (
            <>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Criar novo jogo</h1>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">100% gratuito</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Fácil</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Rápido</span>
                </div>
              </div>
              <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-center gap-10 xl:grid-cols-3 xl:gap-8">
                {gameTypes.map((type, i) => {
                  const card = CARD_IMAGES[type.id];
                  return (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex min-h-[440px] items-center justify-center bg-transparent py-6 sm:min-h-[460px]"
                    >
                      <motion.button
                        type="button"
                        onClick={() => navigate(`/criar-jogo/${type.id}`)}
                        aria-label={`Configurar ${type.name}`}
                        className="group relative m-0 border-0 bg-transparent p-0 shadow-none transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:scale-[1.03] active:scale-[0.98]"
                      >
                        <motion.img
                          src={card.src}
                          alt={card.alt}
                          width={440}
                          height={440}
                          draggable={false}
                          className="block h-auto w-[min(100%,440px)] max-h-[28rem] object-contain select-none drop-shadow-[0_20px_40px_-10px_hsl(356_40%_24%_/_0.38)]"
                          animate={{ y: [0, -24, 0] }}
                          transition={{
                            duration: 3.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.12,
                          }}
                        />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 pl-0 sm:pl-44 md:pl-48">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                  <Link to="/criar-jogo">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Escolher outro modo
                  </Link>
                </Button>
                <div className="flex items-center gap-3 mb-2">
                  {selectedType && CARD_IMAGES[selectedType as keyof typeof CARD_IMAGES] ? (
                    <img
                      src={CARD_IMAGES[selectedType as keyof typeof CARD_IMAGES].src}
                      alt=""
                      width={128}
                      height={112}
                      className="h-28 w-auto object-contain shrink-0"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-4xl" aria-hidden>
                      {selectedGameType?.emoji}
                    </span>
                  )}
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Configurar {selectedGameType?.name}</h1>
                    <p className="text-sm text-muted-foreground">Preencha os dados do evento e crie o jogo</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-8">
                <div>
                  <Label htmlFor="eventName" className="text-base font-display font-semibold">
                    Nome do evento
                  </Label>
                  <Input
                    id="eventName"
                    placeholder="Ex: Natal da Empresa 2026"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="mt-2 h-12"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="minValue" className="font-display font-semibold">
                      Valor mínimo (R$)
                    </Label>
                    <Input
                      id="minValue"
                      type="number"
                      placeholder="20"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxValue" className="font-display font-semibold">
                      Valor máximo (R$)
                    </Label>
                    <Input
                      id="maxValue"
                      type="number"
                      placeholder="50"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>
                </div>

                {usesSingleEventDate ? (
                  <div>
                    <Label htmlFor="eventDate" className="font-display font-semibold">
                      Data do evento
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="mt-2 h-12"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="drawDate" className="font-display font-semibold">
                        Data do sorteio
                      </Label>
                      <Input
                        id="drawDate"
                        type="date"
                        value={drawDate}
                        onChange={(e) => setDrawDate(e.target.value)}
                        className="mt-2 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="exchangeDate" className="font-display font-semibold">
                        Data da troca
                      </Label>
                      <Input
                        id="exchangeDate"
                        type="date"
                        value={exchangeDate}
                        onChange={(e) => setExchangeDate(e.target.value)}
                        className="mt-2 h-12"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="rules" className="font-display font-semibold">
                    Regras do jogo
                  </Label>
                  <Textarea
                    id="rules"
                    placeholder="Ex: Não vale presente usado."
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={saving}>
                  <Gift className="w-5 h-5" />
                  {saving ? "Criando..." : "Criar jogo"}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default CriarJogo;
