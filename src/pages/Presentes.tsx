import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Search } from "lucide-react";

const categories = [
  { id: "todos", label: "Todos", emoji: "🎁" },
  { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { id: "canecas", label: "Canecas", emoji: "☕" },
  { id: "chocolates", label: "Chocolates", emoji: "🍫" },
  { id: "livros", label: "Livros", emoji: "📚" },
  { id: "jogos", label: "Jogos", emoji: "🎲" },
  { id: "engracados", label: "Engraçados", emoji: "😂" },
  { id: "decoracao", label: "Decoração", emoji: "✨" },
];

const allGifts = [
  { name: "Fone Bluetooth TWS", price: 49.9, category: "tecnologia", emoji: "🎧" },
  { name: "Carregador Portátil", price: 59.9, category: "tecnologia", emoji: "🔋" },
  { name: "Mouse Sem Fio", price: 39.9, category: "tecnologia", emoji: "🖱️" },
  { name: "Caneca Criativa Gamer", price: 29.9, category: "canecas", emoji: "☕" },
  { name: "Caneca Térmica 500ml", price: 45.0, category: "canecas", emoji: "🥤" },
  { name: "Caixa Bombons Sortidos", price: 35.0, category: "chocolates", emoji: "🍫" },
  { name: "Kit Trufas Artesanais", price: 55.0, category: "chocolates", emoji: "🍬" },
  { name: "Box Bestsellers", price: 69.9, category: "livros", emoji: "📖" },
  { name: "Livro de Receitas", price: 39.9, category: "livros", emoji: "👨‍🍳" },
  { name: "Jogo de Cartas UNO", price: 19.9, category: "jogos", emoji: "🃏" },
  { name: "Jogo Imagem e Ação", price: 79.9, category: "jogos", emoji: "🎭" },
  { name: "Meias Divertidas", price: 24.9, category: "engracados", emoji: "🧦" },
  { name: "Almofada de Pum", price: 19.9, category: "engracados", emoji: "💨" },
  { name: "Vela Aromática", price: 34.9, category: "decoracao", emoji: "🕯️" },
  { name: "Luminária LED", price: 89.9, category: "decoracao", emoji: "💡" },
  { name: "Porta-Retrato Digital", price: 99.9, category: "tecnologia", emoji: "🖼️" },
];

const Presentes = () => {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = allGifts.filter((g) => {
    if (activeCategory !== "todos" && g.category !== activeCategory) return false;
    if (maxPrice && g.price > maxPrice) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              🎁 Sugestões de Presentes
            </h1>
            <p className="text-muted-foreground text-lg">
              Encontre o presente ideal com links para compra
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar presentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Price filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[null, 30, 50, 100].map((price) => (
              <Button
                key={price ?? "all"}
                variant={maxPrice === price ? "hero" : "outline"}
                size="sm"
                onClick={() => setMaxPrice(price)}
              >
                {price ? `Até R$${price}` : "Todos os preços"}
              </Button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {filtered.map((gift, i) => (
              <motion.div
                key={gift.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all border border-border group"
              >
                <div className="text-4xl mb-3">{gift.emoji}</div>
                <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {categories.find((c) => c.id === gift.category)?.label}
                </span>
                <h3 className="font-display font-semibold mt-2 mb-1 text-sm">{gift.name}</h3>
                <p className="text-lg font-bold text-secondary mb-3">
                  R$ {gift.price.toFixed(2).replace(".", ",")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                >
                  Ver no Mercado Livre
                </Button>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <div className="text-4xl mb-3">😅</div>
              <p>Nenhum presente encontrado com esses filtros</p>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Presentes;
