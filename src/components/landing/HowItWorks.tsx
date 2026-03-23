import { motion } from "framer-motion";
import { Gamepad2, PartyPopper, Share2, Shuffle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const steps: { num: string; icon: LucideIcon; title: string; desc: string }[] = [
  { num: "1", icon: Gamepad2, title: "Crie o jogo", desc: "Escolha o modo, defina valor e regras" },
  { num: "2", icon: Share2, title: "Convide amigos", desc: "Compartilhe o link do evento" },
  { num: "3", icon: Shuffle, title: "Faça o sorteio", desc: "Sorteio automático e secreto" },
  { num: "4", icon: PartyPopper, title: "Troque presentes!", desc: "Confira sugestões e divirta-se" },
];

const HowItWorks = () => {
  return (
    <section className="relative border-y border-border/60 bg-muted/20 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Fluxo</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Como funciona</h2>
          <p className="mt-4 text-lg text-muted-foreground">Em quatro passos simples</p>
        </motion.div>

        <div className="mx-auto max-w-5xl">
          <div className="hidden h-px w-full bg-gradient-to-r from-transparent via-primary/45 to-transparent lg:block" />
          <div className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center lg:text-left"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-primary shadow-soft lg:mx-0">
                <step.icon className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground shadow-soft">
                {step.num}
              </div>
              <h3 className="font-display text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
