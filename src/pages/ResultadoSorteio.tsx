import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { allGifts, getOptimizedImageSrc } from "./Presentes";

interface GameData {
  id: string;
  name: string;
  game_type: string;
}

interface Participant {
  id: string;
  name: string;
  user_id: string | null;
  drawn_participant_id: string | null;
}

interface WishlistEntry {
  id: string;
  gift_name: string;
  gift_emoji: string | null;
  gift_price: number | null;
  gift_link: string | null;
}

const ResultadoSorteio = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameData | null>(null);
  const [drawTarget, setDrawTarget] = useState<Participant | null>(null);
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);

  const giftByName = useMemo(
    () => new Map(allGifts.map((gift) => [gift.name, gift])),
    [],
  );

  useEffect(() => {
    const loadResult = async () => {
      if (!slug || !user) {
        setLoading(false);
        return;
      }

      const { data: gameData } = await supabase
        .from("games")
        .select("id, name, game_type")
        .eq("slug", slug)
        .single();

      if (!gameData || gameData.game_type !== "Amigo Secreto") {
        setGame(gameData as GameData | null);
        setLoading(false);
        return;
      }

      setGame(gameData as GameData);

      const { data: participantsData } = await supabase
        .from("game_participants")
        .select("id, name, user_id, drawn_participant_id")
        .eq("game_id", gameData.id);

      const participants = (participantsData ?? []) as Participant[];
      const currentParticipant = participants.find((p) => p.user_id === user.id) ?? null;
      const target = currentParticipant?.drawn_participant_id
        ? participants.find((p) => p.id === currentParticipant.drawn_participant_id) ?? null
        : null;

      setDrawTarget(target);

      if (target) {
        const { data: wishlistData } = await (supabase as any)
          .from("participant_wishlist_entries")
          .select("id, gift_name, gift_emoji, gift_price, gift_link")
          .eq("game_id", gameData.id)
          .eq("participant_id", target.id);

        setWishlist((wishlistData ?? []) as WishlistEntry[]);
      } else {
        setWishlist([]);
      }

      setLoading(false);
    };

    void loadResult();
  }, [slug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
          Carregando resultado do sorteio...
        </div>
        <Footer />
      </div>
    );
  }

  if (!game || game.game_type !== "Amigo Secreto") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="mb-2 text-2xl font-bold">Resultado indisponível</h1>
          <p className="mb-6 text-muted-foreground">Este jogo não possui tela de resultado individual.</p>
          <Button asChild variant="outline">
            <Link to={`/evento/${slug}`}>Voltar ao jogo</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!drawTarget) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="mb-2 text-2xl font-bold">Sorteio ainda não disponível</h1>
          <p className="mb-6 text-muted-foreground">
            Quando o organizador realizar o sorteio, seu resultado aparecerá aqui.
          </p>
          <Button asChild variant="outline">
            <Link to={`/evento/${slug}?config=1`}>Voltar para configurações do jogo</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="mb-2 text-sm text-muted-foreground">Seu resultado do Amigo Secreto</p>
          <h1 className="mb-1 text-3xl font-bold">Você tirou: {drawTarget.name}</h1>
          <p className="text-sm text-muted-foreground">Veja abaixo as preferências com imagem.</p>
          <div className="mt-4">
            <Link
              to={`/evento/${slug}?config=1`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Volte para as configurações do jogo
            </Link>
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Este participante ainda não cadastrou preferências.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((wish) => {
              const catalogGift = giftByName.get(wish.gift_name);
              const image = catalogGift?.image;
              const link =
                wish.gift_link ??
                catalogGift?.link ??
                `https://lista.mercadolivre.com.br/${encodeURIComponent(wish.gift_name)}`;

              return (
                <a
                  key={wish.id}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col rounded-none border border-border bg-card p-4 shadow-card transition-colors hover:bg-muted/20"
                >
                  {image ? (
                    <img
                      src={getOptimizedImageSrc(image)}
                      alt={wish.gift_name}
                      className="mb-3 h-44 w-full rounded-none object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (image && target.src !== `${window.location.origin}${image}`) {
                          target.onerror = null;
                          target.src = image;
                        }
                      }}
                    />
                  ) : (
                    <div className="mb-3 flex h-44 items-center justify-center rounded-none text-5xl">
                      {wish.gift_emoji ?? "🎁"}
                    </div>
                  )}
                  <h3 className="mb-2 min-h-[2.75rem] line-clamp-2 text-sm font-semibold">{wish.gift_name}</h3>
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {typeof wish.gift_price === "number"
                        ? `R$ ${wish.gift_price.toFixed(2).replace(".", ",")}`
                        : "Ver produto"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary">
                      Abrir <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ResultadoSorteio;
