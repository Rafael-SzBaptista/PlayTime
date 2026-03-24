export interface ShelfGift {
  name: string;
  price: number;
  category: string;
  emoji: string;
}

export const shelfGifts: ShelfGift[] = [
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
