import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ExternalLink, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadRuntimeState, saveRuntimeState } from "@/lib/gameRuntime";

const categories = [
  { id: "todos", label: "Todos", emoji: "🎁" },
  { id: "tecnologia", label: "Tecnologia", emoji: "💻" },
  { id: "garrafas", label: "Garrafas", emoji: "🥤" },
  { id: "tenis", label: "Tênis", emoji: "👟" },
  { id: "chinelos", label: "Chinelos", emoji: "🩴" },
  { id: "alimentos", label: "Alimentos", emoji: "🍫" },
  { id: "roupas", label: "Roupas", emoji: "👕" },
  { id: "ferramentas", label: "Ferramentas", emoji: "🔧" },
  { id: "casa", label: "Casa", emoji: "🏠" },
];

const CATEGORY_IDS = new Set(categories.filter((c) => c.id !== "todos").map((c) => c.id));

interface GiftItem {
  name: string;
  price: number | null;
  category: string;
  emoji: string;
  link?: string;
  image?: string;
  params?: string[];
}

const ITEMS_PER_PAGE = 16;

interface GameContext {
  id: string;
  name: string;
  game_type: string;
  owner_id: string;
  bingo_gift_mode: "admin_only" | "participants";
  bingo_min_gifts_per_participant: number;
  /** Sorteio realizado (Amigo) ou jogo iniciado (Rouba/Bingo): sem alterar perfil/presentes */
  configLocked: boolean;
}

interface ParticipantContext {
  id: string;
}

export const getOptimizedImageSrc = (image?: string) => {
  if (!image) return image;
  // Só tenta trocar para .webp quando for asset local.
  // Para URLs externas, isso pode gerar 404 (e imagem "errada"/quebrada).
  if (image.startsWith("/") && /\.(png|jpe?g)$/i.test(image)) {
    return image.replace(/\.(png|jpe?g)$/i, ".webp");
  }
  return image;
};

const isMercadoLivreLink = (link?: string) => {
  if (!link) return false;
  const normalized = link.toLowerCase();
  return normalized.includes("meli.la/") || normalized.includes("mercadolivre.com");
};

const categorizeGift = (gift: GiftItem): string => {
  const text = `${gift.name} ${gift.category}`.toLowerCase();

  if (/(garrafa|squeeze|t(é|e)rmica|copo t(é|e)rmico|stanley)/.test(text)) return "garrafas";
  if (/(t(ê|e)nis|sneaker|corrida)/.test(text)) return "tenis";
  if (/(chinelo|sand(á|a)lia|papete|slide|havaiana)/.test(text)) return "chinelos";
  if (
    /(ferramenta|maleta|caixa de ferramentas|caixa met(á|a)lica|catraca|soquete|furadeira|parafusadeira|esmerilhadeira|chave )/.test(
      text,
    )
  ) {
    return "ferramentas";
  }
  if (
    /(tecnologia|smart|smartwatch|smartphone|tablet|celular|fone|headset|webcam|impressora|roteador|wi-fi|ssd|hd externo|pendrive|carregador|power bank|powerbank|cabo usb|monitor|teclado|mouse|bluetooth|rgb)/.test(
      text,
    )
  ) {
    return "tecnologia";
  }
  if (/(chocolate|bombom|trufa|alimento|caneca)/.test(text)) return "alimentos";
  if (/(camisa|camiseta|blusa|cal(ç|c)a|bermuda|vestido|roupa|moletom|jaqueta|meia)/.test(text))
    return "roupas";
  return "casa";
};

