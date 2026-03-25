import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

const RecuperarSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectTo = `${window.location.origin}/redefinir-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Verifique seu email.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold mb-2">Recuperar senha</h1>
            <p className="text-muted-foreground">
              Enviaremos um link para redefinir sua senha no email cadastrado.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Se existir uma conta com <strong className="text-foreground">{email}</strong>, você
                  receberá um email com instruções em instantes. Verifique também a pasta de spam.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao login
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-4">
              <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Voltar ao login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default RecuperarSenha;
