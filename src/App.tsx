import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import CriarJogo from "./pages/CriarJogo";
import Presentes from "./pages/Presentes";
import Evento from "./pages/Evento";
import Participar from "./pages/Participar";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import MeusJogos from "./pages/MeusJogos";
import BingoJogo from "./pages/BingoJogo";
import RoubaJogo from "./pages/RoubaJogo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/criar-jogo" element={<CriarJogo />} />
            <Route path="/presentes" element={<Presentes />} />
            <Route path="/evento/:slug/bingo" element={<BingoJogo />} />
            <Route path="/evento/:slug/rouba" element={<RoubaJogo />} />
            <Route path="/evento/:slug" element={<Evento />} />
            <Route path="/participar" element={<Participar />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/meus-jogos" element={<MeusJogos />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
