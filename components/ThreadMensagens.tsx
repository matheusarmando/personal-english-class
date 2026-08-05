type Mensagem = { id: string; remetenteId: string; texto: string; hora: string };

export default function ThreadMensagens({
  mensagens,
  meuProfileId,
}: {
  mensagens: Mensagem[];
  meuProfileId: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-paper/40">
      {mensagens.length === 0 && (
        <p className="text-sm text-ink/40 text-center mt-6">Nenhuma mensagem ainda.</p>
      )}
      {mensagens.map((m) => {
        const souEu = m.remetenteId === meuProfileId;
        return (
          <div key={m.id} className={`flex ${souEu ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                souEu
                  ? "bg-accent text-white rounded-br-sm"
                  : "bg-white border border-line rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.texto}</p>
              <p className={`text-[10px] mt-1 ${souEu ? "text-white/70" : "text-ink/40"}`}>{m.hora}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
