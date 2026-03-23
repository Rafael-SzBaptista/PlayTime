import { motion } from "framer-motion";
import { ArrowRight, Gift, LayoutGrid, Shuffle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const modes: {
  icon: LucideIcon;
  title: string;
  desc: string;
  to: string;
  bg: string;
}[] = [
  {
    icon: Gift,
    title: "Amigo Secreto",
    desc: "O clássico sorteio secreto entre amigos",
    to: "/criar-jogo",
    bg: "bg-[hsl(356_68%_40%)]",
  },
  {
    icon: Shuffle,
    title: "Rouba Presente",
    desc: "Escolha ou roube presentes dos amigos",
    to: "/criar-jogo",
    bg: "bg-[hsl(2_64%_38%)]",
  },
  {
    icon: LayoutGrid,
    title: "Bingo de Presentes",
    desc: "Sorteio divertido estilo bingo",
    to: "/criar-jogo",
    bg: "bg-[hsl(8_72%_42%)]",
  },
];

const GameModes = () => {
  return (
    <section className="relative bg-[hsl(0_100%_97%)] py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Modos</p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group relative overflow-hidden border border-border/60 ${mode.bg} p-7 text-white transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="relative mb-6 flex h-12 w-12 items-center justify-center border border-white/30 bg-white/10">
                <mode.icon className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div className="relative">
                <h3 className="font-display text-3xl font-bold leading-tight">{mode.title}</h3>
                <p className="mt-4 text-base text-white/85">{mode.desc}</p>
              </div>
              <Button
                asChild
                variant="link"
                className="relative mt-7 h-auto w-fit p-0 text-white no-underline hover:text-white/80 hover:no-underline"
              >
                <Link to={mode.to} aria-label={`Ir para ${mode.title}`}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameModes;