export const allGifts: GiftItem[] = [
  {
    name: "Samsung Galaxy A06 Dual SIM 128GB 4GB RAM",
    price: 829.99,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2wikGVf",
    image: "/produto-lista-1.webp",
  },
  {
    name: "Samsung Galaxy A07 128GB 4GB RAM",
    price: 697.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2xhSjhU",
    image: "/produto-lista-2.webp",
  },
  {
    name: "Galaxy Tab A11 64GB 4GB RAM",
    price: 931.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/1z39ZLX",
    image: "/produto-lista-3.webp",
  },
  {
    name: "Tablet Lenovo Tab 10.1 Wi-Fi 64GB 4GB RAM",
    price: 854.05,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2Lb63gx",
    image: "/produto-lista-4.webp",
  },
  {
    name: "Relógio Smartwatch Digital Inteligente GotWire Mesh Preto",
    price: 28.31,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2HKWiPq",
    image: "/produto-lista-5.webp",
  },
  {
    name: "Relógio Smartwatch Inteligente Multifuncional Preto Mesh",
    price: 25.33,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2AAanPU",
    image: "/produto-lista-6.webp",
  },
  {
    name: "Smartwatch (link fornecido)",
    price: 89.9,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2o7LrRY",
    image: "/produto-lista-7.webp",
  },
  {
    name: "Smartwatch Digital Feminino Bluetooth 41mm Rosa",
    price: 39.5,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1tn7GEE",
    image: "/produto-lista-8.webp",
  },
  {
    name: "Smartphone Samsung Galaxy A36 5G 128GB, 6GB RAM, Câmera Tripla até 50MP",
    price: 1529.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/1k5JeY6",
    image: "/produto-galaxy-a36.webp",
  },
  {
    name: "Celular Samsung Galaxy A07 256GB, 8GB RAM, Câmera 50MP, Tela 6.7\"",
    price: 899.1,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/27WdT2H",
    image: "/produto-galaxy-a07.webp",
    params: [
      "Cor: Preto",
      "Armazenamento: 256GB",
      "Memória RAM: 8GB",
      "Câmera principal: 50MP",
      "Tela: 6.7\"",
      "Proteção: IP54",
      "Processador: 6nm",
    ],
  },
  {
    name: "Smartwatch S10 Série 10 com 2 pulseiras (Preto)",
    price: 76.08,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1E6pdAV",
    image: "/produto-novo-1.webp",
  },
  {
    name: "Fone com fio compatível com iPhone (branco)",
    price: 27.26,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2KnaE84",
    image: "/produto-novo-2.webp",
  },
  {
    name: "Fone P2 com microfone e controle (nylon reforçado)",
    price: 18.52,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2msVcsQ",
    image: "/produto-novo-3.webp",
  },
  {
    name: "Fone intra-auricular com fio 3.5mm (preto)",
    price: 22.71,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1ty7EX1",
    image: "/produto-novo-4.webp",
  },
  {
    name: "Fone intra-auricular com fio 1.2m (preto)",
    price: 26.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/11SwAA6",
    image: "/produto-novo-5.webp",
  },
  {
    name: "Fone JBL C50HI intra-auricular com fio (preto)",
    price: 53.1,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/24J2x9Z",
    image: "/produto-novo-6.webp",
  },
  {
    name: "Fone intra-auricular com fio 1.2m (variação)",
    price: 26.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/11SwAA6",
    image: "/produto-novo-7.webp",
  },
  {
    name: "Fone bluetooth F9-5 com estojo e powerbank",
    price: 24.79,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2hWJtmL",
    image: "/produto-novo-8.webp",
  },
  {
    name: "Fone bluetooth esportivo XT80/LP75 (preto)",
    price: 56.26,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1fAtjH7",
    image: "/produto-novo-9.webp",
  },
  {
    name: "Fone bluetooth sem fio Pro 4 (branco)",
    price: 24.39,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2pg6mSv",
    image: "/produto-novo-10.webp",
  },
  {
    name: "Fone bluetooth TWS Kaidi KD780 (preto)",
    price: 38.72,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1B4Crz4",
    image: "/produto-novo-11.webp",
  },
  {
    name: "Fone bluetooth 5.0 par sem fio (preto)",
    price: 23.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1doCQEQ",
    image: "/produto-novo-12.webp",
  },
  {
    name: "Headphone bluetooth Dapon H02d over-ear (azul)",
    price: 78.11,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1rsSkjf",
    image: "/produto-novo-13.webp",
  },
  {
    name: "Fone over-ear sem fio Hi-Fi com microfone",
    price: 63.05,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2sNtTNb",
    image: "/produto-novo-14.webp",
  },
  {
    name: "Fone Philco PFO02P Wave Flat (preto)",
    price: 73.37,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2F7vWmV",
    image: "/produto-novo-15.webp",
  },
  {
    name: "Caixinha de Som Bluetooth portátil com USB/SD (preta)",
    price: 29.79,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1qTM1io",
    image: "/produto-caixa-1.webp",
  },
  {
    name: "Inova Caixa de Som Mini Bluetooth TWS (grave potente)",
    price: 66.0,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1B5JvmW",
    image: "/produto-caixa-2.webp",
  },
  {
    name: "Caixa de Som Speaker Philco Extreme 35W PBS35",
    price: 125.1,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1BVU7cW",
    image: "/produto-caixa-3.webp",
  },
  {
    name: "Caixa de Som Bluetooth boombox 2 alto-falantes 10W",
    price: 144.03,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1WQpiRR",
    image: "/produto-caixa-4.webp",
  },
  {
    name: "Caixa de Som Bluetooth TWS estéreo Hi-Fi",
    price: 78.0,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1fj1XuY",
    image: "/produto-caixa-5.webp",
  },
  {
    name: "Caixa de Som Bluetooth portátil JBL Go 4 (azul)",
    price: 270.52,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1vfezFg",
    image: "/produto-caixa-6.webp",
  },
  {
    name: "Monitor Gamer Samsung 24\" FHD 120Hz (S3)",
    price: 608.0,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/1f8nbSd",
    image: "/produto-setup-1.webp",
  },
  {
    name: "Monitor LG UltraGear 24\" FHD 144Hz 1ms",
    price: 699.0,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/33GwYVx",
    image: "/produto-setup-2.webp",
  },
  {
    name: "Monitor Gamer LG 24MS500-B 24\" IPS Full HD 100Hz",
    price: 579.51,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/1d1RJ6f",
    image: "/produto-setup-3.webp",
  },
  {
    name: "Teclado para Acer A515/A315 NSK-RL0SW (preto)",
    price: 53.25,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/26H1w5C",
    image: "/produto-setup-4.webp",
  },
  {
    name: "Teclado USB com fio ABNT2 Pholex (preto)",
    price: 27.27,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/1i1G3gd",
    image: "/produto-setup-5.webp",
  },
  {
    name: "Teclado Logitech K120 com fio USB ABNT2",
    price: 61.87,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/2S4r9Eu",
    image: "/produto-setup-6.webp",
  },
  {
    name: "Teclado Gamer Semi Mecânico LED RGB ABNT2",
    price: 55.99,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/1osdcnS",
    image: "/produto-setup-7.webp",
  },
  {
    name: "Teclado Gamer Semi Mecânico Newdragon ND-2086 RGB",
    price: 44.9,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/1jyp2Tp",
    image: "/produto-setup-8.webp",
  },
  {
    name: "Mouse sem fio recarregável RGB ergonômico",
    price: 19.79,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/25HwFCj",
    image: "/produto-mouse-1.webp",
  },
  {
    name: "Mouse com fio ergonômico ambidestro USB (Piracomp)",
    price: 20.99,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/1FMzSNF",
    image: "/produto-mouse-2.webp",
  },
  {
    name: "Mouse Gamer Logitech G203 RGB Lightsync",
    price: 99.0,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/2wmvdwK",
    image: "/produto-mouse-3.webp",
  },
  {
    name: "Kit Mouse 3600 DPI RGB + Mousepad Armory Warrior",
    price: 28.4,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/2mTBMyX",
    image: "/produto-mouse-4.webp",
  },
  {
    name: "Mouse sem fio Logitech M170 preto",
    price: 59.9,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/33J3v44",
    image: "/produto-mouse-5.webp",
  },
  {
    name: "Mouse com fio HP 150 USB preto",
    price: 38.9,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/2BP5Q2g",
    image: "/produto-mouse-6.webp",
  },
  {
    name: "Mouse Gamer RGB Fortrek Crusader Black Edition",
    price: 78.16,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/15dUV44",
    image: "/produto-mouse-7.webp",
  },
  {
    name: "Mouse gamer com fio USB óptico LED RGB 2400 DPI",
    price: 68.57,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/1jJzFGF",
    image: "/produto-mouse-8.webp",
  },
  {
    name: "Webcam Full HD 1080p GoodVision com microfone",
    price: 35.99,
    category: "tecnologia",
    emoji: "📷",
    link: "https://meli.la/1pCkW5H",
    image: "/produto-cam-print-1.webp",
  },
  {
    name: "Webcam HP 320 FHD (53X26AA) preta",
    price: 161.41,
    category: "tecnologia",
    emoji: "📷",
    link: "https://meli.la/15Ds5nW",
    image: "/produto-cam-print-2.webp",
  },
  {
    name: "Webcam Intelbras HD WCI 720p",
    price: 129.9,
    category: "tecnologia",
    emoji: "📷",
    link: "https://meli.la/24juaFw",
    image: "/produto-cam-print-3.webp",
  },
  {
    name: "Impressora Multifuncional HP Smart Tank 581",
    price: 909.0,
    category: "tecnologia",
    emoji: "🖨️",
    link: "https://meli.la/22ZZmxu",
    image: "/produto-cam-print-4.webp",
  },
  {
    name: "Impressora Multifuncional HP DeskJet Ink Advantage 2874",
    price: 490.9,
    category: "tecnologia",
    emoji: "🖨️",
    link: "https://meli.la/2mntTQY",
    image: "/produto-cam-print-5.webp",
  },
  {
    name: "Mini impressora de etiquetas Bluetooth portátil",
    price: 125.16,
    category: "tecnologia",
    emoji: "🖨️",
    link: "https://meli.la/2Z6y8bv",
    image: "/produto-cam-print-6.webp",
  },
  {
    name: "Repetidor Amplificador Bahrein 1800Mbps Extensor Sinal Wi-Fi",
    price: 43.9,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/132BV13",
    image: "/produto-tech-extra-1.webp",
  },
  {
    name: "Repetidor de Sinal Wi-Fi Roteador Wireless Inv Tech",
    price: 75.9,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/33Ec2tK",
    image: "/produto-tech-extra-2.webp",
  },
  {
    name: "Roteador TP-Link AX12 Wi-Fi 6 Archer AX1500 Dual Band",
    price: 170.5,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/1dUjEma",
    image: "/produto-tech-extra-3.webp",
  },
  {
    name: "Extensor Wi-Fi 5 Twibi Force Plug Giga Intelbras",
    price: 158.46,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/2rPXfvx",
    image: "/produto-tech-extra-4.webp",
  },
  {
    name: "Roteador Mercusys MR30G AC1200 Gigabit Wireless Dual Band",
    price: 109.97,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/29vy1U9",
    image: "/produto-tech-extra-5.webp",
  },
  {
    name: "HD Externo Infokit 320GB USB 3.0",
    price: 99,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/1Y8LJBn",
    image: "/produto-tech-extra-6.webp",
  },
  {
    name: "HD Externo Exbom 500GB USB 3.1 Tipo-C Slim",
    price: 175,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/2yqAVYw",
    image: "/produto-tech-extra-7.webp",
  },
  {
    name: "SSD Interno 120GB 2.5 SATA3 Spreaker Gamer",
    price: 162.49,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/1MZXRqK",
    image: "/produto-tech-extra-8.webp",
  },
  {
    name: "Pendrive 16GB USB 2.0 Compacto Brasiliana Tech",
    price: 26.5,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/2Yt1KYp",
    image: "/produto-tech-extra-9.webp",
  },
  {
    name: "Pen Drive 32GB Mini USB 2.0 Chaveiro Metálico",
    price: 28.79,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/2GgU3Vn",
    image: "/produto-tech-extra-10.webp",
  },
  {
    name: "Unidade Flash USB Kingston 64GB 3.2 Exodia M",
    price: 64.9,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/296URde",
    image: "/produto-tech-extra-11.webp",
  },
  {
    name: "Carregador Turbo Duplo 40W USB Tipo C para iPhone",
    price: 39.89,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/1vfd472",
    image: "/produto-tech-extra-12.webp",
  },
  {
    name: "Power Bank 20.000mAh Maxnova com Display",
    price: 77.8,
    category: "tecnologia",
    emoji: "🔋",
    link: "https://meli.la/16G3mif",
    image: "/produto-tech-extra-13.webp",
  },
  {
    name: "Carregador Turbo Rápido 50W Tipo C Compatível Motorola",
    price: 28.49,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2HrHptY",
    image: "/produto-tech-extra-14.webp",
  },
  {
    name: "Carregador Turbo Power Motorola 125W USB-C",
    price: 54.99,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2D1B5R3",
    image: "/produto-tech-extra-15.webp",
  },
  {
    name: "Bateria Portátil Kapbom 10.000mAh",
    price: 53.46,
    category: "tecnologia",
    emoji: "🔋",
    link: "https://meli.la/2PhQjMz",
    image: "/produto-tech-extra-16.webp",
  },
  {
    name: "Carregador Turbo Compatível Samsung A10/A01/A02/A03/J7/J8/S7",
    price: 24.99,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/18nyja5",
    image: "/produto-tech-extra-17.webp",
  },
  {
    name: "Carregador Portátil Powerbank Turbo 20.000mAh com Cabos Embutidos",
    price: 86.61,
    category: "tecnologia",
    emoji: "🔋",
    link: "https://meli.la/25u5LFN",
    image: "/produto-tech-extra-18.webp",
  },
  {
    name: "Cabo Carregador Compatível com iPhone (Tipo C) Branco",
    price: 19.06,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2siSpEV",
    image: "/produto-cabo-extra-1.webp",
  },
  {
    name: "Cabo USB-C Duplo Compatível Samsung/iPhone (Preto)",
    price: 27.69,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2KoH2cv",
    image: "/produto-cabo-extra-2.webp",
  },
  {
    name: "Kit 2 Cabos HDMI 3m 4K 3D Conector Dourado",
    price: 32.95,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/1EboT3z",
    image: "/produto-cabo-extra-3.webp",
  },
  {
    name: "Cabo de Áudio Mono P10 para P10 5 Metros",
    price: 22.9,
    category: "tecnologia",
    emoji: "🎸",
    link: "https://meli.la/2NFV3s4",
    image: "/produto-cabo-extra-4.webp",
  },
  {
    name: "Cabo Flexível 2,5mm Rolo 100 Metros 750v",
    price: 59.95,
    category: "tecnologia",
    emoji: "🧰",
    link: "https://meli.la/276UWMu",
    image: "/produto-cabo-extra-5.webp",
  },
  {
    name: "Headset Gamer Havit Gamenote H2026d RGB Preto/Prata",
    price: 76.53,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2EpRB1N",
    image: "/produto-headset-rgb-1.webp",
  },
  {
    name: "Headset Gamer USB Led Evolut EG310 com Microfone",
    price: 78.93,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2SauChU",
    image: "/produto-headset-rgb-2.webp",
  },
  {
    name: "Headset Gamer Havit H2232d RGB Camuflado Cinza",
    price: 76.9,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1iag8mB",
    image: "/produto-headset-rgb-3.webp",
  },
  {
    name: "Fone de Ouvido Headset Gamer RGB Led (Shop Borges)",
    price: 51.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1YLGPzA",
    image: "/produto-headset-rgb-4.webp",
  },
  {
    name: "Headset Gamer Havit H2002d com Mic Removível (Branco)",
    price: 216.52,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/24UddAa",
    image: "/produto-headset-rgb-5.webp",
  },
  {
    name: "Headset Gamer Redragon Zeus Pro RGB Wireless 7.1",
    price: 317.9,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1hUWivv",
    image: "/produto-headset-rgb-6.webp",
  },
  {
    name: "Headset Gamer Redragon Pelias Preto H130",
    price: 74.9,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2fsMWNR",
    image: "/produto-headset-rgb-7.webp",
  },
  {
    name: "Kit Iluminação Interior Carro RGB com Controle 12v",
    price: 32.49,
    category: "tecnologia",
    emoji: "🚗",
    link: "https://meli.la/2HG7aFs",
    image: "/produto-headset-rgb-8.webp",
  },
  {
    name: "RGB Mini Portátil com Clipe Iluminador Led USB",
    price: 36.86,
    category: "tecnologia",
    emoji: "💡",
    link: "https://meli.la/1mdANYg",
    image: "/produto-headset-rgb-9.webp",
  },
  {
    name: "Kit 2 Lâmpadas Led Giratórias Coloridas RGB",
    price: 30.76,
    category: "tecnologia",
    emoji: "💡",
    link: "https://meli.la/2WR7dsW",
    image: "/produto-headset-rgb-10.webp",
  },
  {
    name: "Fita Led Decorativa RGB 2 Metros USB com Controle",
    price: 27.99,
    category: "tecnologia",
    emoji: "💡",
    link: "https://meli.la/2U7cg4E",
    image: "/produto-headset-rgb-11.webp",
  },
  {
    name: "Relógio despertador retrô analógico duplo sino (prateado)",
    price: 34.99,
    category: "decoracao",
    emoji: "⏰",
    link: "https://meli.la/1TTeB6p",
    image: "/produto-meli-catalog-1.webp",
  },
  {
    name: "Smartwatch Heyplus C1 2,01\" Bluetooth chamadas saúde IP68 (preto)",
    price: 59.99,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1mZezhM",
    image: "/produto-meli-catalog-2.webp",
  },
  {
    name: "Relógio digital Skmei 1251 pulseira verde musgo",
    price: 51.49,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1awwwen",
    image: "/produto-meli-catalog-3.webp",
  },
  {
    name: "Relógio digital Skmei 1142 à prova d'água (preto)",
    price: 57.65,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/32uEqRb",
    image: "/produto-meli-catalog-4.webp",
  },
  {
    name: "Despertador digital Micgeek mesa cabeceira (branco)",
    price: 24.4,
    category: "decoracao",
    emoji: "⏰",
    link: "https://meli.la/2g3NAHe",
    image: "/produto-meli-catalog-5.webp",
  },
  {
    name: "Relógio de pulso Wokai pulseira couro unissex",
    price: 27.55,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2F5jVXd",
    image: "/produto-meli-catalog-6.webp",
  },
  {
    name: "Capinha anti shock Samsung Galaxy A07 6,7\" + película",
    price: 19.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2Vt73gS",
    image: "/produto-meli-catalog-7.webp",
  },
  {
    name: "Película vidro temperado 3D anti choque Xiaomi Poco X7 5G",
    price: 26.76,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2se7BvN",
    image: "/produto-meli-catalog-8.webp",
  },
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

  // Garrafas térmicas / squeezes (Mercado Livre — preços promocionais aproximados)
  {
    name: "Garrafa térmica 800ml inox squeeze academia (quente e frio)",
    price: 36.54,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1ayWcwy",
    image: "/produto-termo-01.webp",
  },
  {
    name: "Garrafa squeeze água academia esportiva com alça 660ml",
    price: 24.99,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2jXeoh4",
    image: "/produto-termo-02.webp",
  },
  {
    name: "Garrafa térmica 800ml inox fitness academia personalizada",
    price: 51.33,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1QBWCjE",
    image: "/produto-termo-03.webp",
  },
  {
    name: "Garrafa água térmica 600ml nome/time gravado a laser",
    price: 58.48,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2NkV3pG",
    image: "/produto-termo-04.webp",
  },
  {
    name: "Garrafa térmica 500ml antivazamento (azul)",
    price: 27.49,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1MKtE44",
    image: "/produto-termo-05.webp",
  },
  {
    name: "Garrafa térmica Verona pressão ampola vidro 1,8L Unitermi (preta)",
    price: 65.99,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1JDCXCx",
    image: "/produto-termo-06.webp",
  },
  {
    name: "Garrafa térmica 750ml Siena bico antigota Unitermi (preta)",
    price: 32.97,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1LYEZ5d",
    image: "/produto-termo-07.webp",
  },
  {
    name: "Garrafa térmica café 1L nórdica cabo madeira mesa posta (preta)",
    price: 49.49,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/19AEFNw",
    image: "/produto-termo-08.webp",
  },
  {
    name: "Garrafa térmica Termolar Lúmina bomba de pressão 1L",
    price: 78.99,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/196oENm",
    image: "/produto-termo-09.webp",
  },
  {
    name: "Garrafa térmica 1200ml vácuo água gelada e café (verde-musgo)",
    price: 52.37,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1E1AzMu",
    image: "/produto-termo-10.webp",
  },
  {
    name: "Garrafa térmica 500ml inox dupla camada antivazamento Swave (preto)",
    price: 36.9,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2sML7CY",
    image: "/produto-termo-11.webp",
  },
  {
    name: "Garrafa térmica 500ml smart cup termômetro digital (preto)",
    price: 24.43,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/216cRpE",
    image: "/produto-termo-12.webp",
  },
  {
    name: "Copo garrafa térmica 1,2L inox com tampa e canudo (rosa-claro)",
    price: 49.95,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2KCae4h",
    image: "/produto-termo-13.webp",
  },
  {
    name: "Garrafa térmica Super Thermo Thermolar 5L (preta)",
    price: 45.9,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2Uz7V3C",
    image: "/produto-termo-14.webp",
  },
  {
    name: "Garrafa térmica café bomba pressão 1L inox Lumina Termolar (prateada)",
    price: 77.29,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2XijXdy",
    image: "/produto-termo-15.webp",
  },
  {
    name: "Garrafa térmica inox 500ml camping viagem (metálico)",
    price: 39.57,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/2WRHRDB",
    image: "/produto-termo-16.webp",
  },
  {
    name: "Garrafa térmica 1L inox água gelada 24h / quente 12h (prateado)",
    price: 41.8,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/17pHDJi",
    image: "/produto-termo-17.webp",
  },
  {
    name: "Garrafa térmica Florença 650ml Unitermi (branco)",
    price: 33.42,
    category: "decoracao",
    emoji: "🥤",
    link: "https://meli.la/1HiZeU1",
    image: "/produto-termo-18.webp",
  },

  // Ferramentas e kits (Mercado Livre — preços promocionais aproximados)
  {
    name: "Kit ferramenta 46 peças Space Eye maleta portátil (vermelho)",
    price: 29.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/126DHWQ",
    image: "/produto-ferramenta-01.webp",
  },
  {
    name: "Furadeira parafusadeira 48V com 2 baterias e maleta (amarelo)",
    price: 128.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2X89tDV",
    image: "/produto-ferramenta-02.webp",
  },
  {
    name: "Jogo de ferramentas 129 peças com maleta Fasterr (preto)",
    price: 93.95,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1HodrWi",
    image: "/produto-ferramenta-03.webp",
  },
  {
    name: "Bolsa lona para ferramentas Fasterr FST058 fundo emborrachado",
    price: 74.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1pz8iqC",
    image: "/produto-ferramenta-04.webp",
  },
  {
    name: "Jogo chave combinada 12 peças 6–22 mm The Black Tools IF-12",
    price: 59.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2PmkBSW",
    image: "/produto-ferramenta-05.webp",
  },
  {
    name: "Chave de impacto / parafusadeira 48V Several Importados (azul)",
    price: 256,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2JeRJfn",
    image: "/produto-ferramenta-06.webp",
  },
  {
    name: "Kit ferramentas VDE isoladas 13 peças Gamma G19566AC",
    price: 299.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1WLjXUz",
    image: "/produto-ferramenta-07.webp",
  },
  {
    name: "Kit catraca e soquete 46 peças Indufer (maleta)",
    price: 29.09,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1LYoJKT",
    image: "/produto-ferramenta-08.webp",
  },
  {
    name: "Chave de impacto manual Snel SN32 com bits fenda/Philips",
    price: 52.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2cAUUdz",
    image: "/produto-ferramenta-09.webp",
  },
  {
    name: "Bolsa de ferramentas lona 14\" C'HE N.Y.C. (verde)",
    price: 39.99,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1yF5nqV",
    image: "/produto-ferramenta-10.webp",
  },
  {
    name: "Bolsa de ferramentas lona grossa multifuncional (verde-escuro)",
    price: 34.99,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2zdj8iw",
    image: "/produto-ferramenta-11.webp",
  },
  {
    name: "Esmerilhadeira angular 4½\" + kit soquetes 40 peças The Black Tools",
    price: 169.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2mnX93Q",
    image: "/produto-ferramenta-12.webp",
  },
  {
    name: "Kit 225 anéis de vedação O-ring borracha 18 tamanhos (estojo)",
    price: 23.34,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/18XktT6",
    image: "/produto-ferramenta-13.webp",
  },

  // Maletas, ferramentas e iluminação (Mercado Livre — preços promocionais aproximados)
  {
    name: "Tramontina 43800005 — caixa sanfonada para ferramentas 5 gavetas (azul)",
    price: 128.52,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1fhcttt",
    image: "/produto-extra-01.webp",
  },
  {
    name: "Fercar 07 — caixa de ferramentas metal 5 gavetas 20×50×21 cm (azul)",
    price: 140.9,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1SnKYVk",
    image: "/produto-extra-02.webp",
  },
  {
    name: "São Bernardo CF-32 — caixa plástica 7 compartimentos (preto e amarelo)",
    price: 23.18,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1EiFnm1",
    image: "/produto-extra-03.webp",
  },
  {
    name: "Vonder OPV222 — maleta organizadora dupla face 32 compartimentos (preto)",
    price: 76,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1p4RWkx",
    image: "/produto-extra-04.webp",
  },
  {
    name: "Kit 6 maletas de ferramentas reforçadas pequena e grande (VYROX)",
    price: 57.54,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1nGoUgt",
    image: "/produto-extra-05.webp",
  },
  {
    name: "Rotterman RLL-09 — caixa de ferramentas metal 20×50×25 cm (preta)",
    price: 159.71,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/1gYV8xS",
    image: "/produto-extra-06.webp",
  },
  {
    name: "Metasul — caixa de ferramentas tática 18,3 pol. fecho metal (laranja)",
    price: 47.99,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2mBXq5c",
    image: "/produto-extra-07.webp",
  },
  {
    name: "Vonder — caixa metálica tipo baú para ferramentas 35 cm sem bandeja (preta)",
    price: 59.99,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2Ejx5Lo",
    image: "/produto-extra-08.webp",
  },
  {
    name: "Aiwa — jogo chave catraca e soquetes 40 peças 3/8\" com estojo",
    price: 28.12,
    category: "decoracao",
    emoji: "🔧",
    link: "https://meli.la/2RHLbGn",
    image: "/produto-extra-09.webp",
  },
  {
    name: "Plafon LED 30×30 sobrepor bivolt 32 W branco frio 110/220 V",
    price: 42.5,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/2X6kGnX",
    image: "/produto-extra-10.webp",
  },
  {
    name: "Luminária barra LED 60 cm sensor movimento USB recarregável (branco)",
    price: 33.9,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/1vkHQuT",
    image: "/produto-extra-11.webp",
  },
  {
    name: "Arandela slim preta externa + lâmpada LED inclusa (frisos)",
    price: 26.9,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/23cv1U7",
    image: "/produto-extra-12.webp",
  },
  {
    name: "Luminária de mesa abajur articulada bivolt quarto/escritório",
    price: 38.99,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/2RzDVL5",
    image: "/produto-extra-13.webp",
  },
  {
    name: "Luminária LED lua 3D abajur decoração 12 cm luz noturna (quente)",
    price: 19,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/2m1xJxQ",
    image: "/produto-extra-14.webp",
  },
  {
    name: "Kit trilho 1 m + 4 spots LED 10 W preto/branco (6500K/4000K/3000K)",
    price: 55.8,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/1AgP7CH",
    image: "/produto-extra-15.webp",
  },
  {
    name: "Kit 4 arandelas solares LED parede jardim externa IP65 luz quente",
    price: 51.4,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/1Z1jGKW",
    image: "/produto-extra-16.webp",
  },
  {
    name: "Kit 2 luminárias de parede LED 3 tons recarregável magnética (preto)",
    price: 57.33,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/1BQaKDc",
    image: "/produto-extra-17.webp",
  },
  {
    name: "Luminária barra LED para monitor/notebook USB recarregável Endeca (preto)",
    price: 78.99,
    category: "decoracao",
    emoji: "💡",
    link: "https://meli.la/1MTbnXE",
    image: "/produto-extra-18.webp",
  },

  // Links Mercado Livre (preços conforme anúncio)
  {
    name: "Kit 2 Poltronas Decorativas Opala (suede) — sala/recepção",
    price: 381.83,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/2M8imrD",
    image: "/produto-casa-01.webp",
  },
  {
    name: "Sofá decorativo (courino) com almofadas — recepção/clínica (preto)",
    price: 799.99,
    category: "decoracao",
    emoji: "🛋️",
    link: "https://meli.la/1Q2Y4Nu",
    image: "/produto-casa-02.webp",
  },
  {
    name: "Cadeira de jantar Charles Eames Eiffel — madeira preta",
    price: 78.99,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/2YWsAXX",
    image: "/produto-casa-03.webp",
  },
  {
    name: "Cadeira de escritório diretor Tok Begônia — estofado preto",
    price: 138.25,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/12xwHB7",
    image: "/produto-casa-05.webp",
  },
  {
    name: "Cadeira de escritório preta giratória 3310 com braços (mesh/náilon)",
    price: 184.9,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/2qHwjhv",
    image: "/produto-casa-04.webp",
  },
  {
    name: "Cortina Blackout em tecido 3,00x2,80 corta luz (cinza)",
    price: 74.99,
    category: "casa",
    emoji: "🪟",
    link: "https://meli.la/2RCHKha",
    image: "/Cortina Blacout Em Tecido.webp",
  },
  {
    name: "Cortina Blackout tecido grosso 2,80x2,30 (porta/sala/quarto)",
    price: 78.9,
    category: "casa",
    emoji: "🪟",
    link: "https://meli.la/1fcVXbP",
    image: "/Cortina Blackout Tecido Grosso.webp",
  },
  {
    name: "Cortina Blackout corta luz blecaute 2,80 x 2,30 (creme)",
    price: 58.19,
    category: "casa",
    emoji: "🪟",
    link: "https://meli.la/17Jjafu",
    image: "/Cortina Blackout Corta Luz Blecaute.webp",
  },
  {
    name: "Tapete sala/quarto 2,00x0,60 shaggy peludo rose mesclado",
    price: 38.9,
    category: "casa",
    emoji: "🧶",
    link: "https://meli.la/224HZD2",
    image: "/Tapete Sala Quarto Shaggy.webp",
  },
  {
    name: "Tapete 2,00x1,50 peludo felpudo sala e quarto (bege mesclado)",
    price: 59.89,
    category: "casa",
    emoji: "🧶",
    link: "https://meli.la/31UT3vE",
    image: "/Tapete Peludo Felpudo.webp",
  },
  {
    name: "Jogo tapetes cozinha antiderrapante geométrico Sato 3 peças (cairo preto)",
    price: 39.68,
    category: "casa",
    emoji: "🧶",
    link: "https://meli.la/1Y49gAz",
    image: "/Jogo Tapetes Cozinha Antiderapante.webp",
  },
  {
    name: "Casa Laura Enxovais tapete felpudo 2,00x1,50 peludo macio shaggy (bege-claro)",
    price: 54.64,
    category: "casa",
    emoji: "🧶",
    link: "https://meli.la/1vhf1bj",
    image: "/Casa Laura Enxovais Tapete.webp",
  },
  {
    name: "Tapetes cozinha antiderrapante geométrico 3 peças (havana cinza)",
    price: 49.59,
    category: "casa",
    emoji: "🧶",
    link: "https://meli.la/2i95jCL",
    image: "/Tapte Coziha Antiderrapante.webp",
  },
  {
    name: "Tapete passadeira 2,00x0,60 quarto pé de cama luxo conforto",
    price: 39.0,
    category: "casa",
    emoji: "🧶",
    link: "https://meli.la/1Hxfx1Z",
    image: "/Tapete Passadeira 2,00x0,60.webp",
  },
  {
    name: "Espelho Adnet redondo decorativo 30cm para banheiro/quarto/sala",
    price: 26.94,
    category: "casa",
    emoji: "🪞",
    link: "https://meli.la/12kyhmo",
    image: "/Espelho Adnet Redondo.webp",
  },
  {
    name: "Espelho Rocco retangular 90x40 cm parede luxo com suporte",
    price: 78.9,
    category: "casa",
    emoji: "🪞",
    link: "https://meli.la/2ZCgsSW",
    image: "/Espelho Roco.webp",
  },
  {
    name: "Tênis masculino leve esportivo confortável promoção",
    price: 69.99,
    category: "tenis",
    emoji: "👟",
    link: "https://meli.la/1HFrk5s",
    image: "/produto-sug-tenis-1.webp",
  },
  {
    name: "Tênis social (sapato ortopédico) ultra confortável e leve + cinto",
    price: 63.99,
    category: "tenis",
    emoji: "👞",
    link: "https://meli.la/1kSn6r5",
    image: "/produto-sug-tenis-2.webp",
  },
  {
    name: "Tênis masculino sapatênis Polo Feet casual promoção",
    price: 62.98,
    category: "tenis",
    emoji: "👟",
    link: "https://meli.la/1h1X5MG",
    image: "/produto-sug-tenis-3.webp",
  },
  {
    name: "Tênis loafer masculino mocassim casual comfort luxo",
    price: 109.74,
    category: "tenis",
    emoji: "👞",
    link: "https://meli.la/16dfotC",
    image: "/produto-sug-tenis-4.webp",
  },
  {
    name: "Tênis branco academia caminhada esportivo confortável",
    price: 69.9,
    category: "tenis",
    emoji: "👟",
    link: "https://meli.la/1WgDodY",
    image: "/produto-sug-tenis-5.webp",
  },
  {
    name: "Sapato loafer masculino mocassim couro casual comfort luxo",
    price: 109.94,
    category: "tenis",
    emoji: "👞",
    link: "https://meli.la/2jEFT3o",
    image: "/produto-sug-ch-tenis-1.webp",
  },
  {
    name: "Tênis masculino casual Saymon Queen couro original branco",
    price: 75.04,
    category: "tenis",
    emoji: "👟",
    link: "https://meli.la/1SthM9D",
    image: "/produto-sug-ch-tenis-2.webp",
  },
  {
    name: "Babuche Yvate sandália ortopédica faixa branca EVA original",
    price: 41.9,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/21zGwmU",
    image: "/produto-sug-ch-tenis-3.webp",
  },
  {
    name: "Chinelo Havaianas masculino Power 2.0 anatômica massageadora",
    price: 69.99,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/1j2VDWY",
    image: "/produto-sug-ch-tenis-4.webp",
  },
  {
    name: "Chinelo Havaianas Top liso branco unissex",
    price: 29.44,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/2mKJmkH",
    image: "/produto-sug-ch-tenis-5.webp",
  },
  {
    name: "Chinelo feminino Havaianas Slim preto liso",
    price: 40.73,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/1dXUaGT",
    image: "/produto-sug-ch-tenis-6.webp",
  },
  {
    name: "Chinelo masculino Havaianas Dual tiras largas macio",
    price: 54.99,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/2eX5QHU",
    image: "/produto-sug-ch-tenis-7.webp",
  },
  {
    name: "Chinelo Havaianas Top legítimas original unissex",
    price: 29.91,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/2vm7BHn",
    image: "/produto-sug-ch-tenis-8.webp",
  },
  {
    name: "Chinelo Havaianas Top The Simpsons unissex",
    price: 59.24,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/343k6Wb",
    image: "/produto-sug-ch-tenis-9.webp",
  },
  {
    name: "Chinelo Havaianas Slim Pets gato/cachorro original",
    price: 47.95,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/2k9LDu7",
    image: "/produto-sug-ch-tenis-10.webp",
  },
  {
    name: "Chinelo Rider Drip Slide masculino monobloco",
    price: 69.99,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/11cZ6dB",
    image: "/produto-sug-ch-tenis-11.webp",
  },
  {
    name: "Chinelo Babuche Boaonda Easy macio leve feminino",
    price: 54.99,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/2SEQH1K",
    image: "/produto-sug-ch-tenis-12.webp",
  },
  {
    name: "Chinelo feminino Havaianas Slim sandália feminina",
    price: 40.73,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/2cBG9Qm",
    image: "/produto-sug-ch-tenis-13.webp",
  },
  {
    name: "Chinelo feminino Havaianas Slim Organic Floral original",
    price: 49.99,
    category: "chinelos",
    emoji: "🩴",
    link: "https://meli.la/17HVreQ",
    image: "/produto-sug-ch-tenis-14.webp",
  },
  {
    name: "Calça jeans masculina skinny com elastano Lycra",
    price: 37.91,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/1FR2qxj",
    image: "/produto-sug-moda-01.webp",
  },
  {
    name: "Kit 3 camisas academia masculina dry fit treino slim fit",
    price: 57.1,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/1M1Tbwi",
    image: "/produto-sug-moda-02.webp",
  },
  {
    name: "Kit conjunto fitness feminino + camiseta academia roxa",
    price: 55.88,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/1XYdqHJ",
    image: "/produto-sug-moda-03.webp",
  },
  {
    name: "Calça jeans feminina cós alto skinny Patria Brasil",
    price: 69.99,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/2TiykKL",
    image: "/produto-sug-moda-04.webp",
  },
  {
    name: "Vestido longo casual festa alça grossa fenda elegante",
    price: 38.94,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/25jXRqM",
    image: "/produto-sug-moda-05.webp",
  },
  {
    name: "Bermuda cargo masculina sarja preta bolso lateral com cordão",
    price: 39.99,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/1tQdPvj",
    image: "/produto-sug-moda-06.webp",
  },
  {
    name: "Calça sarja social masculina esporte fino com elastano",
    price: 78.9,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/1oJrwNk",
    image: "/produto-sug-moda-07.webp",
  },
  {
    name: "Blusa feminina muscle tee viscolycra clássica casual chic",
    price: 28.12,
    category: "roupas",
    emoji: "👕",
    link: "https://meli.la/2TMWeEP",
    image: "/produto-sug-moda-08.webp",
  },
];

