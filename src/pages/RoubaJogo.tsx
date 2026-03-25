import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { GameTypeIcon } from "@/components/game/GameTypeIcon";
import { ArrowLeft, Dices } from "lucide-react";
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
  user_id: string | null;
  email: string | null;
}

function isRoubaGameType(t: string | null | undefined) {
  const n = (t ?? "").trim().toLowerCase();
  return n === "rouba presente" || n.includes("rouba");
}

const RoubaJogo = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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
  const normalizedUserEmail = user?.email?.trim().toLowerCase() ?? null;
  const participantIsMe = (p: Participant) =>
    Boolean(
      user &&
        (p.user_id === user.id ||
          (!!normalizedUserEmail &&
            !!p.email &&
            p.email.trim().toLowerCase() === normalizedUserEmail)),
    );
  const currentParticipant = participants.find((p) => participantIsMe(p)) ?? null;
  const isOwner = Boolean(user && game && user.id === game.owner_id);

  const canEditRoubaGiftName = (gift: { holderId: string }) =>
    isOwner || Boolean(currentParticipant && gift.holderId === currentParticipant.id);

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

  const roubaStealsPerGiftChart = useMemo(
    () =>
      runtimeState.roubaGifts.map((g) => ({
        name: g.name.length > 24 ? `${g.name.slice(0, 22)}…` : g.name,
        fullName: g.name,
        roubos: g.steals,
      })),
    [runtimeState.roubaGifts],
  );

  const totalRodadasRoubo = useMemo(
    () => runtimeState.roubaGifts.reduce((acc, g) => acc + g.steals, 0),
    [runtimeState.roubaGifts],
  );

  const cadastroGiftRows = isOwner
    ? runtimeState.roubaGifts
    : currentParticipant
      ? runtimeState.roubaGifts.filter((g) => g.holderId === currentParticipant.id)
      : [];

  useEffect(() => {
    if (!game || loading || !hydratedRef.current) return;
    if (runtimeState.roubaGifts.length > 0) return;
    if (confirmedParticipants.length === 0) return;
    setRuntimeState((prev) => ({
      ...prev,
      roubaGifts: confirmedParticipants.map((p, i) => ({
        id: `${p.id}-gift-${i}`,
        name: `Presente de ${p.name}`,
        holderId: p.id,
        steals: 0,
        locked: false,
      })),
    }));
  }, [game, loading, confirmedParticipants, runtimeState.roubaGifts.length]);

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
        .select("id, name, status, user_id, email")
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
    if (!isOwner) {
      toast.error("Apenas o organizador pode sortear os números.");
      return;
    }
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

  const handleResetRoubaNumbers = () => {
    if (!isOwner) return;
    if (Object.keys(runtimeState.roubaNumbers).length === 0) return;
    if (
      !window.confirm(
        "Refazer o sorteio dos números? A distribuição atual (1…N) será apagada e as rodadas de roubo ficam ocultas até sortear de novo. Os roubos já registrados nos presentes não são desfeitos — confirme se é isso que deseja.",
      )
    ) {
      return;
    }
    setRuntimeState((prev) => ({ ...prev, roubaNumbers: {} }));
    toast.success("Sorteio limpo. Sorteie os números novamente quando quiser.");
  };

  const handleRoubarPresente = () => {
    if (!isOwner) {
      toast.error("Apenas o organizador pode registrar roubos.");
      return;
    }
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
    if (!isOwner) {
      toast.error("Apenas o organizador pode finalizar o jogo.");
      return;
    }
    setRuntimeState((prev) => ({
      ...prev,
      roubaFinished: true,
      finishedAt: new Date().toISOString(),
    }));
    toast.success("Rouba Presente finalizado");
  };

  const handleRestartRouba = () => {
    if (!isOwner) {
      toast.error("Apenas o organizador pode reiniciar o jogo.");
      return;
    }
    if (
      !window.confirm(
        "Reiniciar o Rouba Presente? O jogo deixa de aparecer como finalizado e volta às rodadas de roubo. Presentes, números sorteados e histórico de roubos permanecem como estão.",
      )
    ) {
      return;
    }
    setRuntimeState((prev) => ({
      ...prev,
      roubaFinished: false,
      finishedAt: null,
    }));
    toast.success("Jogo reaberto — continue ou finalize quando quiser.");
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
              <GameTypeIcon gameType={game.game_type} emojiFallback={game.emoji} size="lg" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{game.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Rouba Presente —{" "}
                  {runtimeState.roubaFinished ? "jogo finalizado" : "jogo em andamento"}
                </p>
              </div>
            </div>
          </div>

          {!runtimeState.roubaFinished && (
            <div className="space-y-8">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="font-display font-semibold text-lg mb-1">
                  {isOwner ? "Cadastro de presentes" : "Cadastre o seu presente"}
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {isOwner ? (
                    <>
                      Ajuste como cada presente aparece no jogo (nome na mesa). Você pode alterar os nomes a qualquer
                      momento até finalizar o jogo — inclusive depois do sorteio. Use o card <strong>Sorteio de números</strong>{" "}
                      abaixo para sortear ou refazer o sorteio.
                    </>
                  ) : (
                    <>
                      Informe como o <strong>seu</strong> presente deve aparecer no jogo. Você pode corrigir o nome depois
                      do sorteio, se precisar. O organizador sorteia os números no card <strong>Sorteio de números</strong>{" "}
                      abaixo.
                    </>
                  )}
                </p>
                {numbersAssigned && (
                  <p className="mb-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    Números já sorteados — os campos acima continuam editáveis para ajustar o nome do presente.
                    {isOwner && " Como organizador, você pode refazer o sorteio no card abaixo, se tiver sido por engano."}
                  </p>
                )}
                {runtimeState.roubaGifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Carregando presentes do jogo…</p>
                ) : !isOwner && !currentParticipant ? (
                  <p className="text-sm text-muted-foreground">
                    {user
                      ? "Sua conta não está entre os participantes confirmados deste jogo — você não pode cadastrar um presente aqui."
                      : "Entre na sua conta para cadastrar o seu presente."}
                  </p>
                ) : !isOwner && cadastroGiftRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Não encontramos um presente associado a você neste jogo.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {cadastroGiftRows.map((gift) => {
                      const holder = participantsById.get(gift.holderId);
                      const editable = canEditRoubaGiftName(gift);
                      return (
                        <div key={gift.id} className="space-y-2">
                          <Label htmlFor={`gift-${gift.id}`} className="text-xs text-muted-foreground">
                            {isOwner ? `Quem leva · ${holder?.name ?? "Participante"}` : "Seu presente"}
                          </Label>
                          <Input
                            id={`gift-${gift.id}`}
                            value={gift.name}
                            disabled={!editable}
                            onChange={(e) => {
                              const value = e.target.value;
                              setRuntimeState((prev) => ({
                                ...prev,
                                roubaGifts: prev.roubaGifts.map((g) =>
                                  g.id === gift.id ? { ...g, name: value } : g,
                                ),
                              }));
                            }}
                            onBlur={(e) => {
                              const trimmed = e.target.value.trim();
                              const holderName = participantsById.get(gift.holderId)?.name ?? "?";
                              setRuntimeState((prev) => ({
                                ...prev,
                                roubaGifts: prev.roubaGifts.map((g) =>
                                  g.id === gift.id
                                    ? { ...g, name: trimmed || `Presente de ${holderName}` }
                                    : g,
                                ),
                              }));
                            }}
                            placeholder="Nome ou descrição do presente"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {isOwner && !user && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Entre na sua conta para poder salvar alterações como organizador.
                  </p>
                )}
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Dices className="w-5 h-5 text-primary" />
                  <h2 className="font-display font-semibold text-lg">Sorteio de números</h2>
                </div>
                {isOwner ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">
                      Sorteia um número único (1 a N) para cada participante confirmado. Depois disso liberam as rodadas
                      de roubo. Se sortear por engano, use <strong>Refazer sorteio</strong>. Os participantes veem só o
                      próprio número.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      {!numbersAssigned ? (
                        <Button
                          variant="hero"
                          onClick={handleAssignRoubaNumbers}
                          disabled={runtimeState.roubaGifts.length === 0}
                        >
                          Sortear números agora
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" onClick={handleResetRoubaNumbers}>
                          Refazer sorteio (limpar números)
                        </Button>
                      )}
                    </div>
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
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">
                      O organizador sorteia os números. Aqui aparece apenas o seu número.
                    </p>
                    {!numbersAssigned ? (
                      <p className="text-sm text-muted-foreground">Aguarde o organizador sortear os números.</p>
                    ) : currentParticipant ? (
                      <p className="text-sm">
                        <span className="font-medium text-foreground">Seu número:</span> #
                        {runtimeState.roubaNumbers[currentParticipant.id] ?? "—"}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Entre na conta vinculada ao evento como participante confirmado para ver o seu número.
                      </p>
                    )}
                  </>
                )}
              </div>

              {numbersAssigned && isOwner && (
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
                          {participantsById.get(gift.holderId)?.name ?? "Sem portador"} · roubado {gift.steals}x{" "}
                          {gift.locked ? "(bloqueado)" : ""}
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
                  {isOwner
                    ? "Sorteie os números acima para liberar as rodadas de roubo. Os nomes dos presentes podem ser ajustados no card de cadastro a qualquer momento."
                    : "Aguarde o organizador sortear os números. As rodadas de roubo são conduzidas por ele."}
                </p>
              )}
            </div>
          )}

          {runtimeState.roubaFinished && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border space-y-8">
                <h2 className="font-display font-semibold text-lg">Estatísticas do jogo</h2>

                <section>
                  <h3 className="font-display font-semibold text-base mb-2">1. Duração do jogo</h3>
                  <p className="text-sm text-foreground">{gameDurationText ?? "—"}</p>
                </section>

                <section>
                  <h3 className="font-display font-semibold text-base mb-2">2. Rodadas</h3>
                  <p className="text-sm text-foreground">
                    {totalRodadasRoubo}{" "}
                    {totalRodadasRoubo === 1 ? "rodada de roubo registrada" : "rodadas de roubo registradas"}
                  </p>
                </section>

                <section>
                  <h3 className="font-display font-semibold text-base mb-3">3. Quem ficou com cada presente</h3>
                  {runtimeState.roubaGifts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum presente no jogo.</p>
                  ) : (
                    <ul className="space-y-2">
                      {runtimeState.roubaGifts.map((gift) => (
                        <li
                          key={`holder-${gift.id}`}
                          className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-foreground">{gift.name}</span>
                          <span className="text-muted-foreground sm:before:content-['→'] sm:before:mr-2">
                            {participantsById.get(gift.holderId)?.name ?? "Participante removido"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="font-display font-semibold text-base mb-3">4. Roubos por presente</h3>
                  {roubaStealsPerGiftChart.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados.</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roubaStealsPerGiftChart} margin={{ bottom: 8, left: 0, right: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11 }}
                            interval={0}
                            angle={-28}
                            textAnchor="end"
                            height={72}
                          />
                          <YAxis allowDecimals={false} width={32} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const row = payload[0].payload as (typeof roubaStealsPerGiftChart)[0];
                              return (
                                <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md">
                                  <p className="font-medium">{row.fullName}</p>
                                  <p className="text-muted-foreground">Roubos: {row.roubos}</p>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="roubos" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </section>
              </div>

              {isOwner && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button type="button" variant="hero" size="lg" onClick={handleRestartRouba}>
                    Reabrir jogo (desfazer finalização)
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default RoubaJogo;
