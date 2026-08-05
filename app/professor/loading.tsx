export default function Loading() {
  return (
    <main className="px-8 py-10">
      <div className="animate-pulse space-y-4 max-w-3xl">
        <div className="h-6 w-48 bg-line/60 rounded" />
        <div className="h-24 bg-line/40 rounded-xl" />
        <div className="h-64 bg-line/40 rounded-xl" />
      </div>
    </main>
  );
}
