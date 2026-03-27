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
    <section className="relative flex min-h-screen items-center overflow-hidden pb-12 pt-0 -mt-4">
      <div className="pointer-events-none absolute inset-0 bg-background" />

      <div className="container relative z-10 mx-auto px-3 md:px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="max-w-2xl self-center text-left lg:-ml-6">
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
            className="mb-10 mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
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
            className="relative hidden min-h-[360px] items-center justify-center lg:flex"
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute bottom-0 left-1/2 z-20 w-full max-w-6xl -translate-x-1/2 px-4 pb-2 text-sm text-muted-foreground"
      >
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 items-center gap-x-4 gap-y-2 px-2 sm:grid-cols-3 xl:grid-cols-6">
          {featureTags.map((tag) => (
            <span key={tag} className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap text-center">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
