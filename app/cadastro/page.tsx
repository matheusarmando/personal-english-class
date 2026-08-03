"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Papel = "professor" | "aluno";

export default function CadastroPage() {
  const router = useRouter();
  const [papel, setPapel] = useState<Papel>("professor");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, role_solicitado: papel },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setInfo(
        "Cadastro criado. Verifique seu e-mail para confirmar a conta antes de entrar."
      );
      setLoading(false);
      return;
    }

    router.push(`/${papel}`);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/70 border border-line rounded-xl p-8"
      >
        <h1 className="font-display font-semibold text-2xl mb-1">Criar conta</h1>
        <p className="text-sm text-ink/60 mb-6">
          {papel === "professor"
            ? "Cadastre-se para começar a organizar suas aulas."
            : "Cadastre-se para acessar sua área de aluno."}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setPapel("professor")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              papel === "professor"
                ? "border-accent bg-accentSoft text-ink"
                : "border-line text-ink/60 hover:border-accent"
            }`}
          >
            Sou professor
          </button>
          <button
            type="button"
            onClick={() => setPapel("aluno")}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              papel === "aluno"
                ? "border-accent bg-accentSoft text-ink"
                : "border-line text-ink/60 hover:border-accent"
            }`}
          >
            Sou aluno
          </button>
        </div>

        <label className="block text-sm mb-1" htmlFor="nome">
          Nome
        </label>
        <input
          id="nome"
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full mb-4 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <label className="block text-sm mb-1" htmlFor="confirmPassword">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mb-6 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {error && (
          <p className="text-sm text-bad mb-4" role="alert">
            {error}
          </p>
        )}

        {info && (
          <p className="text-sm text-good mb-4" role="status">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent text-white py-2.5 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-sm text-ink/60 mt-4 text-center">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent font-medium">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
