type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <header className="mx-auto w-full max-w-md px-4 pt-6 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </header>
  );
}
