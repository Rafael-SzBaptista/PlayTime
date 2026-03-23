import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Users, Clock, Gift, Star, UserPlus, Settings, Save, Trash2, ArrowRight } from "lucide-react";
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
  min_value: number | null;
  max_value: number | null;
  draw_date: string | null;
  exchange_date: string | null;
  rules: string | null;
  allow_suggestions: boolean;
  status: string;
}

interface Participant {
  id: string;
  name: string;
  status: string;
  user_id: string | null;
  drawn_participant_id?: string | null;
}

function getCountdown(dateStr: string | null) {
  if (!dateStr) return "—";
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return "Já passou!";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return `${days} dias`;
}

const Evento = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState<GameData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>(createInitialRuntimeState());
  const [newBingoGift, setNewBingoGift] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    draw_date: "",
    exchange_date: "",
    rules: "",
    min_value: "",
    max_value: "",
  });

  const isOwner = user && game && user.id === game.owner_id;
  const supportsParticipantDraw =
    game?.game_type !== "Rouba Presente" && game?.game_type !== "Bingo de Presentes";
  const usesEventStartLabel =
    game?.game_type === "Rouba Presente" || game?.game_type === "Bingo de Presentes";
  const drawResults = useMemo(() => {
    const participantsById = new Map(participants.map((p) => [p.id, p]));

    return participants
      .filter((p) => Boolean(p.drawn_participant_id))
      .map((p) => ({
        giverName: p.name,
        receiverName: participantsById.get(p.drawn_participant_id as string)?.name ?? "Participante removido",
      }));
  }, [participants]);
  const confirmedParticipants = participants.filter((p) => p.status === "confirmed");
  const participantsById = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants]
  );
  useEffect(() => {
    const fetchGame = async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        toast.error("Evento não encontrado");
        setLoading(false);
        return;
      }

      setGame(data);
      setEditForm({
        name: data.name ?? "",
        draw_date: data.draw_date ?? "",
        exchange_date: data.exchange_date ?? "",
        rules: data.rules ?? "",
        min_value: data.min_value?.toString() ?? "",
        max_value: data.max_value?.toString() ?? "",
      });

      const { data: parts } = await supabase
        .from("game_participants")
        .select("id, name, status, user_id, drawn_participant_id")
        .eq("game_id", data.id);

      setParticipants(parts ?? []);
      setRuntimeState(loadRuntimeState(data.id));
      setLoading(false);
    };

    fetchGame();
  }, [slug]);

  useEffect(() => {
    if (!game) return;
    saveRuntimeState(game.id, runtimeState);
  }, [runtimeState, game]);

  const handleAddParticipant = async () => {
    if (!newParticipant.trim() || !game) return;

    const { data, error } = await supabase
      .from("game_participants")
      .insert({
        game_id: game.id,
        name: newParticipant.trim(),
        user_id: isOwner ? null : (user?.id ?? null),
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar participante");
    } else if (data) {
      setParticipants((prev) => [...prev, data]);
      setNewParticipant("");
      toast.success("Participante adicionado!");
    }
  };

  const handleSaveEdits = async () => {
    if (!game) return;

    const { error } = await supabase
      .from("games")
      .update({
        name: editForm.name.trim() || game.name,
        draw_date: editForm.draw_date || null,
        exchange_date: editForm.exchange_date || null,
        rules: editForm.rules || null,
        min_value: editForm.min_value ? parseInt(editForm.min_value) : null,
        max_value: editForm.max_value ? parseInt(editForm.max_value) : null,
      })
      .eq("id", game.id);

    if (error) {
      toast.error("Erro ao salvar alterações");
    } else {
      setGame((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name.trim() || game.name,
              draw_date: editForm.draw_date || null,
              exchange_date: editForm.exchange_date || null,
              rules: editForm.rules || null,
              min_value: editForm.min_value ? parseInt(editForm.min_value) : null,
              max_value: editForm.max_value ? parseInt(editForm.max_value) : null,
            }
          : null
      );
      setEditing(false);
      toast.success("Alterações salvas!");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  const buildDrawPairs = (participantIds: string[]) => {
    const givers = [...participantIds];
    const receivers = [...participantIds];

    if (givers.length < 2) return null;

    let attempts = 0;
    while (attempts < 100) {
      for (let i = receivers.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
      }

      const valid = givers.every((giverId, index) => giverId !== receivers[index]);
      if (valid) {
        return givers.map((giverId, index) => ({
          giverId,
          receiverId: receivers[index],
        }));
      }

      attempts += 1;
    }

    return null;
  };

  const handleRemoveParticipant = async (participantId: string, participantName: string) => {
    if (!isOwner || !game) return;

    const confirmed = window.confirm(`Remover "${participantName}" deste evento?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("game_participants")
      .delete()
      .eq("id", participantId)
      .eq("game_id", game.id);

    if (error) {
      toast.error("Erro ao remover participante");
      return;
    }

    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    toast.success("Participante removido");
  };

  const handleRunDraw = async () => {
    if (!isOwner || !game || drawing) return;

    const confirmedParticipants = participants.filter((p) => p.status === "confirmed");
    if (confirmedParticipants.length < 2) {
      toast.error("São necessários pelo menos 2 participantes confirmados para sortear");
      return;
    }

    const alreadyDrawn = confirmedParticipants.some((p) => p.drawn_participant_id);
    if (alreadyDrawn) {
      toast.error("Este evento já possui sorteio realizado");
      return;
    }

    if (game.draw_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const drawDate = new Date(`${game.draw_date}T00:00:00`);

      if (today < drawDate) {
        toast.warning("A data do sorteio ainda não chegou");
        const typedName = window.prompt(
          `Para confirmar o sorteio antes da data, digite exatamente o nome do evento:\n\n${game.name}`
        );

        if (typedName !== game.name) {
          toast.error("Confirmação inválida. Sorteio cancelado.");
          return;
        }
      }
    }

    const ids = confirmedParticipants.map((p) => p.id);
    const pairs = buildDrawPairs(ids);
    if (!pairs) {
      toast.error("Não foi possível gerar os pares do sorteio");
      return;
    }

    setDrawing(true);
    try {
      const updates = pairs.map((pair) =>
        supabase
          .from("game_participants")
          .update({ drawn_participant_id: pair.receiverId })
          .eq("id", pair.giverId)
          .eq("game_id", game.id)
      );

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      setParticipants((prev) =>
        prev.map((participant) => {
          const pair = pairs.find((p) => p.giverId === participant.id);
          return pair
            ? { ...participant, drawn_participant_id: pair.receiverId }
            : participant;
        })
      );

      toast.success("Sorteio realizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao realizar sorteio: " + (error?.message ?? "tente novamente"));
    } finally {
      setDrawing(false);
    }
  };

  const handleParticipantGiftChange = (participantId: string, gift: string) => {
    setRuntimeState((prev) => ({
      ...prev,
      participantGiftChoices: {
        ...prev.participantGiftChoices,
        [participantId]: gift,
      },
    }));
  };

  const handleStartRouba = () => {
    if (!game) return;
    const missingGift = confirmedParticipants.some(
      (p) => !runtimeState.participantGiftChoices[p.id]?.trim()
    );
    if (missingGift) {
      toast.error("Todos os participantes confirmados devem escolher um presente antes de iniciar");
      return;
    }

    const roubaGifts = confirmedParticipants.map((p, i) => ({
      id: `${p.id}-gift-${i}`,
      name: runtimeState.participantGiftChoices[p.id].trim(),
      holderId: p.id,
      steals: 0,
      locked: false,
    }));

    const next: RuntimeState = {
      ...runtimeState,
      roubaStarted: true,
      roubaFinished: false,
      roubaNumbers: {},
      roubaGifts,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    saveRuntimeState(game.id, next);
    navigate(`/evento/${slug}/rouba`, {
      replace: true,
      state: { roubaStarted: true },
    });
  };

  const handleAddBingoGift = () => {
    const gift = newBingoGift.trim();
    if (!gift) return;

    setRuntimeState((prev) => ({
      ...prev,
      bingoGifts: [...prev.bingoGifts, gift],
    }));
    setNewBingoGift("");
  };

  const handleStartBingo = () => {
    if (!game) return;
    if (confirmedParticipants.length === 0) {
      toast.error("Cadastre os participantes antes de iniciar o bingo");
      return;
    }
    if (runtimeState.bingoGifts.length === 0) {
      toast.error("Cadastre ao menos um presente para o bingo");
      return;
    }

    const next: RuntimeState = {
      ...runtimeState,
      bingoStarted: true,
      bingoFinished: false,
      bingoNumbersDrawn: [],
      bingoAvailableNumbers: Array.from({ length: 75 }, (_, i) => i + 1),
      bingoWinners: [],
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    // Persiste antes de navegar — não chame setRuntimeState aqui: o useEffect que salva
    // o estado antigo pode sobrescrever o localStorage antes do BingoJogo ler (corrida).
    saveRuntimeState(game.id, next);
    navigate(`/evento/${slug}/bingo`, {
      replace: true,
      state: { bingoStarted: true },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Evento não encontrado</h1>
          <p className="text-muted-foreground">Verifique o link e tente novamente.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">{game.emoji}</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{game.name}</h1>
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
              {game.game_type}
            </span>
            {isOwner && (
              <span className="ml-2 inline-flex items-center gap-1 bg-accent/20 text-accent-foreground rounded-full px-3 py-1 text-sm font-medium">
                👑 Organizador
              </span>
            )}
          </div>

          {/* Countdowns */}
          {usesEventStartLabel ? (
            <div className="mb-8">
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Início em</p>
                <p className="font-display font-bold text-2xl text-primary">
                  {getCountdown(game.draw_date)}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Sorteio em</p>
                <p className="font-display font-bold text-2xl text-primary">
                  {getCountdown(game.draw_date)}
                </p>
              </div>
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border text-center">
                <Gift className="w-5 h-5 text-secondary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Troca em</p>
                <p className="font-display font-bold text-2xl text-secondary">
                  {getCountdown(game.exchange_date)}
                </p>
              </div>
            </div>
          )}

          {/* Info / Edit */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" /> Detalhes
              </h2>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  <Settings className="w-4 h-4" />
                  {editing ? "Cancelar" : "Editar"}
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Nome do evento</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Data do sorteio</Label>
                    <Input
                      type="date"
                      value={editForm.draw_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, draw_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Data da troca</Label>
                    <Input
                      type="date"
                      value={editForm.exchange_date}
                      onChange={(e) => setEditForm((f) => ({ ...f, exchange_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Valor mínimo (R$)</Label>
                    <Input
                      type="number"
                      value={editForm.min_value}
                      onChange={(e) => setEditForm((f) => ({ ...f, min_value: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Valor máximo (R$)</Label>
                    <Input
                      type="number"
                      value={editForm.max_value}
                      onChange={(e) => setEditForm((f) => ({ ...f, max_value: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Regras</Label>
                  <Textarea
                    value={editForm.rules}
                    onChange={(e) => setEditForm((f) => ({ ...f, rules: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <Button variant="hero" size="sm" onClick={handleSaveEdits}>
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground">Valor mínimo</p>
                    <p className="font-semibold">
                      {game.min_value ? `R$ ${game.min_value},00` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor máximo</p>
                    <p className="font-semibold">
                      {game.max_value ? `R$ ${game.max_value},00` : "—"}
                    </p>
                  </div>
                </div>
                {game.rules && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Regras</p>
                    <p className="text-sm bg-muted rounded-xl p-3">{game.rules}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {game.game_type === "Rouba Presente" && runtimeState.roubaStarted && !runtimeState.roubaFinished && (
            <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm">
                O Rouba Presente está em andamento. Use a página do jogo para sortear números e registrar os roubos.
              </p>
              <Button variant="hero" size="sm" asChild>
                <Link to={`/evento/${slug}/rouba`}>Abrir página do jogo</Link>
              </Button>
            </div>
          )}

          {game.game_type === "Rouba Presente" && runtimeState.roubaFinished && (
            <div className="bg-muted/50 border border-border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">Jogo finalizado. Veja as estatísticas na página do Rouba.</p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/evento/${slug}/rouba`}>Ver estatísticas</Link>
              </Button>
            </div>
          )}

          {game.game_type === "Rouba Presente" && !runtimeState.roubaStarted && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6 space-y-4">
              <h2 className="font-display font-semibold text-lg">Pré-jogo — Rouba Presente</h2>
              <p className="text-xs text-muted-foreground">
                Cada participante informa o presente que vai levar. Ao iniciar, você será levado à página do jogo (sorteio de números e roubos).
              </p>
              <div className="space-y-2">
                {confirmedParticipants.map((p) => (
                  <div key={p.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <Input
                      placeholder="Presente que vai comprar"
                      value={runtimeState.participantGiftChoices[p.id] ?? ""}
                      onChange={(e) => handleParticipantGiftChange(p.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="hero" onClick={handleStartRouba}>
                Iniciar jogo
              </Button>
            </div>
          )}

          {game.game_type === "Bingo de Presentes" && runtimeState.bingoStarted && !runtimeState.bingoFinished && (
            <div className="bg-primary/10 border border-primary/25 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm">
                O bingo está em andamento. Use a página do jogo para girar a roleta e registrar os bingos.
              </p>
              <Button variant="hero" size="sm" asChild>
                <Link to={`/evento/${slug}/bingo`}>Abrir página do bingo</Link>
              </Button>
            </div>
          )}

          {game.game_type === "Bingo de Presentes" && runtimeState.bingoFinished && (
            <div className="bg-muted/50 border border-border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">Bingo finalizado. Veja tabelas e gráficos na página de estatísticas.</p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/evento/${slug}/bingo`}>Ver estatísticas do bingo</Link>
              </Button>
            </div>
          )}

          {game.game_type === "Bingo de Presentes" && !runtimeState.bingoStarted && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6 space-y-4">
              <h2 className="font-display font-semibold text-lg">Pré-jogo — Bingo</h2>
              <p className="text-xs text-muted-foreground">
                Cadastre os participantes abaixo e adicione os presentes que entrarão no bingo. Ao iniciar, você será levado à página do jogo.
              </p>

              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar presente ao bingo"
                  value={newBingoGift}
                  onChange={(e) => setNewBingoGift(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddBingoGift()}
                />
                <Button variant="outline" onClick={handleAddBingoGift}>
                  Adicionar
                </Button>
              </div>
              {runtimeState.bingoGifts.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Presentes: {runtimeState.bingoGifts.join(", ")}
                </div>
              )}
              <Button type="button" variant="hero" onClick={handleStartBingo}>
                Iniciar bingo
              </Button>
            </div>
          )}

          {/* Participants */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Participantes ({participants.length})
            </h2>
            <div className="space-y-2 mb-4">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <span className="font-medium text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.status === "confirmed"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.status === "confirmed" ? "Confirmado" : "Pendente"}
                    </span>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveParticipant(p.id, p.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum participante ainda. Adicione abaixo!
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do participante"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                className="h-10"
                onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
              />
              <Button variant="outline" size="sm" onClick={handleAddParticipant}>
                <UserPlus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isOwner && supportsParticipantDraw && (
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={handleRunDraw}
                disabled={drawing}
              >
                🎯 {drawing ? "Realizando..." : "Realizar Sorteio"}
              </Button>
            )}
            <Button variant="festiveOutline" size="lg" className="flex-1" onClick={handleCopyLink}>
              📤 Compartilhar Link
            </Button>
          </div>

          {isOwner && supportsParticipantDraw && drawResults.length > 0 && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mt-6">
              <h2 className="font-display font-semibold text-lg mb-4">Resultado do Sorteio</h2>
              <div className="space-y-2">
                {drawResults.map((result, index) => (
                  <div
                    key={`${result.giverName}-${result.receiverName}-${index}`}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-3 rounded-xl bg-muted/50 text-sm"
                  >
                    <span className="font-medium text-right">{result.giverName}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-primary">{result.receiverName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Evento;
