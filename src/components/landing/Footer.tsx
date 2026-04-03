import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-background py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      <div className="container relative mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr] md:items-start">
          <div>
            <div className="mb-2">
              <span className="font-display text-lg font-bold">Amigo Secreto - PlayTime</span>
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
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
