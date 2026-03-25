import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login realizado com sucesso!");
      navigate(nextPath ?? "/meus-jogos");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎮</div>
            <h1 className="text-3xl font-bold mb-2">Entrar</h1>
            <p className="text-muted-foreground">Acesse seus jogos e participe de sorteios</p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                <LogIn className="w-4 h-4" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{" "}
              <Link
                to={nextPath ? `/cadastro?next=${encodeURIComponent(nextPath)}` : "/cadastro"}
                className="text-primary hover:underline font-medium"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
