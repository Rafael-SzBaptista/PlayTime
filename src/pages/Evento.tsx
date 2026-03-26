import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Users, Clock, Gift, Star, UserPlus, Settings, Save, Trash2, ArrowRight, ExternalLink, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type RuntimeState,
  createInitialRuntimeState,
  getRuntimeStorageKey,
  loadRuntimeState,
  saveRuntimeState,
} from "@/lib/gameRuntime";
import { allGifts } from "@/pages/Presentes";
import { GameTypeIcon } from "@/components/game/GameTypeIcon";
import {
  AUTO_DELETE_AFTER_DAYS,
  formatDatePtBr,
  getAutoDeleteDate,
} from "@/lib/gameRetention";

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
  bingo_gift_mode: "admin_only" | "participants";
  bingo_min_gifts_per_participant: number;
}

interface Participant {
  id: string;
  name: string;
  status: string;
  user_id: string | null;
  email: string | null;
  drawn_participant_id?: string | null;
  rouba_gift_in_hands?: boolean;
}

interface WishlistEntry {
  id: string;
  participant_id: string;
  gift_name: string;
  gift_category: string | null;
  gift_emoji: string | null;
  gift_price: number | null;
  gift_link?: string | null;
}

interface DrawExclusion {
  id: string;
  giver_participant_id: string;
  receiver_participant_id: string;
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

function getWishlistItemLink(item: WishlistEntry) {
  if (item.gift_link) return item.gift_link;
  return `https://lista.mercadolivre.com.br/${encodeURIComponent(item.gift_name)}`;
}

const Evento = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, displayName } = useAuth();
  const [game, setGame] = useState<GameData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [newParticipant, setNewParticipant] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [autoDrawing, setAutoDrawing] = useState(false);
  const [joinPrompted, setJoinPrompted] = useState(false);
  const [joiningByLink, setJoiningByLink] = useState(false);
  const [editing, setEditing] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>(createInitialRuntimeState());
  const [wishlistEntries, setWishlistEntries] = useState<WishlistEntry[]>([]);
  const [drawExclusions, setDrawExclusions] = useState<DrawExclusion[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    draw_date: "",
    exchange_date: "",
    rules: "",
    min_value: "",
    max_value: "",
    bingo_gift_mode: "admin_only" as "admin_only" | "participants",
    bingo_min_gifts_per_participant: "1",
  });

  const normalizedUserEmail = user?.email?.trim().toLowerCase() ?? null;
  const participantIsMe = (p: Participant) =>
    Boolean(
      user &&
        (p.user_id === user.id ||
          (!!normalizedUserEmail &&
            !!p.email &&
            p.email.trim().toLowerCase() === normalizedUserEmail)),
    );
  const isOwner = Boolean(user && game && user.id === game.owner_id);
  const isCurrentUserParticipant = Boolean(user && participants.some(participantIsMe));
  const isCurrentUserPreRegisteredByEmail = Boolean(
    normalizedUserEmail &&
      participants.some(
        (participant) =>
          !participant.user_id &&
          !!participant.email &&
          participant.email.trim().toLowerCase() === normalizedUserEmail
      )
  );
  const supportsParticipantDraw =
    game?.game_type !== "Rouba Presente" && game?.game_type !== "Bingo de Presentes";
  const isAmigoSecreto = game?.game_type === "Amigo Secreto";
  const isBingo = game?.game_type === "Bingo de Presentes";
  const isRouba = game?.game_type === "Rouba Presente";
  const isBingoParticipantsMode =
    isBingo && game?.bingo_gift_mode === "participants";
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
  const wishlistByParticipantId = useMemo(() => {
    const map = new Map<string, WishlistEntry[]>();
    for (const entry of wishlistEntries) {
      const existing = map.get(entry.participant_id) ?? [];
      existing.push(entry);
      map.set(entry.participant_id, existing);
    }
    return map;
  }, [wishlistEntries]);
  const excludedByGiverId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const exclusion of drawExclusions) {
      const existing = map.get(exclusion.giver_participant_id) ?? new Set<string>();
      existing.add(exclusion.receiver_participant_id);
      map.set(exclusion.giver_participant_id, existing);
    }
    return map;
  }, [drawExclusions]);
  const currentParticipant = participants.find((p) => participantIsMe(p)) ?? null;
  const currentParticipantWishlist = currentParticipant
    ? wishlistByParticipantId.get(currentParticipant.id) ?? []
    : [];
  const currentDrawTarget = currentParticipant?.drawn_participant_id
    ? participantsById.get(currentParticipant.drawn_participant_id) ?? null
    : null;
  const currentDrawTargetWishlist = currentDrawTarget
    ? wishlistByParticipantId.get(currentDrawTarget.id) ?? []
    : [];
  const allowConfigView = searchParams.get("config") === "1";
  const autoDeleteDate = useMemo(() => (game ? getAutoDeleteDate(game) : null), [game]);
  const autoDeleteDateText = autoDeleteDate ? formatDatePtBr(autoDeleteDate) : null;

  const gameConfigLocked = useMemo(() => {
    if (!game) return false;
    if (game.game_type === "Amigo Secreto") {
      return participants.some((p) => p.drawn_participant_id);
    }
    if (game.game_type === "Rouba Presente") {
      return runtimeState.roubaStarted;
    }
    if (game.game_type === "Bingo de Presentes") {
      return runtimeState.bingoStarted;
    }
    return false;
  }, [game, participants, runtimeState.roubaStarted, runtimeState.bingoStarted]);

  const catalogGiftLinkByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of allGifts) {
      if (g.link) m.set(g.name, g.link);
    }
    return m;
  }, []);

  const getBingoPoolGiftLink = (giftName: string) =>
    catalogGiftLinkByName.get(giftName) ??
    `https://lista.mercadolivre.com.br/${encodeURIComponent(giftName)}`;

  useEffect(() => {
    if (gameConfigLocked) setEditing(false);
  }, [gameConfigLocked]);

  useEffect(() => {
    if (
      !isAmigoSecreto ||
      !user ||
      !currentParticipant?.drawn_participant_id ||
      allowConfigView
    ) {
      return;
    }

    navigate(`/evento/${slug}/resultado`, { replace: true });
  }, [
    isAmigoSecreto,
    user,
    currentParticipant?.drawn_participant_id,
    allowConfigView,
    navigate,
    slug,
  ]);
  useEffect(() => {
    setLoading(true);
    setGame(null);
    setParticipants([]);
    setParticipantsLoaded(false);
    setWishlistEntries([]);
    setDrawExclusions([]);

    const fetchGame = async () => {
      const cleanupResult = await (supabase as any).rpc("cleanup_expired_games", {
        p_retention_days: AUTO_DELETE_AFTER_DAYS,
      });
      if (cleanupResult?.error) {
        console.warn("cleanup_expired_games falhou:", cleanupResult.error);
      }

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

      const bingoMode =
        (data as { bingo_gift_mode?: string }).bingo_gift_mode === "participants"
          ? "participants"
          : "admin_only";
      const bingoMin =
        typeof (data as { bingo_min_gifts_per_participant?: number }).bingo_min_gifts_per_participant ===
        "number"
          ? (data as { bingo_min_gifts_per_participant: number }).bingo_min_gifts_per_participant
          : 1;

      setGame({
        ...(data as GameData),
        bingo_gift_mode: bingoMode,
        bingo_min_gifts_per_participant: bingoMin,
      });
      setEditForm({
        name: data.name ?? "",
        draw_date: data.draw_date ?? "",
        exchange_date: data.exchange_date ?? "",
        rules: data.rules ?? "",
        min_value: data.min_value?.toString() ?? "",
        max_value: data.max_value?.toString() ?? "",
        bingo_gift_mode: bingoMode,
        bingo_min_gifts_per_participant: String(bingoMin),
      });

      const { data: parts } = await supabase
        .from("game_participants")
        .select("id, name, status, user_id, email, drawn_participant_id, rouba_gift_in_hands")
        .eq("game_id", data.id);

      setParticipants(parts ?? []);
      if (data.game_type === "Amigo Secreto") {
        const [wishlistRes, exclusionsRes] = await Promise.all([
          (supabase as any)
            .from("participant_wishlist_entries")
            .select("id, participant_id, gift_name, gift_category, gift_emoji, gift_price, gift_link")
            .eq("game_id", data.id),
          (supabase as any)
            .from("participant_draw_exclusions")
            .select("id, giver_participant_id, receiver_participant_id")
            .eq("game_id", data.id),
        ]);

        setWishlistEntries((wishlistRes?.data as WishlistEntry[] | null) ?? []);
        setDrawExclusions((exclusionsRes?.data as DrawExclusion[] | null) ?? []);
      } else if (data.game_type === "Bingo de Presentes" && bingoMode === "participants") {
        const wishlistRes = await (supabase as any)
          .from("participant_wishlist_entries")
          .select("id, participant_id, gift_name, gift_category, gift_emoji, gift_price, gift_link")
          .eq("game_id", data.id);
        setWishlistEntries((wishlistRes?.data as WishlistEntry[] | null) ?? []);
        setDrawExclusions([]);
      } else {
        setWishlistEntries([]);
        setDrawExclusions([]);
      }
      setParticipantsLoaded(true);
      setRuntimeState(loadRuntimeState(data.id));
      setLoading(false);
    };

    fetchGame();
  }, [slug]);

  useEffect(() => {
    if (!game || loading) return;
    saveRuntimeState(game.id, runtimeState);
  }, [runtimeState, game, loading]);

  useEffect(() => {
    if (
      !game ||
      !user ||
      !normalizedUserEmail ||
      !participantsLoaded ||
      isOwner ||
      isCurrentUserParticipant ||
      !isCurrentUserPreRegisteredByEmail
    ) {
      return;
    }

    const bindExistingParticipant = async () => {
      const { error } = await supabase
        .from("game_participants")
        .update({ user_id: user.id, status: "confirmed" })
        .eq("game_id", game.id)
        .is("user_id", null)
        .ilike("email", normalizedUserEmail);

      if (error) {
        toast.error("Não foi possível vincular sua participação existente");
        return;
      }

      setParticipants((prev) =>
        prev.map((participant) =>
          participant.email?.trim().toLowerCase() === normalizedUserEmail
            ? { ...participant, user_id: user.id, status: "confirmed" }
            : participant
        )
      );
      toast.success("Sua participação existente foi vinculada à sua conta.");
    };

    void bindExistingParticipant();
  }, [
    game,
    user,
    normalizedUserEmail,
    participantsLoaded,
    isOwner,
    isCurrentUserParticipant,
    isCurrentUserPreRegisteredByEmail,
  ]);

  useEffect(() => {
    if (
      !game ||
      !user ||
      !participantsLoaded ||
      isOwner ||
      isCurrentUserParticipant ||
      isCurrentUserPreRegisteredByEmail ||
      joinPrompted ||
      joiningByLink
    ) {
      return;
    }

    setJoinPrompted(true);
    const confirmed = window.confirm(
      `Deseja participar do jogo "${game.name}"?\n\nSeu usuário será adicionado automaticamente na lista de participantes.`
    );

    if (!confirmed) return;

    const joinByLink = async () => {
      setJoiningByLink(true);
      const fallbackName = user.email?.split("@")[0] ?? "Participante";
      const participantName = (displayName ?? fallbackName).trim();

      const { data, error } = await supabase
        .from("game_participants")
        .insert({
          game_id: game.id,
          user_id: user.id,
          name: participantName,
          status: "confirmed",
        })
        .select("id, name, status, user_id, email, drawn_participant_id, rouba_gift_in_hands")
        .single();

      if (error) {
        toast.error("Não foi possível confirmar sua participação");
      } else if (data) {
        setParticipants((prev) => {
          const alreadyListed = prev.some((participant) => participant.user_id === user.id);
          return alreadyListed ? prev : [...prev, data];
        });
        toast.success("Participação confirmada!");
      }

      setJoiningByLink(false);
    };

    void joinByLink();
  }, [
    game,
    user,
    participantsLoaded,
    isOwner,
    isCurrentUserParticipant,
    isCurrentUserPreRegisteredByEmail,
    joinPrompted,
    joiningByLink,
    displayName,
  ]);

  const handleAddParticipant = async () => {
    if (!newParticipant.trim() || !game || !isOwner) return;
    if (gameConfigLocked) {
      toast.error("O jogo já começou. Não é possível alterar participantes.");
      return;
    }

    const normalizedEmail = newParticipantEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("O e-mail é obrigatório para adicionar participante.");
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isValidEmail) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    const emailAlreadyExists = participants.some(
      (participant) =>
        participant.email && participant.email.trim().toLowerCase() === normalizedEmail
    );
    if (emailAlreadyExists) {
      toast.error("Já existe um participante com este e-mail neste jogo");
      return;
    }

    const { data, error } = await supabase
      .from("game_participants")
      .insert({
        game_id: game.id,
        name: newParticipant.trim(),
        email: normalizedEmail,
        user_id: null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar participante");
    } else if (data) {
      setParticipants((prev) => [...prev, data]);
      setNewParticipant("");
      setNewParticipantEmail("");
      toast.success("Participante adicionado!");
    }
  };

  const handleSaveEdits = async () => {
    if (!game) return;
    if (gameConfigLocked) {
      toast.error("O jogo já começou. Os detalhes do evento não podem ser alterados.");
      return;
    }

    const bingoMinParsed = Math.max(
      0,
      parseInt(editForm.bingo_min_gifts_per_participant, 10) || 0
    );

    const { error } = await supabase
      .from("games")
      .update({
        name: editForm.name.trim() || game.name,
        draw_date: editForm.draw_date || null,
        exchange_date: editForm.exchange_date || null,
        rules: editForm.rules || null,
        min_value: editForm.min_value ? parseInt(editForm.min_value) : null,
        max_value: editForm.max_value ? parseInt(editForm.max_value) : null,
        ...(game.game_type === "Bingo de Presentes"
          ? {
              bingo_gift_mode: editForm.bingo_gift_mode,
              bingo_min_gifts_per_participant: bingoMinParsed,
            }
          : {}),
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
              ...(game.game_type === "Bingo de Presentes"
                ? {
                    bingo_gift_mode: editForm.bingo_gift_mode,
                    bingo_min_gifts_per_participant: bingoMinParsed,
                  }
                : {}),
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

  const toggleExclusion = async (giverId: string, receiverId: string) => {
    if (!game || !isOwner) return;
    if (gameConfigLocked) {
      toast.error("O sorteio já foi realizado. As restrições não podem ser alteradas.");
      return;
    }

    const existing = drawExclusions.find(
      (item) =>
        item.giver_participant_id === giverId &&
        item.receiver_participant_id === receiverId
    );

    if (existing) {
      const { error } = await (supabase as any)
        .from("participant_draw_exclusions")
        .delete()
        .eq("id", existing.id);
      if (error) {
        toast.error("Não foi possível remover a restrição");
        return;
      }
      setDrawExclusions((prev) => prev.filter((item) => item.id !== existing.id));
      return;
    }

    const { data, error } = await (supabase as any)
      .from("participant_draw_exclusions")
      .insert({
        game_id: game.id,
        giver_participant_id: giverId,
        receiver_participant_id: receiverId,
      })
      .select("id, giver_participant_id, receiver_participant_id")
      .single();

    if (error) {
      toast.error("Não foi possível salvar a restrição");
      return;
    }

    if (data) {
      setDrawExclusions((prev) => [...prev, data as DrawExclusion]);
    }
  };

  const buildDrawPairs = (
    participantIds: string[],
    blockedMap: Map<string, Set<string>>
  ) => {
    const givers = [...participantIds];
    const receivers = [...participantIds];

    if (givers.length < 2) return null;

    let attempts = 0;
    while (attempts < 100) {
      for (let i = receivers.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
      }

      const valid = givers.every((giverId, index) => {
        const receiverId = receivers[index];
        if (giverId === receiverId) return false;
        const blocked = blockedMap.get(giverId);
        return !blocked?.has(receiverId);
      });
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
    if (gameConfigLocked) {
      toast.error("O jogo já começou. Não é possível remover participantes.");
      return;
    }

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

  const runDraw = async ({ isAutomatic = false }: { isAutomatic?: boolean } = {}) => {
    if (!isOwner || !game || drawing || autoDrawing) return;
    if (gameConfigLocked && game.game_type === "Amigo Secreto") {
      if (!isAutomatic) toast.error("O sorteio já foi realizado.");
      return;
    }

    const confirmedParticipants = participants.filter((p) => p.status === "confirmed");
    if (confirmedParticipants.length < 2) {
      if (!isAutomatic) {
        toast.error("São necessários pelo menos 2 participantes confirmados para sortear");
      }
      return;
    }

    const alreadyDrawn = confirmedParticipants.some((p) => p.drawn_participant_id);
    if (alreadyDrawn) {
      if (!isAutomatic) {
        toast.error("Este evento já possui sorteio realizado");
      }
      return;
    }

    if (game.draw_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const drawDate = new Date(`${game.draw_date}T00:00:00`);

      if (today < drawDate && !isAutomatic) {
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
    const blockedMap = new Map<string, Set<string>>();
    ids.forEach((id) => blockedMap.set(id, new Set<string>([id])));
    drawExclusions.forEach((exclusion) => {
      const blocked = blockedMap.get(exclusion.giver_participant_id);
      if (blocked) blocked.add(exclusion.receiver_participant_id);
    });

    const pairs = buildDrawPairs(ids, blockedMap);
    if (!pairs) {
      toast.error("Não foi possível gerar os pares do sorteio");
      return;
    }

    if (isAutomatic) {
      setAutoDrawing(true);
    } else {
      setDrawing(true);
    }
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

      toast.success(
        isAutomatic
          ? "Sorteio automático realizado com sucesso!"
          : "Sorteio realizado com sucesso!"
      );
    } catch (error: any) {
      if (!isAutomatic) {
        toast.error("Erro ao realizar sorteio: " + (error?.message ?? "tente novamente"));
      }
    } finally {
      setDrawing(false);
      setAutoDrawing(false);
    }
  };

  const handleRunDraw = async () => {
    await runDraw();
  };

  const handleResetAmigoSorteio = async () => {
    if (!isOwner || !game || !isAmigoSecreto) return;
    const hasDraw = participants.some((p) => p.drawn_participant_id);
    if (!hasDraw) {
      toast.error("Não há sorteio para reiniciar.");
      return;
    }
    if (
      !window.confirm(
        "Reiniciar o sorteio do Amigo Secreto? Todos os pares serão apagados. Os participantes deixam de ver quem tiraram até um novo sorteio ser feito.",
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("game_participants")
      .update({ drawn_participant_id: null })
      .eq("game_id", game.id);

    if (error) {
      toast.error(error.message ?? "Não foi possível reiniciar o sorteio.");
      return;
    }

    setParticipants((prev) => prev.map((p) => ({ ...p, drawn_participant_id: null })));
    toast.success("Sorteio reiniciado. Você pode realizar um novo sorteio quando quiser.");
  };

  useEffect(() => {
    if (!isOwner || !game || !supportsParticipantDraw || drawing || autoDrawing) return;
    if (gameConfigLocked) return;
    if (!game.draw_date) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const drawDate = new Date(`${game.draw_date}T00:00:00`);
    if (today < drawDate) return;

    const confirmedParticipants = participants.filter((p) => p.status === "confirmed");
    const alreadyDrawn = confirmedParticipants.some((p) => p.drawn_participant_id);
    if (alreadyDrawn || confirmedParticipants.length < 2) return;

    void runDraw({ isAutomatic: true });
  }, [isOwner, game, supportsParticipantDraw, drawing, autoDrawing, participants, gameConfigLocked]);

  const canToggleRoubaReadyFor = (participantId: string) =>
    Boolean(isOwner || currentParticipant?.id === participantId);

  const allRoubaChecklistDone =
    isRouba &&
    confirmedParticipants.length > 0 &&
    confirmedParticipants.every((p) => Boolean(p.rouba_gift_in_hands));

  const persistRoubaReady = async (participantId: string, inHands: boolean) => {
    if (!game || !canToggleRoubaReadyFor(participantId)) return;
    const { error } = await supabase
      .from("game_participants")
      .update({ rouba_gift_in_hands: inHands })
      .eq("id", participantId)
      .eq("game_id", game.id);
    if (error) {
      console.error(error);
      toast.error(
        error.message?.includes("rouba_gift_in_hands") || error.message?.includes("column")
          ? "Atualize o banco (migration rouba_gift_in_hands) ou tente de novo."
          : "Não foi possível atualizar o checklist."
      );
      return;
    }
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, rouba_gift_in_hands: inHands } : p)),
    );
  };

  const handleStartRouba = () => {
    if (!game) return;
    if (confirmedParticipants.length === 0) {
      toast.error("Cadastre ao menos um participante confirmado antes de iniciar");
      return;
    }
    if (!allRoubaChecklistDone) {
      toast.error("Só é possível iniciar o Rouba após todos marcarem o checklist de presente em mãos.");
      return;
    }

    const roubaGifts = confirmedParticipants.map((p, i) => ({
      id: `${p.id}-gift-${i}`,
      name: `Presente de ${p.name}`,
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

  const handleStartBingo = () => {
    if (!game) return;
    if (confirmedParticipants.length === 0) {
      toast.error("Cadastre os participantes antes de iniciar o bingo");
      return;
    }

    const mode = game.bingo_gift_mode ?? "admin_only";
    const minPerPlayer = game.bingo_min_gifts_per_participant ?? 1;

    let bingoGiftPool: string[] = [];

    if (mode === "admin_only") {
      if (runtimeState.bingoGifts.length === 0) {
        toast.error("Cadastre ao menos um presente para o bingo");
        return;
      }
      bingoGiftPool = [...runtimeState.bingoGifts];
    } else {
      const withAccount = confirmedParticipants.filter((p) => p.user_id);
      for (const p of withAccount) {
        const count = wishlistByParticipantId.get(p.id)?.length ?? 0;
        if (count < minPerPlayer) {
          toast.error(
            `Cada jogador com conta precisa escolher pelo menos ${minPerPlayer} presente(s) na página Sugestões.`
          );
          return;
        }
      }
      const unique = new Set<string>();
      wishlistEntries.forEach((w) => unique.add(w.gift_name));
      bingoGiftPool = Array.from(unique);
      if (bingoGiftPool.length === 0) {
        toast.error("Não há presentes escolhidos pelos jogadores.");
        return;
      }
    }

    const next: RuntimeState = {
      ...runtimeState,
      bingoGifts: bingoGiftPool,
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
    setRuntimeState(next);
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
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mb-4 flex justify-center">
              <GameTypeIcon gameType={game.game_type} emojiFallback={game.emoji} size="xl" />
            </div>
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

          {!user && (
            <div className="mb-6 rounded-2xl border border-border bg-muted/40 px-4 py-4 text-center">
              <p className="text-sm font-medium text-foreground">
                Para participar deste jogo, é necessário ter uma conta.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie uma conta (ou entre) e você volta para este evento automaticamente.
              </p>
              <div className="mt-4 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
                <Button asChild variant="hero" size="sm" className="sm:w-auto">
                  <Link to={`/cadastro?next=${encodeURIComponent(`/evento/${slug}`)}`}>Criar conta</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="sm:w-auto">
                  <Link to={`/login?next=${encodeURIComponent(`/evento/${slug}`)}`}>Já tenho conta</Link>
                </Button>
              </div>
            </div>
          )}

          {gameConfigLocked && (
            <div className="mb-6 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
              Este jogo já começou (sorteio realizado ou jogo iniciado). Participantes, nomes, presentes e demais
              configurações estão bloqueados — apenas visualização.
            </div>
          )}

          {autoDeleteDateText && (
            <div className="mb-6 rounded-2xl border border-amber-300/40 bg-amber-100/30 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Este evento será excluído automaticamente em {autoDeleteDateText}.
              </p>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/80">
                A limpeza remove o jogo de Meus Jogos para organizador e participantes, além dos dados no Supabase
                ({AUTO_DELETE_AFTER_DAYS} dias após a data do evento).
              </p>
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div className="min-w-0 space-y-6">
              {usesEventStartLabel ? (
                <div className="bg-card rounded-2xl p-5 shadow-card border border-border text-center">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Início em</p>
                  <p className="font-display font-bold text-2xl text-primary">
                    {getCountdown(game.draw_date)}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>

            <div className="min-w-0">
              {/* Info / Edit */}
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" /> Detalhes
              </h2>
              {isOwner && !gameConfigLocked && (
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

            {editing && !gameConfigLocked ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Nome do evento</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {game.game_type === "Bingo de Presentes" && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                    <Label className="text-sm">Quem define os presentes do bingo</Label>
                    <select
                      value={editForm.bingo_gift_mode}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          bingo_gift_mode: e.target.value as "admin_only" | "participants",
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="admin_only">Somente o organizador</option>
                      <option value="participants">Cada jogador escolhe na página Sugestões</option>
                    </select>
                    {editForm.bingo_gift_mode === "participants" && (
                      <div>
                        <Label className="text-sm">Mínimo de presentes por jogador</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editForm.bingo_min_gifts_per_participant}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              bingo_min_gifts_per_participant: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}
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
                <div className="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
                {game.game_type === "Bingo de Presentes" && (
                  <div className="mb-4 rounded-xl border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-muted-foreground">Presentes no bingo</p>
                    <p className="font-medium">
                      {game.bingo_gift_mode === "participants"
                        ? "Cada jogador escolhe na página Sugestões"
                        : "Somente o organizador adiciona os presentes"}
                    </p>
                    {game.bingo_gift_mode === "participants" && (
                      <p className="mt-1 text-muted-foreground">
                        Mínimo por jogador (com conta): {game.bingo_min_gifts_per_participant}
                      </p>
                    )}
                  </div>
                )}
                {game.rules && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Regras</p>
                    <p className="text-sm bg-muted rounded-xl p-3">{game.rules}</p>
                  </div>
                )}
              </>
            )}
          </div>
            </div>
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

          {isRouba && !runtimeState.roubaStarted && (
            <div className="mb-6 space-y-6">
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 shadow-card">
                <p className="text-sm font-medium text-foreground">Sugestões de presentes</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Veja ideias e links de compra. No Rouba não há “adicionar ao perfil” na lista — use só como inspiração.
                </p>
                <Button asChild variant="festiveOutline" size="sm" className="mt-3">
                  <Link to={`/presentes?gameSlug=${slug}&rouba=1`}>Abrir sugestões de presentes</Link>
                </Button>
              </div>

              {user && (isOwner || isCurrentUserParticipant) && confirmedParticipants.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
                  <h3 className="font-display font-semibold text-sm">Checklist — presente em mãos</h3>
                  <p className="text-xs text-muted-foreground">
                    Todos os participantes do jogo veem quem já marcou; ninguém vê o que os outros vão levar, só o status
                    deste check.
                  </p>
                  <ul className="space-y-2">
                    {confirmedParticipants.map((p) => {
                      const checked = p.rouba_gift_in_hands ?? false;
                      const canToggle = canToggleRoubaReadyFor(p.id);
                      return (
                        <li key={p.id} className="flex items-center gap-3">
                          <Checkbox
                            id={`rouba-ready-${p.id}`}
                            checked={checked}
                            disabled={!canToggle}
                            onCheckedChange={(v) => {
                              if (!canToggle) return;
                              void persistRoubaReady(p.id, v === true);
                            }}
                          />
                          <label
                            htmlFor={`rouba-ready-${p.id}`}
                            className={`text-sm ${canToggle ? "cursor-pointer" : "cursor-default"}`}
                          >
                            {participantIsMe(p) ? "Você" : p.name}
                            {!canToggle && (
                              <span className="ml-2 text-xs text-muted-foreground">(só o organizador ou a própria pessoa marca)</span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!user && (
                <p className="text-sm text-muted-foreground">
                  Entre na sua conta para usar o checklist.
                </p>
              )}
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

          {/* Participants */}
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
            <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Participantes ({participants.length})
            </h2>
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl p-3 ${
                    participantIsMe(p) ? "bg-primary/10" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`text-sm font-medium ${
                          participantIsMe(p) ? "text-primary" : ""
                        }`}
                      >
                        {participantIsMe(p) ? "Você" : p.name}
                      </span>
                    </div>
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
                      {isOwner && !gameConfigLocked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveParticipant(p.id, p.name);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {(isAmigoSecreto || isBingoParticipantsMode) && (
                    <div className="mt-3 rounded-xl border border-border/60 bg-background/70 p-3 text-xs">
                      <p className="mb-2 text-muted-foreground">
                        {isBingoParticipantsMode ? "Presentes escolhidos (bingo)" : "Preferências de presentes"}
                      </p>
                      {(wishlistByParticipantId.get(p.id)?.length ?? 0) === 0 ? (
                        <p className="text-muted-foreground">Nenhum item cadastrado ainda.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(wishlistByParticipantId.get(p.id) ?? []).map((wish) => (
                            <a
                              key={wish.id}
                              href={getWishlistItemLink(wish)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-2 py-1.5 transition-colors hover:bg-muted"
                            >
                              <span className="inline-flex items-center gap-2">
                                <span>{wish.gift_emoji ?? "🎁"}</span>
                                {wish.gift_name}
                              </span>
                              <span className="inline-flex items-center gap-2 text-muted-foreground">
                                {typeof wish.gift_price === "number"
                                  ? `R$ ${wish.gift_price.toFixed(2).replace(".", ",")}`
                                  : "Ver produto"}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {participants.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground lg:col-span-2">
                  {gameConfigLocked
                    ? "Nenhum participante cadastrado."
                    : "Nenhum participante ainda. Adicione abaixo!"}
                </p>
              )}
            </div>
            {isOwner && !gameConfigLocked ? (
              <div className="flex gap-2">
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Nome do participante"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                  />
                  <Input
                    placeholder="E-mail"
                    value={newParticipantEmail}
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleAddParticipant}>
                  <UserPlus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            ) : isOwner && gameConfigLocked ? (
              <p className="text-xs text-muted-foreground">Participantes bloqueados após o início do jogo.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Apenas o organizador pode adicionar participantes.
              </p>
            )}
          </div>

          {isBingo && isOwner && !runtimeState.bingoStarted && game.bingo_gift_mode === "admin_only" && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border mb-6">
              <p className="text-sm font-medium mb-2">Presentes do bingo (somente este evento)</p>
              {runtimeState.bingoGifts.length > 0 ? (
                <ul className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  {runtimeState.bingoGifts.map((giftName) => {
                    const href = getBingoPoolGiftLink(giftName);
                    return (
                      <li
                        key={giftName}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5"
                      >
                        <p className="min-w-0 flex-1 font-medium text-foreground">{giftName}</p>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir link do produto: ${giftName}`}
                          className="shrink-0 text-primary transition-opacity hover:opacity-80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum presente no pool ainda. Escolha na página de sugestões — o link inclui este jogo para que a
                  escolha fique salva só aqui.
                </p>
              )}
              <div className="mt-4">
                <Button asChild variant="hero" size="sm">
                  <Link to={`/presentes?gameSlug=${slug}`}>Ir para Sugestão de Produtos</Link>
                </Button>
              </div>
            </div>
          )}

          {isAmigoSecreto && currentParticipant && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
              <h2 className="font-display font-semibold text-lg mb-2">Sua prateleira de desejos</h2>
              <p className="text-xs text-muted-foreground mb-4">
                {gameConfigLocked
                  ? "O sorteio já foi realizado — sua lista de preferências não pode mais ser alterada (somente consulta nas sugestões)."
                  : "Escolha seus produtos na aba de sugestões e adicione ao seu perfil deste jogo."}
              </p>
              <div className="mb-4 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                Selecionados: <span className="font-semibold">{currentParticipantWishlist.length}</span>/3 mínimo
              </div>
              <div className="mb-4">
                <Button asChild variant="hero" size="sm">
                  <Link to={`/presentes?gameSlug=${slug}`}>
                    {gameConfigLocked ? "Ver sugestões (consulta)" : "Ir para Sugestões de Produtos"}
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentParticipantWishlist.length === 0 ? (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    Você ainda não adicionou nenhum item ao seu perfil.
                  </p>
                ) : (
                  currentParticipantWishlist.map((wish) => (
                    <a
                      key={wish.id}
                      href={getWishlistItemLink(wish)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{wish.gift_emoji ?? "🎁"}</span>
                        {wish.gift_name}
                      </span>
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        {typeof wish.gift_price === "number"
                          ? `R$ ${wish.gift_price.toFixed(2).replace(".", ",")}`
                          : "Ver produto"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {isBingoParticipantsMode && currentParticipant && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
              <h2 className="font-display font-semibold text-lg mb-2">Seus presentes para o bingo</h2>
              <p className="text-xs text-muted-foreground mb-4">
                {gameConfigLocked
                  ? "O bingo já começou — sua lista não pode mais ser alterada (somente consulta nas sugestões)."
                  : "Na página de sugestões, adicione os produtos que você pretende comprar para este bingo."}
              </p>
              <div className="mb-4 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                Selecionados: <span className="font-semibold">{currentParticipantWishlist.length}</span>
                {game.bingo_min_gifts_per_participant > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    (mínimo {game.bingo_min_gifts_per_participant})
                  </span>
                )}
              </div>
              <div className="mb-4">
                <Button asChild variant="hero" size="sm">
                  <Link to={`/presentes?gameSlug=${slug}`}>
                    {gameConfigLocked ? "Ver sugestões (consulta)" : "Ir para Sugestões de Produtos"}
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentParticipantWishlist.length === 0 ? (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    Você ainda não adicionou nenhum presente.
                  </p>
                ) : (
                  currentParticipantWishlist.map((wish) => (
                    <a
                      key={wish.id}
                      href={getWishlistItemLink(wish)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="inline-flex items-center gap-2">
                        <span>{wish.gift_emoji ?? "🎁"}</span>
                        {wish.gift_name}
                      </span>
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        {typeof wish.gift_price === "number"
                          ? `R$ ${wish.gift_price.toFixed(2).replace(".", ",")}`
                          : "Ver produto"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  ))
                )}
              </div>
            </div>
          )}

          {isAmigoSecreto && isOwner && confirmedParticipants.length > 1 && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mb-6">
              <h2 className="font-display font-semibold text-lg mb-2">Restrições de sorteio</h2>
              <p className="text-xs text-muted-foreground mb-4">
                {gameConfigLocked
                  ? "Restrições usadas no sorteio (somente leitura)."
                  : "Defina quem não pode tirar quem no Amigo Secreto."}
              </p>
              <div className="space-y-3">
                {confirmedParticipants.map((giver) => (
                  <div key={giver.id} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-sm font-medium mb-2">{giver.name} não pode tirar:</p>
                    <div className="flex flex-wrap gap-2">
                      {confirmedParticipants
                        .filter((receiver) => receiver.id !== giver.id)
                        .map((receiver) => {
                          const blocked = excludedByGiverId.get(giver.id)?.has(receiver.id) ?? false;
                          const chipClass = `rounded-full px-3 py-1 text-xs ${
                            blocked
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border border-border text-muted-foreground"
                          }`;
                          return gameConfigLocked ? (
                            <span key={`${giver.id}-${receiver.id}`} className={chipClass}>
                              {receiver.name}
                            </span>
                          ) : (
                            <button
                              key={`${giver.id}-${receiver.id}`}
                              type="button"
                              onClick={() => toggleExclusion(giver.id, receiver.id)}
                              className={`${chipClass} transition-colors hover:text-foreground`}
                            >
                              {receiver.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isOwner && supportsParticipantDraw && (
              <Button
                variant="hero"
                size="lg"
                className="w-full sm:flex-1"
                onClick={handleRunDraw}
                disabled={drawing || gameConfigLocked}
              >
                🎯 {drawing ? "Realizando..." : "Realizar Sorteio"}
              </Button>
            )}
            {isOwner && (
              <Button variant="festiveOutline" size="lg" className="w-full sm:flex-1" onClick={handleCopyLink}>
                📤 Compartilhar Link
              </Button>
            )}
            {isOwner && isRouba && !runtimeState.roubaStarted && (
              <Button
                type="button"
                variant="hero"
                size="lg"
                className="w-full sm:flex-1"
                onClick={handleStartRouba}
                disabled={!allRoubaChecklistDone}
              >
                Iniciar jogo
              </Button>
            )}
            {isOwner && isBingo && !runtimeState.bingoStarted && (
              <Button type="button" variant="hero" size="lg" className="w-full sm:flex-1" onClick={handleStartBingo}>
                Iniciar bingo
              </Button>
            )}
          </div>

          {isOwner && isRouba && !runtimeState.roubaStarted && !allRoubaChecklistDone && (
            <p className="mt-3 text-sm text-muted-foreground">
              Para iniciar o Rouba, todos os participantes confirmados precisam marcar o checklist de presente em mãos.
            </p>
          )}

          {game.game_type === "Bingo de Presentes" && runtimeState.bingoStarted && !runtimeState.bingoFinished && (
            <div className="mt-6 bg-primary/10 border border-primary/25 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm">
                O bingo está em andamento. Use a página do jogo para girar a roleta e registrar os bingos.
              </p>
              <Button variant="hero" size="sm" asChild>
                <Link to={`/evento/${slug}/bingo`}>Abrir página do bingo</Link>
              </Button>
            </div>
          )}

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
              {isAmigoSecreto && (
                <div className="mt-6 flex flex-wrap gap-2 justify-end border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => void handleResetAmigoSorteio()}
                  >
                    Reiniciar sorteio (apagar pares)
                  </Button>
                </div>
              )}
            </div>
          )}

          {isAmigoSecreto && currentParticipant && currentDrawTarget && (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border mt-6">
              <p className="text-xl font-semibold mb-2">Você tirou: {currentDrawTarget.name}</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Abra a página com sugestões de presente e links para compra (igual para todos os participantes).
              </p>
              <Link
                to={`/evento/${slug}/resultado`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ver preferências e sugestões de presente →
              </Link>
            </div>
          )}

        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Evento;
