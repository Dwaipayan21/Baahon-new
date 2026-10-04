const AchievementBadge = ({ icon, title, unlocked, description }) => {
  return (
    <article
      className={`flex min-w-0 items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 ${
        unlocked
          ? "text-[var(--color-heading)]"
          : "text-[var(--color-muted)]"
      }`}
      aria-label={`${title}, ${unlocked ? "unlocked" : "locked"}`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          unlocked ? "bg-[var(--color-marigold-container)] text-[var(--color-marigold)]" : "bg-[var(--color-surface-secondary)] text-[var(--color-muted)]"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[10px] font-bold">{title}</span>
        <span className="mt-0.5 block truncate text-[9px]">
          {description}
        </span>
      </span>
      {unlocked && (
        <span className="material-symbols-outlined shrink-0 text-[15px] text-[var(--color-success)]">
          check_circle
        </span>
      )}
    </article>
  );
};

export default AchievementBadge;