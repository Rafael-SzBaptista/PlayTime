import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, LogIn, LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, displayName, signOut } = useAuth();

  const navLink =
    "rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:bg-muted/65 hover:text-foreground";

  return (
    <>
      <Link
        to="/"
        className="fixed left-3 top-3 z-50 inline-flex items-center justify-center transition-transform duration-300 hover:scale-105 md:left-4"
      >
        <img
          src="/logo-playtime.png"
          alt="Logo PlayTime"
          className="h-auto w-28 object-contain drop-shadow-[0_8px_20px_hsl(var(--foreground)/0.25)] sm:w-32 md:w-40"
        />
      </Link>

      <nav className="fixed right-3 top-3 z-50 md:right-4 md:top-4">
        <div className="hidden h-12 items-center gap-2 rounded-2xl border border-border/70 bg-background/90 px-2 shadow-card backdrop-blur-xl md:flex">
          <div className="hidden items-center gap-0.5 md:flex">
            <Link to="/presentes" className={navLink}>
              Sugestões
            </Link>
            <Link to="/participar" className={navLink}>
              Participar
            </Link>
            {user && (
              <Link to="/meus-jogos" className={navLink}>
                Meus Jogos
              </Link>
            )}
          </div>

          <div className="ml-1 flex items-center gap-1">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{displayName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/70">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Minha conta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:bg-muted/65 focus:text-foreground data-[highlighted]:bg-muted/65 data-[highlighted]:text-foreground"
                    >
                      <Link to="/meus-jogos">Meus Jogos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground focus:bg-muted/65 focus:text-foreground data-[highlighted]:bg-muted/65 data-[highlighted]:text-foreground"
                      onClick={() => {
                        void signOut();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="hero" size="sm" asChild className="h-8 rounded-lg px-3 text-xs">
                  <Link to="/criar-jogo">
                    <Gift className="h-4 w-4" />
                    Criar Jogo
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="h-8 rounded-lg px-2">
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Link>
                </Button>
                <Button variant="hero" size="sm" asChild className="h-8 rounded-lg px-3 text-xs">
                  <Link to="/criar-jogo">
                    <Gift className="h-4 w-4" />
                    Criar Jogo
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full p-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/70">
              <DropdownMenuItem asChild>
                <Link to="/presentes">Sugestões</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/participar">Participar</Link>
              </DropdownMenuItem>
              {user && (
                <DropdownMenuItem asChild>
                  <Link to="/meus-jogos">Meus Jogos</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{displayName}</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/criar-jogo">Criar Jogo</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login">Entrar</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/criar-jogo">Criar Jogo</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
      <div aria-hidden className="h-16 md:h-0" />
    </>
  );
};

export default Navbar;
