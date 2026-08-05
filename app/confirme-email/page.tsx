"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const COOLDOWN_SEGUNDOS = 60;

function ConfirmeEmailConteudo() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [cooldown, setCooldown] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function reenviar() {
    if (!email || cooldown > 0) return;
    setEnviando(true);
    setMensagem(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });

    setEnviando(false);
    setCooldown(COOLDOWN_SEGUNDOS);
    setMensagem(error ? "Não foi possível reenviar agora. Tente de novo em instantes." : "E-mail reenviado.");
  }

  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/70 border border-line rounded-xl p-8 text-center">
        <h1 className="font-display font-semibold text-2xl mb-2">Confirme seu e-mail</h1>
        <p className="text-sm text-ink/60 mb-6">
          Enviamos um link de confirmação
          {email ? (
            <>
              {" "}
              para <span className="font-medium text-ink">{email}</span>
            </>
          ) : (
            " para o seu e-mail"
          )}
          . Abra a caixa de entrada (e o spam) e clique no link antes de entrar.
        </p>

        {mensagem && (
          <p className="text-sm text-ink/70 mb-4" role="status">
            {mensagem}
          </p>
        )}

        <button
          type="button"
          onClick={reenviar}
          disabled={!email || enviando || cooldown > 0}
          className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-semibold hover:border-accent transition-colors disabled:opacity-50 disabled:hover:border-line"
        >
          {enviando
            ? "Enviando..."
            : cooldown > 0
            ? `Reenviar e-mail (aguarde ${cooldown}s)`
            : "Reenviar e-mail"}
        </button>

        <p className="text-sm text-ink/60 mt-4">
          Já confirmou?{" "}
          <Link href="/login" className="text-accent font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ConfirmeEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmeEmailConteudo />
    </Suspense>
  );
}
