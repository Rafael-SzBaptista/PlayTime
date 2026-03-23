import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Crown, Users, Trash2, Pencil } from "lucide-react";
import { getRuntimeStorageKey } from "@/lib/gameRuntime";

interface GameWithRole {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  game_type: string;
  status: string;
  draw_date: string | null;
  exchange_date: string | null;
  isOwner: boolean;
  participantId?: string;
}

const MeusJogos = () => {
  const { user, loading: authLoading, displayName } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchGames = async () => {
      try {
        // Games I own
        const { data: ownedGames, error: ownedError } = await supabase
          .from("games")
          .select("*")
          .eq("owner_id", user.id);

        if (ownedError) throw ownedError;

        // Games I participate in
        const { data: participations, error: participationsError } = await supabase
          .from("game_participants")
          .select("id, game_id, games(*)")
          .eq("user_id", user.id);

        if (participationsError) throw participationsError;

        const owned: GameWithRole[] = (ownedGames ?? []).map((g) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
          emoji: g.emoji,
          game_type: g.game_type,
          status: g.status,
          draw_date: g.draw_date,
          exchange_date: g.exchange_date,
          isOwner: true,
        }));

        const participated: GameWithRole[] = (participations ?? [])
          .filter((p) => p.games && !owned.find((o) => o.id === p.game_id))
          .map((p) => {
            const g = p.games as any;
            return {
              id: g.id,
              name: g.name,
              slug: g.slug,
              emoji: g.emoji,
              game_type: g.game_type,
              status: g.status,
              draw_date: g.draw_date,
              exchange_date: g.exchange_date,
              isOwner: false,
              participantId: p.id,
            };
          });

        setGames([...owned, ...participated]);
      } catch (error: any) {
        toast.error("Não foi possível carregar seus jogos");
        console.error("Erro ao buscar jogos:", error?.message ?? error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [user]);

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!user) return;
    const ok = window.confirm(
      `Excluir permanentemente o jogo "${gameName}"?\n\nTodos os participantes e dados do evento serão removidos. Esta ação não pode ser desfeita.`
    );
    if (!ok) return;

    setDeletingId(gameId);

    try {
      const { error: clearDrawError } = await supabase
        .from("game_participants")
        .update({ drawn_participant_id: null })
        .eq("game_id", gameId);

      if (clearDrawError) throw clearDrawError;

      const { error: delPartsError } = await supabase
        .from("game_participants")
        .delete()
        .eq("game_id", gameId);

      if (delPartsError) throw delPartsError;

      const { error: delGameError } = await supabase
        .from("games")
        .delete()
        .eq("id", gameId)
        .eq("owner_id", user.id);

      if (delGameError) throw delGameError;

      try {
        localStorage.removeItem(getRuntimeStorageKey(gameId));
      } catch {
        /* ignore */
      }

      setGames((prev) => prev.filter((g) => g.id !== gameId));
      toast.success(`Jogo "${gameName}" excluído`);
    } catch (error: any) {
      toast.error(error?.message ? `Erro: ${error.message}` : "Não foi possível excluir o jogo");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLeaveGame = async (participantId: string, gameName: string) => {
    const { error } = await supabase
      .from("game_participants")
      .delete()
      .eq("id", participantId);

    if (error) {
      toast.error("Erro ao sair do jogo");
    } else {
      toast.success(`Você saiu de "${gameName}"`);
      setGames((prev) => prev.filter((g) => g.participantId !== participantId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Meus Jogos</h1>
              <p className="text-muted-foreground">Olá, {displayName} 👋</p>
            </div>
          </div>

          {/* Games list */}
          {games.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-xl font-bold mb-2">Nenhum jogo ainda</h2>
              <p className="text-muted-foreground mb-6">
                Crie um novo jogo ou participe de um existente!
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="hero" asChild>
                  <Link to="/criar-jogo">
                    <Gift className="w-4 h-4" />
                    Criar Jogo
                  </Link>
                </Button>
                <Button variant="festiveOutline" asChild>
                  <Link to="/participar">
                    <Users className="w-4 h-4" />
                    Participar
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-card rounded-2xl p-5 shadow-card border border-border flex items-center justify-between hover:shadow-elevated transition-shadow"
                >
                  <Link to={`/evento/${game.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-3xl">{game.emoji}</span>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold truncate">{game.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{game.game_type}</span>
                        {game.isOwner && (
                          <span className="inline-flex items-center gap-1 bg-accent/20 text-accent-foreground rounded-full px-2 py-0.5">
                            <Crown className="w-3 h-3" />
                            Organizador
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full ${
                          game.status === "open"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {game.status === "open" ? "Aberto" : "Encerrado"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex gap-2 flex-wrap justify-end">
                    {game.isOwner && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/evento/${game.slug}`}>
                            <Pencil className="w-4 h-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === game.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteGame(game.id, game.name);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === game.id ? "Excluindo..." : "Excluir"}
                        </Button>
                      </>
                    )}

                    {!game.isOwner && game.participantId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleLeaveGame(game.participantId!, game.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Sair
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default MeusJogos;
