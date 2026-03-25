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
  { id: "canecas", label: "Canecas", emoji: "☕" },
  { id: "chocolates", label: "Chocolates", emoji: "🍫" },
  { id: "livros", label: "Livros", emoji: "📚" },
  { id: "jogos", label: "Jogos", emoji: "🎲" },
  { id: "engracados", label: "Engraçados", emoji: "😂" },
  { id: "decoracao", label: "Decoração", emoji: "✨" },
];

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
  if (/\.(png|jpe?g)$/i.test(image)) {
    return image.replace(/\.(png|jpe?g)$/i, ".webp");
  }
  return image;
};

export const allGifts: GiftItem[] = [
  {
    name: "Samsung Galaxy A06 Dual SIM 128GB 4GB RAM",
    price: 829.99,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2wikGVf",
    image: "/produto-lista-1.png",
  },
  {
    name: "Samsung Galaxy A07 128GB 4GB RAM",
    price: 697.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2xhSjhU",
    image: "/produto-lista-2.png",
  },
  {
    name: "Galaxy Tab A11 64GB 4GB RAM",
    price: 931.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/1z39ZLX",
    image: "/produto-lista-3.png",
  },
  {
    name: "Tablet Lenovo Tab 10.1 Wi-Fi 64GB 4GB RAM",
    price: 854.05,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2Lb63gx",
    image: "/produto-lista-4.png",
  },
  {
    name: "Relógio Smartwatch Digital Inteligente GotWire Mesh Preto",
    price: 28.31,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2HKWiPq",
    image: "/produto-lista-5.png",
  },
  {
    name: "Relógio Smartwatch Inteligente Multifuncional Preto Mesh",
    price: 25.33,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2AAanPU",
    image: "/produto-lista-6.png",
  },
  {
    name: "Smartwatch (link fornecido)",
    price: 89.9,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2o7LrRY",
    image: "/produto-lista-7.png",
  },
  {
    name: "Smartwatch Digital Feminino Bluetooth 41mm Rosa",
    price: 39.5,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1tn7GEE",
    image: "/produto-lista-8.png",
  },
  {
    name: "Smartphone Samsung Galaxy A36 5G 128GB, 6GB RAM, Câmera Tripla até 50MP",
    price: 1529.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/1k5JeY6",
    image: "/produto-galaxy-a36.png",
  },
  {
    name: "Celular Samsung Galaxy A07 256GB, 8GB RAM, Câmera 50MP, Tela 6.7\"",
    price: 899.1,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/27WdT2H",
    image: "/produto-galaxy-a07.png",
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
    image: "/produto-novo-1.png",
  },
  {
    name: "Fone com fio compatível com iPhone (branco)",
    price: 27.26,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2KnaE84",
    image: "/produto-novo-2.png",
  },
  {
    name: "Fone P2 com microfone e controle (nylon reforçado)",
    price: 18.52,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2msVcsQ",
    image: "/produto-novo-3.png",
  },
  {
    name: "Fone intra-auricular com fio 3.5mm (preto)",
    price: 22.71,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1ty7EX1",
    image: "/produto-novo-4.png",
  },
  {
    name: "Fone intra-auricular com fio 1.2m (preto)",
    price: 26.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/11SwAA6",
    image: "/produto-novo-5.png",
  },
  {
    name: "Fone JBL C50HI intra-auricular com fio (preto)",
    price: 53.1,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/24J2x9Z",
    image: "/produto-novo-6.png",
  },
  {
    name: "Fone intra-auricular com fio 1.2m (variação)",
    price: 26.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/11SwAA6",
    image: "/produto-novo-7.png",
  },
  {
    name: "Fone bluetooth F9-5 com estojo e powerbank",
    price: 24.79,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2hWJtmL",
    image: "/produto-novo-8.png",
  },
  {
    name: "Fone bluetooth esportivo XT80/LP75 (preto)",
    price: 56.26,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1fAtjH7",
    image: "/produto-novo-9.png",
  },
  {
    name: "Fone bluetooth sem fio Pro 4 (branco)",
    price: 24.39,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2pg6mSv",
    image: "/produto-novo-10.png",
  },
  {
    name: "Fone bluetooth TWS Kaidi KD780 (preto)",
    price: 38.72,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1B4Crz4",
    image: "/produto-novo-11.png",
  },
  {
    name: "Fone bluetooth 5.0 par sem fio (preto)",
    price: 23.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1doCQEQ",
    image: "/produto-novo-12.png",
  },
  {
    name: "Headphone bluetooth Dapon H02d over-ear (azul)",
    price: 78.11,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1rsSkjf",
    image: "/produto-novo-13.png",
  },
  {
    name: "Fone over-ear sem fio Hi-Fi com microfone",
    price: 63.05,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2sNtTNb",
    image: "/produto-novo-14.png",
  },
  {
    name: "Fone Philco PFO02P Wave Flat (preto)",
    price: 73.37,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2F7vWmV",
    image: "/produto-novo-15.png",
  },
  {
    name: "Caixinha de Som Bluetooth portátil com USB/SD (preta)",
    price: 29.79,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1qTM1io",
    image: "/produto-caixa-1.png",
  },
  {
    name: "Inova Caixa de Som Mini Bluetooth TWS (grave potente)",
    price: 66.0,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1B5JvmW",
    image: "/produto-caixa-2.png",
  },
  {
    name: "Caixa de Som Speaker Philco Extreme 35W PBS35",
    price: 125.1,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1BVU7cW",
    image: "/produto-caixa-3.png",
  },
  {
    name: "Caixa de Som Bluetooth boombox 2 alto-falantes 10W",
    price: 144.03,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1WQpiRR",
    image: "/produto-caixa-4.png",
  },
  {
    name: "Caixa de Som Bluetooth TWS estéreo Hi-Fi",
    price: 78.0,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1fj1XuY",
    image: "/produto-caixa-5.png",
  },
  {
    name: "Caixa de Som Bluetooth portátil JBL Go 4 (azul)",
    price: 270.52,
    category: "tecnologia",
    emoji: "🔊",
    link: "https://meli.la/1vfezFg",
    image: "/produto-caixa-6.png",
  },
  {
    name: "Monitor Gamer Samsung 24\" FHD 120Hz (S3)",
    price: 608.0,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/1f8nbSd",
    image: "/produto-setup-1.png",
  },
  {
    name: "Monitor LG UltraGear 24\" FHD 144Hz 1ms",
    price: 699.0,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/33GwYVx",
    image: "/produto-setup-2.png",
  },
  {
    name: "Monitor Gamer LG 24MS500-B 24\" IPS Full HD 100Hz",
    price: 579.51,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/1d1RJ6f",
    image: "/produto-setup-3.png",
  },
  {
    name: "Teclado para Acer A515/A315 NSK-RL0SW (preto)",
    price: 53.25,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/26H1w5C",
    image: "/produto-setup-4.png",
  },
  {
    name: "Teclado USB com fio ABNT2 Pholex (preto)",
    price: 27.27,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/1i1G3gd",
    image: "/produto-setup-5.png",
  },
  {
    name: "Teclado Logitech K120 com fio USB ABNT2",
    price: 61.87,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/2S4r9Eu",
    image: "/produto-setup-6.png",
  },
  {
    name: "Teclado Gamer Semi Mecânico LED RGB ABNT2",
    price: 55.99,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/1osdcnS",
    image: "/produto-setup-7.png",
  },
  {
    name: "Teclado Gamer Semi Mecânico Newdragon ND-2086 RGB",
    price: 44.9,
    category: "tecnologia",
    emoji: "⌨️",
    link: "https://meli.la/1jyp2Tp",
    image: "/produto-setup-8.png",
  },
  {
    name: "Mouse sem fio recarregável RGB ergonômico",
    price: 19.79,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/25HwFCj",
    image: "/produto-mouse-1.png",
  },
  {
    name: "Mouse com fio ergonômico ambidestro USB (Piracomp)",
    price: 20.99,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/1FMzSNF",
    image: "/produto-mouse-2.png",
  },
  {
    name: "Mouse Gamer Logitech G203 RGB Lightsync",
    price: 99.0,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/2wmvdwK",
    image: "/produto-mouse-3.png",
  },
  {
    name: "Kit Mouse 3600 DPI RGB + Mousepad Armory Warrior",
    price: 28.4,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/2mTBMyX",
    image: "/produto-mouse-4.png",
  },
  {
    name: "Mouse sem fio Logitech M170 preto",
    price: 59.9,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/33J3v44",
    image: "/produto-mouse-5.png",
  },
  {
    name: "Mouse com fio HP 150 USB preto",
    price: 38.9,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/2BP5Q2g",
    image: "/produto-mouse-6.png",
  },
  {
    name: "Mouse Gamer RGB Fortrek Crusader Black Edition",
    price: 78.16,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/15dUV44",
    image: "/produto-mouse-7.png",
  },
  {
    name: "Mouse gamer com fio USB óptico LED RGB 2400 DPI",
    price: 68.57,
    category: "tecnologia",
    emoji: "🖱️",
    link: "https://meli.la/1jJzFGF",
    image: "/produto-mouse-8.png",
  },
  {
    name: "Webcam Full HD 1080p GoodVision com microfone",
    price: 35.99,
    category: "tecnologia",
    emoji: "📷",
    link: "https://meli.la/1pCkW5H",
    image: "/produto-cam-print-1.png",
  },
  {
    name: "Webcam HP 320 FHD (53X26AA) preta",
    price: 161.41,
    category: "tecnologia",
    emoji: "📷",
    link: "https://meli.la/15Ds5nW",
    image: "/produto-cam-print-2.png",
  },
  {
    name: "Webcam Intelbras HD WCI 720p",
    price: 129.9,
    category: "tecnologia",
    emoji: "📷",
    link: "https://meli.la/24juaFw",
    image: "/produto-cam-print-3.png",
  },
  {
    name: "Impressora Multifuncional HP Smart Tank 581",
    price: 909.0,
    category: "tecnologia",
    emoji: "🖨️",
    link: "https://meli.la/22ZZmxu",
    image: "/produto-cam-print-4.png",
  },
  {
    name: "Impressora Multifuncional HP DeskJet Ink Advantage 2874",
    price: 490.9,
    category: "tecnologia",
    emoji: "🖨️",
    link: "https://meli.la/2mntTQY",
    image: "/produto-cam-print-5.png",
  },
  {
    name: "Mini impressora de etiquetas Bluetooth portátil",
    price: 125.16,
    category: "tecnologia",
    emoji: "🖨️",
    link: "https://meli.la/2Z6y8bv",
    image: "/produto-cam-print-6.png",
  },
  {
    name: "Repetidor Amplificador Bahrein 1800Mbps Extensor Sinal Wi-Fi",
    price: 43.9,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/132BV13",
    image: "/produto-tech-extra-1.png",
  },
  {
    name: "Repetidor de Sinal Wi-Fi Roteador Wireless Inv Tech",
    price: 75.9,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/33Ec2tK",
    image: "/produto-tech-extra-2.png",
  },
  {
    name: "Roteador TP-Link AX12 Wi-Fi 6 Archer AX1500 Dual Band",
    price: 170.5,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/1dUjEma",
    image: "/produto-tech-extra-3.png",
  },
  {
    name: "Extensor Wi-Fi 5 Twibi Force Plug Giga Intelbras",
    price: 158.46,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/2rPXfvx",
    image: "/produto-tech-extra-4.png",
  },
  {
    name: "Roteador Mercusys MR30G AC1200 Gigabit Wireless Dual Band",
    price: 109.97,
    category: "tecnologia",
    emoji: "📶",
    link: "https://meli.la/29vy1U9",
    image: "/produto-tech-extra-5.png",
  },
  {
    name: "HD Externo Infokit 320GB USB 3.0",
    price: 99,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/1Y8LJBn",
    image: "/produto-tech-extra-6.png",
  },
  {
    name: "HD Externo Exbom 500GB USB 3.1 Tipo-C Slim",
    price: 175,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/2yqAVYw",
    image: "/produto-tech-extra-7.png",
  },
  {
    name: "SSD Interno 120GB 2.5 SATA3 Spreaker Gamer",
    price: 162.49,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/1MZXRqK",
    image: "/produto-tech-extra-8.png",
  },
  {
    name: "Pendrive 16GB USB 2.0 Compacto Brasiliana Tech",
    price: 26.5,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/2Yt1KYp",
    image: "/produto-tech-extra-9.png",
  },
  {
    name: "Pen Drive 32GB Mini USB 2.0 Chaveiro Metálico",
    price: 28.79,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/2GgU3Vn",
    image: "/produto-tech-extra-10.png",
  },
  {
    name: "Unidade Flash USB Kingston 64GB 3.2 Exodia M",
    price: 64.9,
    category: "tecnologia",
    emoji: "💾",
    link: "https://meli.la/296URde",
    image: "/produto-tech-extra-11.png",
  },
  {
    name: "Carregador Turbo Duplo 40W USB Tipo C para iPhone",
    price: 39.89,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/1vfd472",
    image: "/produto-tech-extra-12.png",
  },
  {
    name: "Power Bank 20.000mAh Maxnova com Display",
    price: 77.8,
    category: "tecnologia",
    emoji: "🔋",
    link: "https://meli.la/16G3mif",
    image: "/produto-tech-extra-13.png",
  },
  {
    name: "Carregador Turbo Rápido 50W Tipo C Compatível Motorola",
    price: 28.49,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2HrHptY",
    image: "/produto-tech-extra-14.png",
  },
  {
    name: "Carregador Turbo Power Motorola 125W USB-C",
    price: 54.99,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2D1B5R3",
    image: "/produto-tech-extra-15.png",
  },
  {
    name: "Bateria Portátil Kapbom 10.000mAh",
    price: 53.46,
    category: "tecnologia",
    emoji: "🔋",
    link: "https://meli.la/2PhQjMz",
    image: "/produto-tech-extra-16.png",
  },
  {
    name: "Carregador Turbo Compatível Samsung A10/A01/A02/A03/J7/J8/S7",
    price: 24.99,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/18nyja5",
    image: "/produto-tech-extra-17.png",
  },
  {
    name: "Carregador Portátil Powerbank Turbo 20.000mAh com Cabos Embutidos",
    price: 86.61,
    category: "tecnologia",
    emoji: "🔋",
    link: "https://meli.la/25u5LFN",
    image: "/produto-tech-extra-18.png",
  },
  {
    name: "Cabo Carregador Compatível com iPhone (Tipo C) Branco",
    price: 19.06,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2siSpEV",
    image: "/produto-cabo-extra-1.png",
  },
  {
    name: "Cabo USB-C Duplo Compatível Samsung/iPhone (Preto)",
    price: 27.69,
    category: "tecnologia",
    emoji: "🔌",
    link: "https://meli.la/2KoH2cv",
    image: "/produto-cabo-extra-2.png",
  },
  {
    name: "Kit 2 Cabos HDMI 3m 4K 3D Conector Dourado",
    price: 32.95,
    category: "tecnologia",
    emoji: "🖥️",
    link: "https://meli.la/1EboT3z",
    image: "/produto-cabo-extra-3.png",
  },
  {
    name: "Cabo de Áudio Mono P10 para P10 5 Metros",
    price: 22.9,
    category: "tecnologia",
    emoji: "🎸",
    link: "https://meli.la/2NFV3s4",
    image: "/produto-cabo-extra-4.png",
  },
  {
    name: "Cabo Flexível 2,5mm Rolo 100 Metros 750v",
    price: 59.95,
    category: "tecnologia",
    emoji: "🧰",
    link: "https://meli.la/276UWMu",
    image: "/produto-cabo-extra-5.png",
  },
  {
    name: "Headset Gamer Havit Gamenote H2026d RGB Preto/Prata",
    price: 76.53,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2EpRB1N",
    image: "/produto-headset-rgb-1.png",
  },
  {
    name: "Headset Gamer USB Led Evolut EG310 com Microfone",
    price: 78.93,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2SauChU",
    image: "/produto-headset-rgb-2.png",
  },
  {
    name: "Headset Gamer Havit H2232d RGB Camuflado Cinza",
    price: 76.9,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1iag8mB",
    image: "/produto-headset-rgb-3.png",
  },
  {
    name: "Fone de Ouvido Headset Gamer RGB Led (Shop Borges)",
    price: 51.99,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1YLGPzA",
    image: "/produto-headset-rgb-4.png",
  },
  {
    name: "Headset Gamer Havit H2002d com Mic Removível (Branco)",
    price: 216.52,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/24UddAa",
    image: "/produto-headset-rgb-5.png",
  },
  {
    name: "Headset Gamer Redragon Zeus Pro RGB Wireless 7.1",
    price: 317.9,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/1hUWivv",
    image: "/produto-headset-rgb-6.png",
  },
  {
    name: "Headset Gamer Redragon Pelias Preto H130",
    price: 74.9,
    category: "tecnologia",
    emoji: "🎧",
    link: "https://meli.la/2fsMWNR",
    image: "/produto-headset-rgb-7.png",
  },
  {
    name: "Kit Iluminação Interior Carro RGB com Controle 12v",
    price: 32.49,
    category: "tecnologia",
    emoji: "🚗",
    link: "https://meli.la/2HG7aFs",
    image: "/produto-headset-rgb-8.png",
  },
  {
    name: "RGB Mini Portátil com Clipe Iluminador Led USB",
    price: 36.86,
    category: "tecnologia",
    emoji: "💡",
    link: "https://meli.la/1mdANYg",
    image: "/produto-headset-rgb-9.png",
  },
  {
    name: "Kit 2 Lâmpadas Led Giratórias Coloridas RGB",
    price: 30.76,
    category: "tecnologia",
    emoji: "💡",
    link: "https://meli.la/2WR7dsW",
    image: "/produto-headset-rgb-10.png",
  },
  {
    name: "Fita Led Decorativa RGB 2 Metros USB com Controle",
    price: 27.99,
    category: "tecnologia",
    emoji: "💡",
    link: "https://meli.la/2U7cg4E",
    image: "/produto-headset-rgb-11.png",
  },
  {
    name: "Relógio despertador retrô analógico duplo sino (prateado)",
    price: 34.99,
    category: "decoracao",
    emoji: "⏰",
    link: "https://meli.la/1TTeB6p",
    image: "/produto-meli-catalog-1.png",
  },
  {
    name: "Smartwatch Heyplus C1 2,01\" Bluetooth chamadas saúde IP68 (preto)",
    price: 59.99,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1mZezhM",
    image: "/produto-meli-catalog-2.png",
  },
  {
    name: "Relógio digital Skmei 1251 pulseira verde musgo",
    price: 51.49,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/1awwwen",
    image: "/produto-meli-catalog-3.png",
  },
  {
    name: "Relógio digital Skmei 1142 à prova d'água (preto)",
    price: 57.65,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/32uEqRb",
    image: "/produto-meli-catalog-4.png",
  },
  {
    name: "Despertador digital Micgeek mesa cabeceira (branco)",
    price: 24.4,
    category: "decoracao",
    emoji: "⏰",
    link: "https://meli.la/2g3NAHe",
    image: "/produto-meli-catalog-5.png",
  },
  {
    name: "Relógio de pulso Wokai pulseira couro unissex",
    price: 27.55,
    category: "tecnologia",
    emoji: "⌚",
    link: "https://meli.la/2F5jVXd",
    image: "/produto-meli-catalog-6.png",
  },
  {
    name: "Capinha anti shock Samsung Galaxy A07 6,7\" + película",
    price: 19.0,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2Vt73gS",
    image: "/produto-meli-catalog-7.png",
  },
  {
    name: "Película vidro temperado 3D anti choque Xiaomi Poco X7 5G",
    price: 26.76,
    category: "tecnologia",
    emoji: "📱",
    link: "https://meli.la/2se7BvN",
    image: "/produto-meli-catalog-8.png",
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

  // Links Mercado Livre (preço varia; consultar no link)
  {
    name: "Kit 2 Poltronas Decorativas Opala (suede) — sala/recepção",
    price: null,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/2M8imrD",
  },
  {
    name: "Sofá decorativo (courino) com almofadas — recepção/clínica (preto)",
    price: null,
    category: "decoracao",
    emoji: "🛋️",
    link: "https://meli.la/1Q2Y4Nu",
  },
  {
    name: "Cadeira de jantar Charles Eames Eiffel — madeira preta",
    price: null,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/2YWsAXX",
  },
  {
    name: "Cadeira de escritório diretor Tok Begônia — estofado preto",
    price: null,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/12xwHB7",
  },
  {
    name: "Cadeira de escritório preta giratória 3310 com braços (mesh/náilon)",
    price: null,
    category: "decoracao",
    emoji: "🪑",
    link: "https://meli.la/2qHwjhv",
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

  const filtered = useMemo(
    () =>
      allGifts.filter((g) => {
        if (activeCategory !== "todos" && g.category !== activeCategory) return false;
        if (minPrice !== null || maxPrice !== null) {
          if (g.price === null) return false;
          if (minPrice !== null && g.price < minPrice) return false;
          if (maxPrice !== null && g.price > maxPrice) return false;
        }
        if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [activeCategory, minPrice, maxPrice, search],
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
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🎁 Sugestões de Presentes</h1>
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

          {/* Filtros principais */}
          <div className="mx-auto mb-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <label htmlFor="category-filter" className="mb-1 block text-xs font-medium text-muted-foreground">
                Categoria
              </label>
              <select
                id="category-filter"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-muted-foreground">Preço</label>
                {(minPrice !== null || maxPrice !== null) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice(null);
                      setMaxPrice(null);
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    R$
                  </span>
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
                    placeholder="Mín"
                    className="h-10 pl-9"
                    aria-label="Preço mínimo"
                  />
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    R$
                  </span>
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
                    placeholder="Máx"
                    className="h-10 pl-9"
                    aria-label="Preço máximo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto items-stretch">
            {paginatedGifts.map((gift, i) => (
              <motion.div
                key={gift.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex h-full flex-col bg-card rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all border border-border"
              >
                {gift.image ? (
                  <img
                    src={getOptimizedImageSrc(gift.image)}
                    alt={gift.name}
                    className="mb-3 h-52 w-full rounded-xl border border-border object-contain bg-white"
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
                ) : (
                  <div className="text-4xl mb-3">{gift.emoji}</div>
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

          {filtered.length > 0 && (
            <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Página {safePage} de {totalPages} ({filtered.length} itens)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}

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