const Presentes = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("todos");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [gameContext, setGameContext] = useState<GameContext | null>(null);
  const [participantContext, setParticipantContext] = useState<ParticipantContext | null>(null);
  const [wishlistByName, setWishlistByName] = useState<Map<string, string>>(new Map());
  const [bingoGiftNames, setBingoGiftNames] = useState<Set<string>>(new Set());
  const [savingGiftName, setSavingGiftName] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const gameSlug = searchParams.get("gameSlug")?.trim() ?? "";
  const hasGameContext = Boolean(gameSlug);

  const normalizedGifts = useMemo(
    () =>
      allGifts
        .filter((g) => isMercadoLivreLink(g.link))
        .map((g) => ({
          ...g,
          // Respeita a categoria explícita do item; usa auto-categorização só para legados/inválidos.
          category: CATEGORY_IDS.has(g.category) ? g.category : categorizeGift(g),
        })),
    [],
  );

  const filtered = useMemo(
    () =>
      normalizedGifts.filter((g) => {
        if (activeCategory !== "todos" && g.category !== activeCategory) return false;
        if (minPrice !== null || maxPrice !== null) {
          if (g.price === null) return false;
          if (minPrice !== null && g.price < minPrice) return false;
          if (maxPrice !== null && g.price > maxPrice) return false;
        }
        if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [activeCategory, minPrice, maxPrice, search, normalizedGifts],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, minPrice, maxPrice, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGifts = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  useEffect(() => {
    const loadContext = async () => {
      if (!hasGameContext || !user) {
        setGameContext(null);
        setParticipantContext(null);
        setWishlistByName(new Map());
        setBingoGiftNames(new Set());
        return;
      }

      setLoadingContext(true);

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, name, game_type, owner_id, bingo_gift_mode, bingo_min_gifts_per_participant")
        .eq("slug", gameSlug)
        .single();

      if (gameError || !game) {
        setGameContext(null);
        setParticipantContext(null);
        setWishlistByName(new Map());
        setBingoGiftNames(new Set());
        setLoadingContext(false);
        return;
      }

      const bingoMode =
        (game as { bingo_gift_mode?: string }).bingo_gift_mode === "participants"
          ? "participants"
          : "admin_only";
      const bingoMin =
        typeof (game as { bingo_min_gifts_per_participant?: number }).bingo_min_gifts_per_participant ===
        "number"
          ? (game as { bingo_min_gifts_per_participant: number }).bingo_min_gifts_per_participant
          : 1;

      const runtimeSnapshot = loadRuntimeState(game.id);
      let configLocked = false;
      if (game.game_type === "Amigo Secreto") {
        const { count } = await supabase
          .from("game_participants")
          .select("id", { count: "exact", head: true })
          .eq("game_id", game.id)
          .not("drawn_participant_id", "is", null);
        configLocked = (count ?? 0) > 0;
      } else if (game.game_type === "Rouba Presente") {
        configLocked = runtimeSnapshot.roubaStarted;
      } else if (game.game_type === "Bingo de Presentes") {
        configLocked = runtimeSnapshot.bingoStarted;
      }

      const gameCtx: GameContext = {
        id: game.id,
        name: game.name,
        game_type: game.game_type,
        owner_id: game.owner_id,
        bingo_gift_mode: bingoMode,
        bingo_min_gifts_per_participant: bingoMin,
        configLocked,
      };
      setGameContext(gameCtx);

      if (game.game_type === "Rouba Presente") {
        setParticipantContext(null);
        setWishlistByName(new Map());
        setBingoGiftNames(new Set());
        setLoadingContext(false);
        return;
      }

      if (game.game_type === "Bingo de Presentes" && bingoMode === "admin_only") {
        setParticipantContext(null);
        setWishlistByName(new Map());
        const runtime = runtimeSnapshot;
        setBingoGiftNames(new Set(runtime.bingoGifts));
        setLoadingContext(false);
        return;
      }

      if (game.game_type === "Bingo de Presentes" && bingoMode === "participants") {
        const { data: participant, error: participantError } = await supabase
          .from("game_participants")
          .select("id")
          .eq("game_id", game.id)
          .eq("user_id", user.id)
          .single();

        if (participantError || !participant) {
          setParticipantContext(null);
          setWishlistByName(new Map());
          setBingoGiftNames(new Set());
          setLoadingContext(false);
          return;
        }

        setParticipantContext(participant);

        const { data: wishlistData } = await (supabase as any)
          .from("participant_wishlist_entries")
          .select("id, gift_name, gift_link")
          .eq("game_id", game.id)
          .eq("participant_id", participant.id);

        const nameMap = new Map<string, string>();
        (wishlistData ?? []).forEach((item: { id: string; gift_name: string }) => {
          nameMap.set(item.gift_name, item.id);
        });
        setWishlistByName(nameMap);
        setBingoGiftNames(new Set());
        setLoadingContext(false);
        return;
      }

      const { data: participant, error: participantError } = await supabase
        .from("game_participants")
        .select("id")
        .eq("game_id", game.id)
        .eq("user_id", user.id)
        .single();

      if (participantError || !participant) {
        setParticipantContext(null);
        setWishlistByName(new Map());
        setBingoGiftNames(new Set());
        setLoadingContext(false);
        return;
      }

      setParticipantContext(participant);

      const { data: wishlistData } = await (supabase as any)
        .from("participant_wishlist_entries")
        .select("id, gift_name, gift_link")
        .eq("game_id", game.id)
        .eq("participant_id", participant.id);

      const nameMap = new Map<string, string>();
      (wishlistData ?? []).forEach((item: { id: string; gift_name: string }) => {
        nameMap.set(item.gift_name, item.id);
      });
      setWishlistByName(nameMap);
      setBingoGiftNames(new Set());
      setLoadingContext(false);
    };

    void loadContext();
  }, [hasGameContext, gameSlug, user]);

  const bingoParticipantPicks =
    gameContext?.game_type === "Bingo de Presentes" &&
    gameContext?.bingo_gift_mode === "participants";

  const canManageGameProfile =
    Boolean(user) &&
    Boolean(gameContext) &&
    !gameContext.configLocked &&
    Boolean(participantContext) &&
    (gameContext?.game_type === "Amigo Secreto" || bingoParticipantPicks);

  const canManageBingoGameGifts =
    Boolean(user) &&
    Boolean(gameContext) &&
    !gameContext.configLocked &&
    gameContext?.game_type === "Bingo de Presentes" &&
    gameContext?.bingo_gift_mode === "admin_only" &&
    gameContext?.owner_id === user?.id;

  const roubaBrowseOnly = gameContext?.game_type === "Rouba Presente";

  const showGameGiftControls =
    hasGameContext &&
    !roubaBrowseOnly &&
    (canManageGameProfile || canManageBingoGameGifts);

  const addToGameLabel =
    gameContext?.game_type === "Amigo Secreto"
      ? "Adicionar ao Amigo Secreto"
      : gameContext?.game_type === "Bingo de Presentes"
        ? "Adicionar ao Bingo"
        : "Adicionar ao meu perfil do jogo";

  const handleToggleGiftOnProfile = async (gift: GiftItem) => {
    if (!user || !gameContext || !participantContext) {
      toast.error("Entre no jogo para adicionar desejos.");
      return;
    }
    if (gameContext.configLocked) {
      toast.error("O jogo já começou. Sua lista não pode ser alterada.");
      return;
    }

    const isAmigo = gameContext.game_type === "Amigo Secreto";
    const isBingoPlayerPicks =
      gameContext.game_type === "Bingo de Presentes" &&
      gameContext.bingo_gift_mode === "participants";
    if (!isAmigo && !isBingoPlayerPicks) {
      toast.error("Esse recurso não está disponível para este jogo.");
      return;
    }

    setSavingGiftName(gift.name);

    const existingId = wishlistByName.get(gift.name);
    if (existingId) {
      const { error } = await (supabase as any)
        .from("participant_wishlist_entries")
        .delete()
        .eq("id", existingId);

      setSavingGiftName(null);

      if (error) {
        toast.error("Não foi possível desfixar esse produto.");
        return;
      }

      setWishlistByName((prev) => {
        const next = new Map(prev);
        next.delete(gift.name);
        return next;
      });
      toast.success("Produto desfixado do seu perfil.");
      return;
    }

    const baseInsertPayload = {
      game_id: gameContext.id,
      participant_id: participantContext.id,
      user_id: user.id,
      gift_name: gift.name,
      gift_category: gift.category,
      gift_emoji: gift.emoji,
      gift_price: gift.price,
    };

    let data: { id: string; gift_name: string } | null = null;
    let error: { message?: string } | null = null;

    const withLinkResult = await (supabase as any)
      .from("participant_wishlist_entries")
      .insert({
        ...baseInsertPayload,
        gift_link: gift.link ?? null,
      })
      .select("id, gift_name")
      .single();

    data = withLinkResult.data as { id: string; gift_name: string } | null;
    error = withLinkResult.error as { message?: string } | null;

    const missingGiftLinkColumn =
      Boolean(error?.message) &&
      error!.message!.toLowerCase().includes("gift_link");

    if (missingGiftLinkColumn) {
      const fallbackResult = await (supabase as any)
        .from("participant_wishlist_entries")
        .insert(baseInsertPayload)
        .select("id, gift_name")
        .single();

      data = fallbackResult.data as { id: string; gift_name: string } | null;
      error = fallbackResult.error as { message?: string } | null;
    }

    setSavingGiftName(null);

    if (error || !data) {
      toast.error("Não foi possível adicionar ao seu perfil.");
      return;
    }

    setWishlistByName((prev) => {
      const next = new Map(prev);
      next.set(gift.name, data.id as string);
      return next;
    });
    toast.success("Produto adicionado ao seu perfil do jogo.");
  };

  const handleToggleGiftOnBingoGame = (gift: GiftItem) => {
    if (!gameContext || !canManageBingoGameGifts) {
      toast.error("Apenas o organizador pode selecionar presentes do bingo.");
      return;
    }
    if (gameContext.configLocked) {
      toast.error("O bingo já começou. Os presentes não podem ser alterados.");
      return;
    }

    const runtime = loadRuntimeState(gameContext.id);
    const currentGifts = runtime.bingoGifts ?? [];
    const alreadySelected = currentGifts.includes(gift.name);
    const nextGifts = alreadySelected
      ? currentGifts.filter((item) => item !== gift.name)
      : [...currentGifts, gift.name];

    saveRuntimeState(gameContext.id, {
      ...runtime,
      bingoGifts: nextGifts,
    });
    setBingoGiftNames(new Set(nextGifts));

    toast.success(alreadySelected ? "Produto removido do bingo." : "Produto adicionado ao bingo.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 px-1 lg:ml-[304px]">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Sugestões de Presentes</h1>
              <p className="text-muted-foreground text-lg">Encontre o presente ideal com links para compra</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
            <aside className="space-y-5 p-1">
              <div>
                <h2 className="mb-3 text-2xl font-semibold">Categorias</h2>
                <div className="space-y-1.5">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`w-full text-left text-[1.05rem] leading-7 transition-colors ${
                          isActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-2xl font-semibold">Preço</h3>
                <div className="space-y-1.5 text-[1.05rem]">
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice(null);
                      setMaxPrice(60);
                    }}
                    className="block text-left text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Até R$ 60
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice(60);
                      setMaxPrice(150);
                    }}
                    className="block text-left text-muted-foreground transition-colors hover:text-foreground"
                  >
                    R$ 60 a R$ 150
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice(150);
                      setMaxPrice(null);
                    }}
                    className="block text-left text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Mais de R$ 150
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="0.01"
                    value={minPrice === null ? "" : String(minPrice)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setMinPrice(raw === "" ? null : Number(raw));
                    }}
                    placeholder="Mínimo"
                    className="h-10 rounded-lg"
                    aria-label="Preço mínimo"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="0.01"
                    value={maxPrice === null ? "" : String(maxPrice)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setMaxPrice(raw === "" ? null : Number(raw));
                    }}
                    placeholder="Máximo"
                    className="h-10 rounded-lg"
                    aria-label="Preço máximo"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                    }}
                    className="h-10 w-10 shrink-0 rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                    aria-label="Aplicar filtro de preço"
                  >
                    ›
                  </button>
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar presentes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="flex min-h-[min(60vh,560px)] flex-col items-center justify-center gap-3 px-4 py-12 text-center text-muted-foreground">
                  <div className="text-5xl" aria-hidden>
                    😅
                  </div>
                  <p className="max-w-sm text-base">Nenhum presente encontrado com esses filtros</p>
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {paginatedGifts.map((gift, i) => (
              <motion.div
                key={gift.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex h-full flex-col bg-card rounded-none p-5 shadow-card hover:shadow-elevated transition-all border border-border"
              >
                {gift.image ? (
                  <div className="mb-3 aspect-square w-full overflow-hidden">
                    <img
                      src={getOptimizedImageSrc(gift.image)}
                      alt={gift.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={640}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (gift.image && target.src !== `${window.location.origin}${gift.image}`) {
                          target.onerror = null;
                          target.src = gift.image;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-52 w-full items-center justify-center text-5xl">
                    {gift.emoji}
                  </div>
                )}
                <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {categories.find((c) => c.id === gift.category)?.label}
                </span>
                <h3 className="font-display font-semibold mt-2 mb-1 text-sm min-h-[2.75rem] line-clamp-2">{gift.name}</h3>
                {typeof gift.price === "number" ? (
                  <p className="text-lg font-bold text-secondary mb-3">
                    R$ {gift.price.toFixed(2).replace(".", ",")}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground mb-3">Ver preço no link</p>
                )}
                <div className="mt-auto">
                {showGameGiftControls && (
                  <Button
                    variant={
                      canManageBingoGameGifts
                        ? bingoGiftNames.has(gift.name)
                          ? "hero"
                          : "outline"
                        : wishlistByName.has(gift.name)
                          ? "hero"
                          : "outline"
                    }
                    size="sm"
                    className="mb-2 h-auto w-full whitespace-normal px-3 py-2 text-center leading-snug"
                    disabled={
                      (!canManageGameProfile && !canManageBingoGameGifts) ||
                      savingGiftName === gift.name
                    }
                    onClick={() =>
                      canManageBingoGameGifts
                        ? handleToggleGiftOnBingoGame(gift)
                        : handleToggleGiftOnProfile(gift)
                    }
                  >
                    {canManageBingoGameGifts
                      ? bingoGiftNames.has(gift.name)
                        ? "Remover do bingo"
                        : "Adicionar ao bingo"
                      : wishlistByName.has(gift.name)
                        ? savingGiftName === gift.name
                          ? "Desfixando..."
                          : "Desfixar do meu perfil"
                        : savingGiftName === gift.name
                          ? "Adicionando..."
                          : addToGameLabel}
                  </Button>
                )}
                {gift.link ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                  >
                    <a href={gift.link} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver no Mercado Livre
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                  >
                    Ver no Mercado Livre
                  </Button>
                )}
                </div>
              </motion.div>
            ))}
              </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[1.75rem] sm:gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNumber);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-10 min-w-10 rounded-md border px-3 text-base transition-colors ${
                        pageNumber === safePage
                          ? "border-primary text-primary font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      aria-current={pageNumber === safePage ? "page" : undefined}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-2 px-2 text-base text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Seguinte
                    <span aria-hidden>›</span>
                  </button>
                </div>
                </>
              )}
            </section>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Presentes;
