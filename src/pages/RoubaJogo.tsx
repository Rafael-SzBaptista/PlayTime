import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft, Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type RuntimeState,
  createInitialRuntimeState,
  loadRuntimeState,
  saveRuntimeState,
} from "@/lib/gameRuntime";

interface GameData {
  id: string;
  owner_id: string;
  name: string;
  game_type: string;
  emoji: string;
}

interface Participant {
  id: string;
  name: string;
  status: string;
}

function isRoubaGameType(t: string | null | undefined) {
  const n = (t ?? "").trim().toLowerCase();
  return n === "rouba presente" || n.includes("rouba");
}

const RoubaJogo = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const hydratedRef = useRef(false);
  const [game, setGame] = useState<GameData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>(createInitialRuntimeState());
  const [loading, setLoading] = useState(true);
  const [selectedRoubaGiftId, setSelectedRoubaGiftId] = useState("");
  const [selectedRoubaHolderId, setSelectedRoubaHolderId] = useState("");

  const confirmedParticipants = participants.filter((p) => p.status === "confirmed");
  const participantsById = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants]
  );

  const gameDurationText = useMemo(() => {
    if (!runtimeState.startedAt || !runtimeState.finishedAt) return null;
    const start = new Date(runtimeState.startedAt).getTime();
    const end = new Date(runtimeState.finishedAt).getTime();
    const diffMs = Math.max(0, end - start);
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) return `${hours}h ${remainingMinutes}min`;
    return `${remainingMinutes}min`;
  }, [runtimeState.startedAt, runtimeState.finishedAt]);

  const numbersAssigned = Object.keys(runtimeState.roubaNumbers).length > 0;

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("id, owner_id, name, game_type, emoji")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        toast.error("Evento não encontrado");
        navigate("/");
        return;
      }

      if (!isRoubaGameType(data.game_type)) {
        navigate(`/evento/${slug}`);
        return;
      }

      if (cancelled) return;
      setGame(data);

      const { data: parts } = await supabase
        .from("game_participants")
        .select("id, name, status")
        .eq("game_id", data.id);

      if (cancelled) return;
      setParticipants(parts ?? []);

      await new Promise<void>((r) => queueMicrotask(() => r()));
      let saved = loadRuntimeState(data.id);

      const fromEventStart =
        (location.state as { roubaStarted?: boolean } | null)?.roubaStarted === true;

      if (!saved.roubaStarted && fromEventStart) {
        const repaired: RuntimeState = {
          ...createInitialRuntimeState(),
          ...saved,
          roubaStarted: true,
          roubaFinished: false,
          roubaNumbers: {},
          startedAt: saved.startedAt ?? new Date().toISOString(),
          finishedAt: null,
        };
        saveRuntimeState(data.id, repaired);
        saved = repaired;
      }

      if (!saved.roubaStarted && !fromEventStart) {
        navigate(`/evento/${slug}`, { replace: true });
        return;
      }

      if (cancelled) return;
      setRuntimeState(saved);
      hydratedRef.current = true;
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate, location.state]);

  useEffect(() => {
    if (!game || loading || !hydratedRef.current) return;
    saveRuntimeState(game.id, runtimeState);
  }, [runtimeState, game, loading]);

  const handleAssignRoubaNumbers = () => {
    if (confirmedParticipants.length === 0) {
      toast.error("Não há participantes confirmados");
      return;
    }

    const numbers = Array.from({ length: confirmedParticipants.length }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const mapping: Record<string, number> = {};
    confirmedParticipants.forEach((p, index) => {
      mapping[p.id] = numbers[index];
    });

    setRuntimeState((prev) => ({ ...prev, roubaNumbers: mapping }));
    toast.success("Números sorteados!");
  };

  const handleRoubarPresente = () => {
    if (!selectedRoubaGiftId || !selectedRoubaHolderId) {
      toast.error("Selecione presente e novo portador");
      return;
    }

    setRuntimeState((prev) => {
      const targetGift = prev.roubaGifts.find((g) => g.id === selectedRoubaGiftId);
      if (!targetGift) return prev;
      if (targetGift.locked) {
        toast.error("Este presente já foi roubado 3 vezes e está bloqueado");
        return prev;
      }
      if (targetGift.holderId === selectedRoubaHolderId) {
        toast.error("Selecione um participante diferente do atual portador");
        return prev;
      }

      return {
        ...prev,
        roubaGifts: prev.roubaGifts.map((gift) =>
          gift.id === selectedRoubaGiftId
            ? {
                ...gift,
                holderId: selectedRoubaHolderId,
                steals: gift.steals + 1,
                locked: gift.steals + 1 >= 3,
              }
            : gift
        ),
      };
    });
  };

  const handleFinishRouba = () => {
    setRuntimeState((prev) => ({
      ...prev,
      roubaFinished: true,
      finishedAt: new Date().toISOString(),
    }));
    toast.success("Rouba Presente finalizado");
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to={`/evento/${slug}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao evento
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{game.emoji}</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{game.name}</h1>
                <p className="text-sm text-muted-foreground">Rouba Presente — jogo em andamento</p>
              </div>
            </div>
          </div>

          {!runtimeState.roubaFinished && (
            <div className="space-y-8">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Dices className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-lg">Sorteio de números</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Sorteia um número único (1 a N) para cada participante confirmado. Faça isso antes das rodadas de roubo.
                </p>
                <Button variant="hero" onClick={handleAssignRoubaNumbers}>
                  Sortear números agora
                </Button>
                {numbersAssigned && (
                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    {confirmedParticipants.map((p) => (
                      <p key={p.id}>
                        <span className="font-medium text-foreground">{p.name}</span>: #
                        {runtimeState.roubaNumbers[p.id] ?? "—"}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {numbersAssigned && (
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-4">
                  <h2 className="font-display font-semibold text-lg">Rodadas de roubo</h2>
                  <div className="space-y-2">
                    {runtimeState.roubaGifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted/50 rounded-xl p-3 text-sm"
                      >
                        <span className="font-medium">{gift.name}</span>
                        <span className="text-muted-foreground">
                          {participantsById.get(gift.holderId)?.name ?? "Sem portador"} · roubado{" "}
                          {gift.steals}x {gift.locked ? "(bloqueado)" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={selectedRoubaGiftId}
                      onChange={(e) => setSelectedRoubaGiftId(e.target.value)}
                    >
                      <option value="">Selecione o presente</option>
                      {runtimeState.roubaGifts.map((gift) => (
                        <option key={gift.id} value={gift.id}>
                          {gift.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={selectedRoubaHolderId}
                      onChange={(e) => setSelectedRoubaHolderId(e.target.value)}
                    >
                      <option value="">Novo portador</option>
                      {confirmedParticipants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleRoubarPresente}>
                      Registrar roubo
                    </Button>
                    <Button variant="destructive" onClick={handleFinishRouba}>
                      Finalizar jogo
                    </Button>
                  </div>
                </div>
              )}

              {!numbersAssigned && (
                <p className="text-sm text-center text-muted-foreground">
                  Sorteie os números acima para liberar as rodadas de roubo.
                </p>
              )}
            </div>
          )}

          {runtimeState.roubaFinished && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="font-display font-semibold text-lg mb-2">Estatísticas do jogo</h2>
                <p className="text-sm text-muted-foreground mb-4">Duração: {gameDurationText ?? "—"}</p>
                <div className="space-y-2">
                  {runtimeState.roubaGifts.map((gift) => (
                    <div key={`stats-${gift.id}`} className="bg-muted/50 rounded-xl p-3 text-sm">
                      <p className="font-medium">{gift.name}</p>
                      <p className="text-muted-foreground">
                        Ficou com: {participantsById.get(gift.holderId)?.name ?? "Participante removido"} ·
                        Roubado {gift.steals}x
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to={`/evento/${slug}`}>Voltar ao evento</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default RoubaJogo;
