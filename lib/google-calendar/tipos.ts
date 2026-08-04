export type ResultadoGoogle<T> =
  | { ok: true; data: T }
  | { ok: false; erro: string; status?: number };

export type TokensGoogle = {
  accessToken: string;
  refreshToken: string | null;
  expiresInSegundos: number;
  scopes: string[];
};

export type CalendarioGoogle = {
  id: string;
  summary: string;
  primary: boolean;
};

export type EventoGoogle = {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  transparency?: "opaque" | "transparent";
  etag?: string;
  updated?: string;
  attendees?: { self?: boolean; responseStatus?: string }[];
};

export type PaginaEventos = {
  items: EventoGoogle[];
  nextPageToken?: string;
  nextSyncToken?: string;
};

/** Intervalo ocupado, já resolvido em instantes UTC precisos. */
export type IntervaloOcupado = {
  titulo: string | null;
  inicio: Date;
  fim: Date;
};
