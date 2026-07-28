const API_VERSION = "v21.0";

type EnviarTemplateParams = {
  /** Número do destinatário em E.164, ex.: +5511999999999 */
  para: string;
  templateName: string;
  parametros: string[];
};

type ResultadoEnvio =
  | { ok: true; whatsappMessageId: string }
  | { ok: false; erro: string };

/**
 * Envia uma mensagem de template pela Meta Cloud API. Mensagens
 * iniciadas pelo negócio (fora da janela de 24h de atendimento) só
 * podem ser enviadas como template pré-aprovado — texto livre não é
 * aceito nesse caso, então esta é a única forma de envio usada aqui.
 */
export async function enviarTemplateWhatsapp(
  params: EnviarTemplateParams
): Promise<ResultadoEnvio> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, erro: "WhatsApp Cloud API não configurado (faltam variáveis de ambiente)" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.para,
          type: "template",
          template: {
            name: params.templateName,
            language: { code: "pt_BR" },
            components: [
              {
                type: "body",
                parameters: params.parametros.map((texto) => ({
                  type: "text",
                  text: texto,
                })),
              },
            ],
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        erro: data?.error?.message ?? `Falha no envio (HTTP ${res.status})`,
      };
    }

    return { ok: true, whatsappMessageId: data?.messages?.[0]?.id ?? "" };
  } catch (err) {
    return {
      ok: false,
      erro: err instanceof Error ? err.message : "Erro desconhecido no envio",
    };
  }
}
