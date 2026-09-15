export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className={`relative rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 font-black tracking-tight text-black shadow-sm ${
          compact ? "text-xs" : "text-xs md:text-sm"
        }`}
      >
        STANCH
        <div
          className="absolute -bottom-1.5 left-0 h-3 w-3 bg-white"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
      </div>
      <div
        className={`rounded-full border-[1.5px] border-white bg-[#CCFF00] px-3 py-1.5 font-black text-black shadow-sm ${
          compact ? "text-xs" : "text-xs md:text-sm"
        }`}
      >
        HALT
      </div>
    </div>
  );
}
