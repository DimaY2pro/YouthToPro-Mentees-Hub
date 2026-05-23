interface Props {
  suggestion: string;
  streaming: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function AIImprovementBox({ suggestion, streaming, onAccept, onDismiss }: Props) {
  return (
    <div className="mt-2 rounded-xl border border-[#7EC5B3] bg-[#EFF6FF] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#7EC5B3] uppercase tracking-wide">
        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
        AI Suggestion
        {streaming && (
          <span className="ml-1 inline-flex items-center gap-1 text-slate-400 font-normal">
            <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
            Writing…
          </span>
        )}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap min-h-[3rem]">
        {suggestion}
        {streaming && <span className="animate-pulse">▌</span>}
      </p>
      {!streaming && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7EC5B3] text-white text-sm font-bold hover:bg-[#6ab5a3] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Use This
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-500 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
            Keep Original
          </button>
        </div>
      )}
    </div>
  );
}
