export default function NoPrimarySave() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-64 max-w-2xl mx-auto bg-[var(--color-darker)] rounded-xl shadow-lg p-8 text-center">
      <div className="text-5xl mb-4">🕹️</div>
      <h3 className="text-xl font-bold text-white mb-2">No Primary Save Selected</h3>
      <p className="text-gray-300">You haven't chosen a primary save yet. Select one of your saves to showcase your main Football Manager journey here!</p>
    </div>
  );
}