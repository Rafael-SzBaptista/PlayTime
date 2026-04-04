import { motion } from "framer-motion";
import { Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  const featureTags = [
    "Sorteio automático",
    "Link compartilhável",
    "Gratuito",
    "Gerenciamento",
    "Controle",
    "Sugestão de Presentes",
  ];

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden pt-0 -mt-4">
      <div className="pointer-events-none absolute inset-0 bg-background" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col pt-1 md:pt-2">
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 md:gap-4">
          <div className="container mx-auto px-3 md:px-4">
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-2xl text-left lg:-ml-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="font-body text-4xl font-bold leading-tight tracking-tight md:text-5xl"
          >
            <span className="block text-gradient">Bingo</span>
            <span className="mt-1 block text-secondary">Amigo Secreto</span>
            <span className="mt-1 block text-accent">Rouba Presentes</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mb-5 mt-4 max-w-2xl text-lg text-muted-foreground md:mb-6 md:mt-5 md:text-xl"
          >
            Crie jogos, convide amigos, faça sorteios automáticos e descubra sugestões de presentes — tudo 100% gratuito e em um só lugar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="flex flex-col items-start gap-4 sm:flex-row"
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/criar-jogo">
                <Gift className="h-5 w-5" />
                Criar Jogo
              </Link>
            </Button>
            <Button
              variant="festiveOutline"
              size="xl"
              asChild
              className="hover:bg-background/50 hover:text-primary hover:border-primary/90 hover:scale-[1.02]"
            >
              <Link to="/participar">
                <Users className="h-5 w-5" />
                Participar de Jogo
              </Link>
            </Button>
          </motion.div>

          </div>
          <motion.div
            initial={{ opacity: 0, x: 24, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="relative hidden min-h-[280px] items-start justify-center pt-1 lg:flex xl:min-h-[320px]"
          >
            <div className="flex items-start gap-1 xl:gap-3">
              <motion.img
                src="/tabuleiro-3d-gamemodes.png"
                alt="Presente ilustrado"
                className="h-auto w-full max-w-[380px] object-contain drop-shadow-[0_30px_40px_hsl(var(--foreground)/0.22)] xl:max-w-[500px]"
                animate={{ y: [-8, 8, -8], rotate: [-1, 1, -1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.img
                src="/bingo-machine.png"
                alt="Globo de bingo ilustrado"
                className="-ml-44 mt-20 h-auto w-full max-w-[360px] -translate-x-[650px] object-contain drop-shadow-[0_30px_40px_hsl(var(--foreground)/0.22)] xl:-ml-48 xl:mt-24 xl:max-w-[500px]"
                animate={{ y: [8, -8, 8], rotate: [1, -1, 1] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
          </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-20 w-full max-w-6xl shrink-0 self-center border-b border-border/60 px-4 pb-3 pt-1 text-sm text-muted-foreground"
        >
          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 items-start gap-x-4 gap-y-2 px-2 sm:grid-cols-3 sm:items-center xl:grid-cols-6">
            {featureTags.map((tag) => (
              <span
                key={tag}
                className="flex w-full min-w-0 items-start gap-2 text-left text-sm sm:items-center sm:justify-center sm:text-center xl:whitespace-nowrap"
              >
                <span
                  className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary sm:mt-0"
                  aria-hidden
                />
                <span className="min-w-0 leading-snug">{tag}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
