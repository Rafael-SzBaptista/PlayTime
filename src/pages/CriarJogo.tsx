import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const gameTypes = [
  { id: "amigo-secreto", emoji: "🤫", name: "Amigo Secreto" },
  { id: "rouba-presente", emoji: "🏴‍☠️", name: "Rouba Presente" },
  { id: "bingo-presentes", emoji: "🎱", name: "Bingo de Presentes" },
];

const CriarJogo = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [eventName, setEventName] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [exchangeDate, setExchangeDate] = useState("");
  const [rules, setRules] = useState("");
  const [allowSuggestions, setAllowSuggestions] = useState(true);
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

  const slug = eventName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const eventLink = `${window.location.origin}/evento/${createdSlug || slug || "meu-evento"}`;

  const selectedGameType = gameTypes.find((t) => t.id === selectedType);
  const usesSingleEventDate =
    selectedType === "rouba-presente" || selectedType === "bingo-presentes";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !eventName) {
      toast.error("Preencha o nome e escolha o tipo de jogo!");
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
      allow_suggestions: allowSuggestions,
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
            <p className="text-muted-foreground">
              Compartilhe o link abaixo com os participantes:
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <code className="flex-1 text-sm truncate">{eventLink}</code>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="hero" size="lg" onClick={() => navigate(`/evento/${createdSlug}`)}>
                Ver Evento
              </Button>
              <Button variant="festiveOutline" size="lg" onClick={() => {
                setCreated(false);
                setEventName("");
                setSelectedType("");
                setMinValue("");
                setMaxValue("");
                setEventDate("");
                setDrawDate("");
                setExchangeDate("");
                setRules("");
                setCreatedSlug("");
              }}>
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
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Criar Novo Jogo</h1>
            <p className="text-muted-foreground">Configure sua troca de presentes em minutos</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-8">
            <div>
              <Label className="text-base font-display font-semibold mb-3 block">Tipo de Jogo</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gameTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      selectedType === type.id
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.emoji}</div>
                    <div className="text-sm font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="eventName" className="text-base font-display font-semibold">Nome do Evento</Label>
              <Input id="eventName" placeholder="Ex: Natal da Empresa 2026" value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-2 h-12" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minValue" className="font-display font-semibold">Valor Mínimo (R$)</Label>
                <Input id="minValue" type="number" placeholder="20" value={minValue} onChange={(e) => setMinValue(e.target.value)} className="mt-2 h-12" />
              </div>
              <div>
                <Label htmlFor="maxValue" className="font-display font-semibold">Valor Máximo (R$)</Label>
                <Input id="maxValue" type="number" placeholder="50" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} className="mt-2 h-12" />
              </div>
            </div>

            {usesSingleEventDate ? (
              <div>
                <Label htmlFor="eventDate" className="font-display font-semibold">Data do Evento</Label>
                <Input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-2 h-12" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="drawDate" className="font-display font-semibold">Data do Sorteio</Label>
                  <Input id="drawDate" type="date" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} className="mt-2 h-12" />
                </div>
                <div>
                  <Label htmlFor="exchangeDate" className="font-display font-semibold">Data da Troca</Label>
                  <Input id="exchangeDate" type="date" value={exchangeDate} onChange={(e) => setExchangeDate(e.target.value)} className="mt-2 h-12" />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="rules" className="font-display font-semibold">Regras do Jogo</Label>
              <Textarea id="rules" placeholder="Ex: Não vale presente usado." value={rules} onChange={(e) => setRules(e.target.value)} className="mt-2 min-h-[100px]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <div>
                <p className="font-display font-semibold text-sm">Sugestões de Presentes</p>
                <p className="text-muted-foreground text-xs">Participantes podem adicionar sugestões</p>
              </div>
              <Switch checked={allowSuggestions} onCheckedChange={setAllowSuggestions} />
            </div>

            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={saving}>
              <Gift className="w-5 h-5" />
              {saving ? "Criando..." : "Criar Jogo"}
            </Button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default CriarJogo;
