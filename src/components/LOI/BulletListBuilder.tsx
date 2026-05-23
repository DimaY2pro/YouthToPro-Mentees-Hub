interface Props {
  label: string;
  bullets: string[];
  placeholders: string[];
  onChange: (bullets: string[]) => void;
}

export default function BulletListBuilder({ label, bullets, placeholders, onChange }: Props) {
  const update = (index: number, value: string) => {
    const next = [...bullets];
    next[index] = value;
    onChange(next);
  };

  const add = () => {
    if (bullets.length < 5) onChange([...bullets, '']);
  };

  const remove = (index: number) => {
    if (bullets.length <= 1) return;
    onChange(bullets.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex flex-col gap-2">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[#7EC5B3] font-bold text-lg leading-none shrink-0">•</span>
            <input
              type="text"
              value={bullet}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholders[i] ?? `Point ${i + 1}…`}
              className="flex-1 h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7EC5B3] focus:ring-1 focus:ring-[#7EC5B3] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={bullets.length <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Remove"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>
      {bullets.length < 5 && (
        <button
          type="button"
          onClick={add}
          className="self-start flex items-center gap-1.5 text-sm text-[#183B68] font-medium hover:text-[#7EC5B3] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add Point
        </button>
      )}
    </div>
  );
}
