import { NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import { gerarEstado, gerarParPkce } from "@/lib/google-calendar/oauth-state";

const ESCOPO = "https://www.googleapis.com/auth/calendar.readonly";

export async function GET(request: Request) {
  const profile = await getProfile();
  if (!profile || profile.role !== "professor") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = gerarEstado(profile.id);
  const { verifier, challenge } = gerarParPkce();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: ESCOPO,
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const resposta = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  resposta.cookies.set("gcal_pkce_verifier", verifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/google-calendar/oauth",
  });

  return resposta;
}
