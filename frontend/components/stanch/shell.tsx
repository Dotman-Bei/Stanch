export function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-[1180px] px-4 md:px-8 2xl:max-w-[1440px] ${className}`}>
      {children}
    </section>
  );
}

export function PageTitle({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: React.ReactNode;
}) {
  return (
    <div className="pt-10 md:pt-14">
      <div className="inline-flex items-center rounded-full border-[3px] border-black bg-[#CCFF00] px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-black">
        {eyebrow}
      </div>
      <h1 className="extrude-sm mt-4 text-4xl text-white md:text-6xl">{title}</h1>
      {lede ? (
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/85 md:text-base">
          {lede}
        </p>
      ) : null}
    </div>
  );
}

export function Tray({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border-[3px] border-black bg-[#F8F9FA] p-5 text-black shadow-[8px_8px_0px_#001A99] md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function FrostPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`frost rounded-[2rem] border-[1.5px] border-white/40 p-5 text-white md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function Callout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-black bg-black px-5 py-4 text-white shadow-[5px_5px_0px_#CCFF00]">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#CCFF00]">
        {title}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-white/85">{children}</div>
    </div>
  );
}
