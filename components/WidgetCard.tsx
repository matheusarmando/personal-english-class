export default function WidgetCard({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-line rounded-xl bg-white overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        {acao}
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}
