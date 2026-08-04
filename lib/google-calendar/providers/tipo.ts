import type { IntervaloOcupado } from "../tipos";

/**
 * Abstração de acesso à agenda externa do professor. A regra de
 * negócio de agendamento de aula nunca chama a API do Google
 * diretamente — sempre passa por aqui, pra trocar de provedor (ou
 * suportar mais de um) sem tocar no domínio.
 *
 * Fase 1 (implementada agora): só leitura.
 *
 * PONTOS DE EXTENSÃO PRA FASE 2 (não implementar ainda — arquitetura
 * só precisa deixar isso encaixável sem refatoração):
 * - `criarEvento(aula)` → `{ googleEventId, etag }`: `events.insert`
 *   com `conferenceData.createRequest` (Meet, `conferenceDataVersion=1`)
 *   e `attendees` (aluno), `sendUpdates=all`. Guardar
 *   `google_event_id`/`google_event_etag` em `aluno_horarios` (colunas
 *   já existem, adicionadas na migration 0020).
 * - `atualizarEvento(aula)` → `{ etag }`: `events.patch` com
 *   `If-Match: etag` — escrita condicional, a plataforma é a fonte
 *   da verdade pra aulas, não o Google.
 * - `cancelarEvento(aula)`: `events.delete`.
 * - Todas as três precisam ser idempotentes (chave de idempotência
 *   por `aula_id`) e rodar em fila/retry — uma falha do Google não
 *   pode derrubar o agendamento na plataforma.
 * - O evento criado pela própria plataforma marca
 *   `extendedProperties.private` com um identificador nosso, pro
 *   webhook (`sincronizarConta`) saber ignorar o próprio eco em vez
 *   de tratar como um evento externo novo.
 */
export interface CalendarProvider {
  /** Conflito (se houver) da conta conectada do professor pro intervalo pedido. */
  verificarOcupacao(
    professorId: string,
    inicio: Date,
    fim: Date
  ): Promise<{ contaConectada: boolean; conflito: IntervaloOcupado | null }>;

  /** Sincroniza o espelho local de uma conta (carga inicial ou incremental). */
  sincronizar(accountId: string): Promise<void>;
}
