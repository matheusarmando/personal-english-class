export default function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="h-full min-h-[6rem] flex items-center justify-center text-center text-sm text-ink/40">
      {texto}
    </div>
  );
}
