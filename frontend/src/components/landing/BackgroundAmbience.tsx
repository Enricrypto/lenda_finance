export default function BackgroundAmbience() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 left-0 w-[800px] h-[600px] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-indigo-900/10 blur-[100px] rounded-full mix-blend-screen" />
      <div className="absolute inset-0 bg-grid opacity-20" />
    </div>
  );
}
