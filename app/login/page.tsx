"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    // Camada extra além do que o Supabase Auth já deveria bloquear:
    // se por algum motivo uma sessão saiu sem e-mail confirmado (ex.:
    // configuração de confirmação de e-mail desligada no projeto),
    // barra aqui também em vez de deixar entrar.
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setError("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const next = searchParams.get("next");
    const destino = next ?? `/${profile?.role ?? "aluno"}`;
    router.push(destino);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white/70 border border-line rounded-xl p-8"
    >
      <h1 className="font-display font-semibold text-2xl mb-1">Entrar</h1>
      <p className="text-sm text-ink/60 mb-6">
        Acesse sua área: aluno, professor ou gestão.
      </p>

      <label className="block text-sm mb-1" htmlFor="email">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-4 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />

      <label className="block text-sm mb-1" htmlFor="password">
        Senha
      </label>
      <input
        id="password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-6 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {error && (
        <p className="text-sm text-bad mb-4" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent text-white py-2.5 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-sm text-ink/60 mt-4 text-center">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-accent font-medium">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
