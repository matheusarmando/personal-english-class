"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { emailValido, senhaValida } from "@/lib/validacao";

type Papel = "professor" | "aluno";

export default function CadastroPage() {
  const router = useRouter();
  const [papel, setPapel] = useState<Papel>("professor");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState(false);
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    if (!senhaValida(password)) {
      setError("A senha precisa ter 8-60 caracteres, com ao menos 1 letra maiúscula e 1 número.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, role_solicitado: papel },
        // Sem isso, o link do e-mail de confirmação usa a "Site URL"
        // configurada no dashboard do Supabase como destino — se
        // aquela config estiver desatualizada (ex.: localhost), TODO
        // link de confirmação sai errado. Fixando aqui, o link sempre
        // aponta pro domínio de onde o cadastro realmente veio.
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      router.push(`/confirme-email?email=${encodeURIComponent(email)}`);
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

        <div className="mb-4">
          <label className="block text-sm mb-1" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="nome@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => {
              const valor = e.target.value.trim();
              setErroEmail(valor && !emailValido(valor) ? "E-mail em formato inválido." : null);
            }}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
              erroEmail ? "border-bad" : "border-line"
            }`}
          />
          {erroEmail && (
            <p className="text-xs text-bad mt-1" role="alert">
              {erroEmail}
            </p>
          )}
        </div>

        <label className="block text-sm mb-1" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={(e) => setErroSenha(Boolean(e.target.value) && !senhaValida(e.target.value))}
          className={`w-full mb-1 rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
            erroSenha ? "border-bad" : "border-line"
          }`}
        />
        <p className={`text-xs mb-4 ${erroSenha ? "text-bad" : "text-ink/50"}`}>
          Mínimo 8 caracteres, com 1 letra maiúscula e 1 número.
        </p>

        <div className="mb-6">
          <label className="block text-sm mb-1" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={(e) =>
              setErroConfirmarSenha(
                e.target.value && e.target.value !== password ? "As senhas não conferem." : null
              )
            }
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent ${
              erroConfirmarSenha ? "border-bad" : "border-line"
            }`}
          />
          {erroConfirmarSenha && (
            <p className="text-xs text-bad mt-1" role="alert">
              {erroConfirmarSenha}
            </p>
          )}
        </div>

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
