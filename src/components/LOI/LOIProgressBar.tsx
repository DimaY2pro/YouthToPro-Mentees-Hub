interface Props {
  completed: number;
  total: number;
}

export default function LOIProgressBar({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">
          <span className="text-[#183B68] font-bold">{completed}</span> of {total} fields completed
        </span>
        <span className="font-bold text-[#7EC5B3]">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#7EC5B3] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
