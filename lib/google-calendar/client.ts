import type { CalendarioGoogle, PaginaEventos, ResultadoGoogle, TokensGoogle } from "./tipos";

const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/**
 * Faz fetch com retry + backoff exponencial e jitter em erros
 * transitórios (403 rateLimitExceeded, 429, 5xx), como pedido pro
 * cliente do Google. Mesmo espírito do `lib/whatsapp/client.ts`: sem
 * SDK, só fetch cru.
 */
async function fetchComRetry(url: string, init: RequestInit, tentativas = 4): Promise<Response> {
  let ultimaResposta: Response | undefined;

  for (let tentativa = 0; tentativa < tentativas; tentativa++) {
    const resposta = await fetch(url, init);

    if (resposta.status !== 429 && resposta.status < 500) {
      return resposta;
    }
    if (resposta.status === 403) {
      const corpo = await resposta.clone().json().catch(() => null);
      const motivo = corpo?.error?.errors?.[0]?.reason;
      if (motivo !== "rateLimitExceeded" && motivo !== "userRateLimitExceeded") {
        return resposta;
      }
    }

    ultimaResposta = resposta;
    if (tentativa < tentativas - 1) {
      const espera = 2 ** tentativa * 500 + Math.random() * 250;
      await new Promise((resolve) => setTimeout(resolve, espera));
    }
  }

  return ultimaResposta!;
}

function paraCorpoFormUrlEncoded(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

export async function trocarCodigoPorTokens(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<ResultadoGoogle<TokensGoogle>> {
  const resposta = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: paraCorpoFormUrlEncoded({
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
      grant_type: "authorization_code",
    }),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error_description ?? corpo?.error ?? `HTTP ${resposta.status}`, status: resposta.status };
  }

  return {
    ok: true,
    data: {
      accessToken: corpo.access_token,
      refreshToken: corpo.refresh_token ?? null,
      expiresInSegundos: corpo.expires_in,
      scopes: (corpo.scope ?? "").split(" ").filter(Boolean),
    },
  };
}

export async function renovarAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<ResultadoGoogle<{ accessToken: string; expiresInSegundos: number }>> {
  const resposta = await fetchComRetry(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: paraCorpoFormUrlEncoded({
      refresh_token: params.refreshToken,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error ?? `HTTP ${resposta.status}`, status: resposta.status };
  }

  return {
    ok: true,
    data: { accessToken: corpo.access_token, expiresInSegundos: corpo.expires_in },
  };
}

export async function revogarToken(token: string): Promise<ResultadoGoogle<void>> {
  const resposta = await fetch(`${OAUTH_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!resposta.ok && resposta.status !== 400) {
    // 400 geralmente significa "token já inválido" — trata como já revogado.
    return { ok: false, erro: `HTTP ${resposta.status}`, status: resposta.status };
  }
  return { ok: true, data: undefined };
}

function cabecalhosAuth(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
}

export async function listarCalendarios(accessToken: string): Promise<ResultadoGoogle<CalendarioGoogle[]>> {
  const resposta = await fetchComRetry(`${CALENDAR_API}/users/me/calendarList`, {
    headers: cabecalhosAuth(accessToken),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error?.message ?? `HTTP ${resposta.status}`, status: resposta.status };
  }

  return {
    ok: true,
    data: (corpo.items ?? []).map((c: any) => ({ id: c.id, summary: c.summary, primary: Boolean(c.primary) })),
  };
}

export async function listarEventos(params: {
  accessToken: string;
  calendarId: string;
  syncToken?: string;
  pageToken?: string;
  timeMin?: string;
  timeMax?: string;
}): Promise<ResultadoGoogle<PaginaEventos>> {
  const query = new URLSearchParams({ singleEvents: "true", orderBy: "startTime", maxResults: "250" });
  if (params.syncToken) {
    query.set("syncToken", params.syncToken);
    query.delete("orderBy"); // orderBy não é permitido junto com syncToken
  } else {
    if (params.timeMin) query.set("timeMin", params.timeMin);
    if (params.timeMax) query.set("timeMax", params.timeMax);
  }
  if (params.pageToken) query.set("pageToken", params.pageToken);

  const resposta = await fetchComRetry(
    `${CALENDAR_API}/calendars/${encodeURIComponent(params.calendarId)}/events?${query.toString()}`,
    { headers: cabecalhosAuth(params.accessToken) }
  );

  if (resposta.status === 410) {
    return { ok: false, erro: "sync_token_invalido", status: 410 };
  }

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error?.message ?? `HTTP ${resposta.status}`, status: resposta.status };
  }

  return {
    ok: true,
    data: { items: corpo.items ?? [], nextPageToken: corpo.nextPageToken, nextSyncToken: corpo.nextSyncToken },
  };
}

export async function consultarFreeBusy(params: {
  accessToken: string;
  calendarIds: string[];
  timeMin: string;
  timeMax: string;
}): Promise<ResultadoGoogle<Record<string, { start: string; end: string }[]>>> {
  const resposta = await fetchComRetry(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: cabecalhosAuth(params.accessToken),
    body: JSON.stringify({
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      items: params.calendarIds.map((id) => ({ id })),
    }),
  });

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error?.message ?? `HTTP ${resposta.status}`, status: resposta.status };
  }

  const ocupado: Record<string, { start: string; end: string }[]> = {};
  for (const [calendarId, valor] of Object.entries(corpo.calendars ?? {})) {
    ocupado[calendarId] = (valor as any).busy ?? [];
  }
  return { ok: true, data: ocupado };
}

export async function registrarWatch(params: {
  accessToken: string;
  calendarId: string;
  channelId: string;
  channelToken: string;
  webhookUrl: string;
}): Promise<ResultadoGoogle<{ resourceId: string; expiration: string }>> {
  const resposta = await fetchComRetry(
    `${CALENDAR_API}/calendars/${encodeURIComponent(params.calendarId)}/events/watch`,
    {
      method: "POST",
      headers: cabecalhosAuth(params.accessToken),
      body: JSON.stringify({
        id: params.channelId,
        type: "web_hook",
        address: params.webhookUrl,
        token: params.channelToken,
      }),
    }
  );

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    return { ok: false, erro: corpo?.error?.message ?? `HTTP ${resposta.status}`, status: resposta.status };
  }

  return { ok: true, data: { resourceId: corpo.resourceId, expiration: corpo.expiration } };
}

export async function pararWatch(params: {
  accessToken: string;
  channelId: string;
  resourceId: string;
}): Promise<ResultadoGoogle<void>> {
  const resposta = await fetchComRetry(`${CALENDAR_API}/channels/stop`, {
    method: "POST",
    headers: cabecalhosAuth(params.accessToken),
    body: JSON.stringify({ id: params.channelId, resourceId: params.resourceId }),
  });

  if (!resposta.ok && resposta.status !== 404) {
    const corpo = await resposta.json().catch(() => null);
    return { ok: false, erro: corpo?.error?.message ?? `HTTP ${resposta.status}`, status: resposta.status };
  }
  return { ok: true, data: undefined };
}
