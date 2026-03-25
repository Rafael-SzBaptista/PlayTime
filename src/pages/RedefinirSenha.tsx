import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, KeyRound } from "lucide-react";

type ScreenState = "loading" | "form" | "invalid";

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<ScreenState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const clearTimer = () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };

    const markReady = () => {
      if (cancelled) return;
      clearTimer();
      setScreen("form");
    };

    const markInvalidIfStillLoading = () => {
      if (cancelled) return;
      setScreen((s) => (s === "loading" ? "invalid" : s));
    };

    const hash = window.location.hash;
    const search = window.location.search;
    const hasRecoveryHint =
      hash.includes("type=recovery") ||
      hash.includes("type%3Drecovery") ||
      hash.includes("access_token") ||
      search.includes("code=");

    timeoutId = window.setTimeout(markInvalidIfStillLoading, hasRecoveryHint ? 12000 : 2500);

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        markReady();
      }
    });

    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    if (hashParams.get("type") === "recovery") {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) markReady();
      });
    }

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha redefinida com sucesso!");
    navigate("/meus-jogos");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔑</div>
            <h1 className="text-3xl font-bold mb-2">Nova senha</h1>
            <p className="text-muted-foreground">Defina uma nova senha para sua conta.</p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            {screen === "loading" && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Validando link...
              </p>
            )}

            {screen === "invalid" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Este link é inválido ou expirou. Solicite um novo email de recuperação.
                </p>
                <Button variant="hero" className="w-full" asChild>
                  <Link to="/recuperar-senha">Pedir novo link</Link>
                </Button>
                <p className="text-sm">
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Voltar ao login
                  </Link>
                </p>
              </div>
            )}

            {screen === "form" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10"
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="h-12 pl-10"
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  <KeyRound className="w-4 h-4" />
                  {loading ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default RedefinirSenha;
