import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const metrics = ["Segurança", "Gratuito", "Controle", "Diversão"];

const MetricCircle = ({ label, delay }: { label: string; delay: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let frameId = 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(easedProgress * 100));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/10 sm:h-40 sm:w-40">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="9" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="9"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.2, delay, ease: "easeOut" }}
          />
        </svg>
        <span className="relative font-display text-4xl font-bold text-white">{value}%</span>
      </div>
      <p className="mt-4 text-lg font-semibold text-white">{label}</p>
    </motion.div>
  );
};

const PorqueNos = () => {
  return (
    <div className="mesh-bg min-h-screen">
      <div className="flex min-h-[100dvh] flex-col">
        <Navbar />
        <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
          <div className="container relative z-10 mx-auto flex flex-1 items-start px-3 pb-10 pt-8 md:px-4 md:pb-12 md:pt-10 lg:pb-16 lg:pt-12">
            <div className="grid w-full items-start gap-10 lg:grid-cols-2 lg:gap-12">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="max-w-2xl text-left lg:ml-6 xl:ml-10"
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Por que Nós?</p>
                <h1 className="font-body text-4xl font-bold leading-tight tracking-tight text-gradient md:text-5xl">
                  Jogos em grupo com mais organização e diversão
                </h1>
                <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8 xl:text-xl xl:leading-relaxed">
                  <p>
                    Nossa plataforma foi criada para transformar a forma como famílias e amigos organizam jogos e
                    brincadeiras em grupo. Em ocasiões como Natal, festas de fim de ano e churrascos, atividades como
                    bingo e amigo secreto costumam fazer parte da diversão, mas muitas vezes faltam ferramentas para
                    facilitar a organização dos sorteios, das datas e até mesmo da escolha e compra dos presentes.
                  </p>
                  <p>
                    Pensando nisso, desenvolvemos uma plataforma 100% gratuita que reúne tudo o que você precisa para
                    gerenciar e jogar com praticidade. Crie suas partidas do seu jeito, utilize recursos como roleta
                    online, organize sorteios e aproveite momentos ainda mais divertidos com quem você gosta.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.7, delay: 0.22 }}
                className="relative flex min-h-[300px] items-center justify-center lg:min-h-[420px]"
              >
                <div className="absolute h-56 w-56 rounded-full bg-primary/15 blur-3xl md:h-72 md:w-72" />
                <motion.img
                  src="/porque-nos-jogos.png"
                  alt="Tabuleiro de jogos em grupo com presentes e amigos"
                  className="relative h-auto w-full max-w-[380px] object-contain drop-shadow-[0_30px_40px_hsl(var(--foreground)/0.22)] md:max-w-[470px] xl:max-w-[560px]"
                  animate={{ y: [-8, 8, -8], rotate: [-1, 1, -1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>
          <section className="relative z-10 px-3 pb-20 md:px-4 lg:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55 }}
              className="container mx-auto overflow-hidden rounded-[2rem] border border-white/15 bg-[hsl(356_68%_40%)] p-6 shadow-[0_28px_60px_-24px_hsl(356_68%_28%_/_0.55)] sm:p-8 lg:p-10"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, index) => (
                  <MetricCircle key={metric} label={metric} delay={index * 0.12} />
                ))}
              </div>
            </motion.div>
          </section>
          <section className="relative z-10 px-3 pb-20 md:px-4 lg:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55 }}
              className="container mx-auto flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:gap-6"
            >
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Conheça nossos jogos</h2>
              <Button variant="hero" size="xl" asChild>
                <Link to="/criar-jogo">
                  Jogar
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PorqueNos;
