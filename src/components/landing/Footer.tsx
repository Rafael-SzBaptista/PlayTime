import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-background py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      <div className="container relative mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <img src="/logo-playtime.png" alt="Logo PlayTime" className="h-8 w-auto object-contain" />
              <span className="font-display text-lg font-bold">PlayTime</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A forma mais divertida de organizar trocas de presentes — com cara de app moderno, não de planilha.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold">Links úteis</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/criar-jogo" className="transition-colors hover:text-primary">
                  Criar jogo
                </Link>
              </li>
              <li>
                <Link to="/presentes" className="transition-colors hover:text-primary">
                  Sugestões de presentes
                </Link>
              </li>
              <li>
                <Link to="/presentes/ate-50" className="transition-colors hover:text-primary">
                  Presentes até R$50
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold">Ideias</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/ideias/amigo-secreto" className="transition-colors hover:text-primary">
                  Ideias para Amigo Secreto
                </Link>
              </li>
              <li>
                <Link to="/ideias/engracados" className="transition-colors hover:text-primary">
                  Presentes engraçados
                </Link>
              </li>
              <li>
                <Link to="/ideias/baratos" className="transition-colors hover:text-primary">
                  Presentes baratos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-7 border-t border-border/60 pt-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PlayTime. Feito para tornar suas celebrações especiais.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
