export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );
}
