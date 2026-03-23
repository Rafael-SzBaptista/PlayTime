import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gem, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

const priceRanges = [
  { label: "Até R$30", icon: Wallet },
  { label: "Até R$50", icon: Sparkles },
  { label: "Até R$100", icon: Gem },
] as const;

const featuredGifts = [
  { name: "Caneca Personalizada", price: "R$ 29,90", category: "Canecas", emoji: "☕" },
  { name: "Caixa de Chocolates", price: "R$ 45,00", category: "Chocolates", emoji: "🍫" },
  { name: "Fone Bluetooth", price: "R$ 89,90", category: "Tecnologia", emoji: "🎧" },
  { name: "Kit de Livros", price: "R$ 59,90", category: "Livros", emoji: "📚" },
  { name: "Jogo de Tabuleiro", price: "R$ 79,90", category: "Jogos", emoji: "🎲" },
  { name: "Kit Decoração", price: "R$ 39,90", category: "Decoração", emoji: "✨" },
];

const GiftSuggestions = () => {
  return (
    <section className="relative py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Inspiração</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Sugestões de <span className="text-gradient">presentes</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Encontre o presente perfeito por faixa de preço
          </p>
        </motion.div>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {priceRanges.map((range) => (
            <Link key={range.label} to="/presentes">
              <Button variant="festiveOutline" size="lg" className="gap-2">
                <range.icon className="h-4 w-4" />
                {range.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredGifts.map((gift, i) => (
            <motion.div
              key={gift.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-5 shadow-card backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-elevated"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-primary/15 to-accent/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-3 text-3xl opacity-90">{gift.emoji}</div>
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {gift.category}
                </span>
                <h3 className="font-display mt-3 font-semibold">{gift.name}</h3>
                <p className="mb-4 text-lg font-bold text-secondary">{gift.price}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-border/80 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver no Mercado Livre
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button variant="hero" size="lg" asChild>
            <Link to="/presentes">Ver todas as sugestões</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default GiftSuggestions;
