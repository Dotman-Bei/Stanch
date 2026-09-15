const ITEMS = [
  "HALT AUTHORITY WITH NO WRITE ACCESS",
  "★",
  "IT CANNOT RESUME",
  "★",
  "IT CANNOT UPGRADE",
  "★",
  "IT HOLDS NO VALUE",
  "★",
  "THE TARGET ENFORCES THE VERDICT ON ITSELF",
  "★",
  "STUDIO NEXT · CHAIN 61997",
  "★",
];

export function Ticker() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y-[3px] border-black bg-[#CCFF00] py-2">
      <div className="animate-[marquee_38s_linear_infinite] flex w-max items-center gap-6 whitespace-nowrap">
        {row.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="text-[11px] font-black uppercase tracking-[0.18em] text-black md:text-xs"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
