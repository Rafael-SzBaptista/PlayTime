import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { GameTypeIcon } from "@/components/game/GameTypeIcon";
import { PartyPopper } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

function isBingoGameType(t: string | null | undefined) {
  const n = (t ?? "").trim().toLowerCase();
  return n === "bingo de presentes" || n.includes("bingo");
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(142 76% 36%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
  "hsl(199 89% 48%)",
];

const BingoJogo = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hydratedRef = useRef(false);
  const [game, setGame] = useState<GameData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>(createInitialRuntimeState());
  const [loading, setLoading] = useState(true);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [winnerParticipantId, setWinnerParticipantId] = useState("");
  const [winnerGift, setWinnerGift] = useState("");

  const confirmedParticipants = participants.filter((p) => p.status === "confirmed");
  const isOwner = Boolean(user && game && user.id === game.owner_id);
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

  const participantPieData = useMemo(() => {
    const map = new Map<string, number>();
    runtimeState.bingoWinners.forEach((w) => {
      map.set(w.participantId, (map.get(w.participantId) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([id, value]) => ({
      id,
      name: participantsById.get(id)?.name ?? "Participante",
      value,
    }));
  }, [runtimeState.bingoWinners, participantsById]);

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

      if (!isBingoGameType(data.game_type)) {
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

      // Evita ler localStorage antes do write do "Iniciar bingo" (mesma tarefa síncrona).
      await new Promise<void>((r) => queueMicrotask(() => r()));
      let saved = loadRuntimeState(data.id);

      const fromEventStart =
        (location.state as { bingoStarted?: boolean } | null)?.bingoStarted === true;

      if (!saved.bingoStarted && fromEventStart) {
        const repaired: RuntimeState = {
          ...createInitialRuntimeState(),
          ...saved,
          bingoStarted: true,
          bingoFinished: false,
          bingoNumbersDrawn: [],
          bingoAvailableNumbers: Array.from({ length: 75 }, (_, i) => i + 1),
          bingoWinners: [],
          startedAt: saved.startedAt ?? new Date().toISOString(),
          finishedAt: null,
        };
        saveRuntimeState(data.id, repaired);
        saved = repaired;
      }

      if (!saved.bingoStarted && !fromEventStart) {
        navigate(`/evento/${slug}`, { replace: true });
        return;
      }

      if (cancelled) return;

      setRuntimeState(saved);

      if (saved.bingoNumbersDrawn.length > 0) {
        setLastDrawn(saved.bingoNumbersDrawn[saved.bingoNumbersDrawn.length - 1]);
      }

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

  const handleSpinWheel = () => {
    if (!game || spinning || runtimeState.bingoFinished) return;
    if (runtimeState.bingoAvailableNumbers.length === 0) {
      toast.error("Não há mais números disponíveis");
      return;
    }

    const available = [...runtimeState.bingoAvailableNumbers];
    const pickIndex = Math.floor(Math.random() * available.length);
    const number = available[pickIndex];

    setSpinning(true);
    setLastDrawn(null);
    const extraTurns = 6;
    setWheelRotation((r) => r + extraTurns * 360 + Math.random() * 360);

    window.setTimeout(() => {
      setRuntimeState((prev) => {
        const nextAvailable = prev.bingoAvailableNumbers.filter((n) => n !== number);
        return {
          ...prev,
          bingoNumbersDrawn: [...prev.bingoNumbersDrawn, number],
          bingoAvailableNumbers: nextAvailable,
        };
      });
      setLastDrawn(number);
      setSpinning(false);
      toast.success(`Número sorteado: ${number}`);
    }, 3000);
  };

  const handleRegisterBingoWinner = () => {
    if (!winnerParticipantId || !winnerGift) {
      toast.error("Selecione quem fez bingo e o presente");
      return;
    }

    setRuntimeState((prev) => ({
      ...prev,
      bingoWinners: [...prev.bingoWinners, { participantId: winnerParticipantId, gift: winnerGift }],
    }));
    setWinnerParticipantId("");
    setWinnerGift("");
    toast.success("Bingo registrado!");
  };

  const handleFinishBingo = () => {
    if (!isOwner) {
      toast.error("Apenas o organizador pode finalizar o jogo.");
      return;
    }
    setRuntimeState((prev) => ({
      ...prev,
      bingoFinished: true,
      finishedAt: new Date().toISOString(),
    }));
    toast.success("Bingo finalizado");
  };

  const handleRestartBingo = () => {
    if (!isOwner) {
      toast.error("Apenas o organizador pode reiniciar o jogo.");
      return;
    }
    if (!game) return;
    if (
      !window.confirm(
        "Reiniciar o jogo? Os números sorteados e os bingos registrados serão apagados; a lista de presentes do bingo permanece."
      )
    ) {
      return;
    }
    setRuntimeState((prev) => ({
      ...prev,
      bingoFinished: false,
      finishedAt: null,
      bingoNumbersDrawn: [],
      bingoAvailableNumbers: Array.from({ length: 75 }, (_, i) => i + 1),
      bingoWinners: [],
      startedAt: new Date().toISOString(),
    }));
    setLastDrawn(null);
    setWheelRotation(0);
    toast.success("Jogo reiniciado — você pode sortear novamente.");
  };

  const handleResetBingoSetup = () => {
    if (!isOwner || !game) {
      toast.error("Apenas o organizador pode reiniciar o cadastro/configurações.");
      return;
    }
    if (
      !window.confirm(
        "Reiniciar cadastro/configurações do Bingo?\n\nIsso volta o jogo para antes do início, limpa números sorteados, bingos registrados e presentes do pool do bingo nesta execução.",
      )
    ) {
      return;
    }

    const reset = createInitialRuntimeState();
    setRuntimeState(reset);
    saveRuntimeState(game.id, reset);
    setLastDrawn(null);
    setWheelRotation(0);
    setWinnerParticipantId("");
    setWinnerGift("");
    toast.success("Cadastro/configurações do Bingo reiniciados. O jogo voltou para pré-início.");
    navigate(`/evento/${slug}?config=1`, { replace: true });
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Carregando bingo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <GameTypeIcon gameType={game.game_type} emojiFallback={game.emoji} size="lg" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{game.name}</h1>
                  <p className="text-sm text-muted-foreground">Bingo de Presentes — jogo em andamento</p>
                </div>
              </div>
            </div>
          </div>

          {!runtimeState.bingoFinished && (
            <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
              {runtimeState.bingoGifts.length > 0 && (
                <div className="lg:col-span-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                  <span className="font-semibold text-foreground">Presentes no jogo: </span>
                  <span className="text-muted-foreground">{runtimeState.bingoGifts.join(" · ")}</span>
                </div>
              )}
              <div className="space-y-4">
                <h2 className="font-display font-semibold text-lg">Roleta do Bingo</h2>
                <p className="text-xs text-muted-foreground">
                  A roleta gira por 3 segundos; em seguida o número sorteado é revelado.
                </p>
                <div className="relative mx-auto w-full max-w-[min(100%,360px)] aspect-square">
                  <div
                    className="absolute inset-0 rounded-full shadow-elevated border-4 border-primary/30 overflow-hidden"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: spinning ? "transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
                      background: `conic-gradient(${Array.from({ length: 75 }, (_, i) => {
                        const hue = (i * 5) % 360;
                        return `hsl(${hue} 70% ${i % 2 === 0 ? 52 : 45}%) ${(i / 75) * 100}% ${((i + 1) / 75) * 100}%`;
                      }).join(", ")})`,
                    }}
                  />
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10">
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-primary drop-shadow" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/95 rounded-full w-[38%] h-[38%] flex flex-col items-center justify-center border-2 border-border shadow-card">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Número
                      </span>
                      <span className="text-4xl font-bold text-primary tabular-nums">
                        {lastDrawn ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={handleSpinWheel}
                  disabled={spinning || runtimeState.bingoAvailableNumbers.length === 0}
                >
                  {spinning ? "Girando..." : "Girar roleta (3s)"}
                </Button>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Histórico de números</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {runtimeState.bingoNumbersDrawn.length > 0
                      ? runtimeState.bingoNumbersDrawn.join(", ")
                      : "Nenhum número sorteado ainda."}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-card border border-border space-y-4">
                <h2 className="font-display font-semibold text-lg">Registrar bingo</h2>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Quem fez bingo?</Label>
                    <Select value={winnerParticipantId} onValueChange={setWinnerParticipantId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o participante" />
                      </SelectTrigger>
                      <SelectContent>
                        {confirmedParticipants.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Presente que pegou</Label>
                    <Select value={winnerGift} onValueChange={setWinnerGift}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o presente" />
                      </SelectTrigger>
                      <SelectContent>
                        {runtimeState.bingoGifts.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button variant="outline" onClick={handleRegisterBingoWinner}>
                      Registrar bingo
                    </Button>
                    {isOwner ? (
                      <Button variant="destructive" onClick={handleFinishBingo}>
                        Finalizar bingo
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground pt-1">
                        Só o organizador pode finalizar o bingo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {runtimeState.bingoFinished && (
            <div className="space-y-8">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border flex items-center gap-3">
                <PartyPopper className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="font-display font-semibold text-xl">Bingo encerrado</h2>
                  <p className="text-sm text-muted-foreground">
                    Duração: {gameDurationText ?? "—"} · Números sorteados:{" "}
                    {runtimeState.bingoNumbersDrawn.length}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h3 className="font-display font-semibold text-lg mb-4">Resultados (tabela)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead>Presente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runtimeState.bingoWinners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Nenhum bingo registrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      runtimeState.bingoWinners.map((w, idx) => (
                        <TableRow key={`${w.participantId}-${w.gift}-${idx}`}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {participantsById.get(w.participantId)?.name ?? "—"}
                          </TableCell>
                          <TableCell>{w.gift}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-card border border-border max-w-2xl mx-auto w-full">
                <h3 className="font-display font-semibold text-lg mb-4">Bingos por participante</h3>
                {participantPieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Sem dados para exibir.</p>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={participantPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {participantPieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {isOwner ? (
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button type="button" variant="hero" size="lg" onClick={handleRestartBingo}>
                    Reiniciar o jogo
                  </Button>
                  <Button type="button" variant="destructive" size="lg" onClick={handleResetBingoSetup}>
                    Reiniciar cadastro/configurações
                  </Button>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Só o organizador pode reiniciar o jogo após o encerramento.
                </p>
              )}
            </div>
          )}

          {isOwner && !runtimeState.bingoFinished && (
            <div className="mt-6 flex justify-center">
              <Button type="button" variant="destructive" onClick={handleResetBingoSetup}>
                Reiniciar cadastro/configurações
              </Button>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default BingoJogo;
