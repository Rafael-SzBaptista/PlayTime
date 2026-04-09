import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Ban, CheckCircle2, Gamepad2, Gift, Shuffle, Sparkles } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const highlights: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: BadgeCheck,
    title: "100% gratuita",
    desc: "Crie e gerencie seus jogos sem custo. Enquanto algumas plataformas cobram pela sua diversão, nós não.",
  },
  {
    icon: Gift,
    title: "Plataforma de Sugestão de Presentes",
    desc: "Inspire seus convidados com ideias práticas de presentes.",
  },
  {
    icon: Ban,
    title: "Bloqueio de pares no sorteio",
    desc: "Restrinja pessoas de se tirarem no sorteio.",
  },
  {
    icon: Gamepad2,
    title: "Administre e jogue no mesmo lugar",
    desc: "Além da gestão, os participantes também jogam na plataforma. Sabemos que por vezes o jogador não possue a estrutura necessária para o jogo em questão: dados, papéis, roletas, etc. Não se preocupe! Nós temos tudo que você precisa para jogar!",
  },
  {
    icon: Sparkles,
    title: "Sem propagandas",
    desc: "Experiência limpa para focar no que importa: a brincadeira. Não te enchemos com aquelas propagandas que poluem a tela.",
  },
  {
    icon: Shuffle,
    title: "Sorteio automático e manual",
    desc: "Escolha o formato ideal para o seu evento.",
  },
];

const PlatformHighlights = () => {
  return (
    <section className="relative bg-background pb-14 pt-10 sm:pb-18 sm:pt-12">
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Por que usar</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Por que Nós?</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          className="relative mx-auto max-w-6xl"
        >
          <Carousel
            opts={{
              align: "start",
              loop: true,
              duration: 35,
              dragFree: false,
            }}
            className="px-1 sm:px-10"
          >
            <CarouselContent className="-ml-0">
              {highlights.map((item) => (
                <CarouselItem
                  key={item.title}
                  className="basis-full pl-0 md:basis-1/2 lg:basis-1/3"
                >
                  <article className="flex h-full flex-col border-b border-border/60 px-5 py-6 md:border-b-0 md:border-r">
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display text-[1.75rem] font-semibold leading-tight">{item.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">{item.desc}</p>
                    <div className="mt-auto pt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Recurso ativo na plataforma
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 top-3 h-8 w-8 -translate-y-0 rounded-md border-border/70 bg-background/90" />
            <CarouselNext className="right-0 top-3 h-8 w-8 -translate-y-0 rounded-md border-border/70 bg-background/90" />
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};

export default PlatformHighlights;
