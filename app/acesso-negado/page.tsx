import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <main className="min-h-screen bg-paper text-ink flex flex-col items-center justify-center px-6 text-center">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-3">
        Acesso restrito
      </p>
      <h1 className="font-display font-semibold text-3xl mb-3">
        Essa área não é para o seu perfil.
      </h1>
      <p className="text-sm text-ink/60 mb-6 max-w-sm">
        Seu papel atual não tem permissão para acessar essa página. Volte
        para a sua área ou fale com a gestão da escola.
      </p>
      <Link
        href="/"
        className="text-sm font-medium px-4 py-2 rounded-full border border-ink hover:bg-ink hover:text-paper transition-colors"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
