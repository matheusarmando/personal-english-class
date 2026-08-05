import WidgetCard from "./WidgetCard";
import EstadoVazio from "./EstadoVazio";
import { marcarNotificacaoComoLida } from "@/app/actions";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
};

export default function WidgetNotificacoes({
  notificacoes,
  titulo = "Avisos financeiros",
}: {
  notificacoes: Notificacao[];
  titulo?: string;
}) {
  return (
    <WidgetCard titulo={titulo}>
      {notificacoes.length === 0 ? (
        <EstadoVazio texto="Nenhum aviso novo." />
      ) : (
        <ul className="space-y-1.5">
          {notificacoes.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-2 text-sm bg-paper rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{n.titulo}</p>
                <p className="text-xs text-ink/50">{n.mensagem}</p>
              </div>
              <form action={marcarNotificacaoComoLida.bind(null, n.id)}>
                <button
                  type="submit"
                  title="Marcar como lida"
                  className="text-ink/30 hover:text-accent shrink-0"
                >
                  ✓
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
