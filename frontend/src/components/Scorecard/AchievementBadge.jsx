const AchievementBadge = ({ icon, title, unlocked, description }) => {
  return (
    <article
      className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
        unlocked
          ? "border-[#ead9ae] bg-[#fff9e9] text-[#795719]"
          : "border-[#e4e8e3] bg-white/65 text-[#8b958f]"
      }`}
      aria-label={`${title}, ${unlocked ? "unlocked" : "locked"}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          unlocked ? "bg-[#f5e5bd] text-[#94671f]" : "bg-[#edf0ed] text-[#98a19b]"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-bold">{title}</span>
        <span className="mt-0.5 block truncate text-[9px] opacity-75">
          {description}
        </span>
      </span>
      {unlocked && (
        <span className="material-symbols-outlined shrink-0 text-[15px] text-[#5b9168]">
          check_circle
        </span>
      )}
    </article>
  );
};

export default AchievementBadge;