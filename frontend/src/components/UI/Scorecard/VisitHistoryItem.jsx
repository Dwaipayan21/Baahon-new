const CATEGORY_LABELS = {
  traditional: "Traditional",
  theme: "Theme",
  heritage: "Heritage",
};

const VisitHistoryItem = ({ visit }) => {
  const category =
    CATEGORY_LABELS[visit.category] || visit.category || "Pandal";

  const visitDate = visit.checkedInAt
    ? new Date(visit.checkedInAt)
    : null;
  const formattedDate =
    visitDate && !Number.isNaN(visitDate.getTime())
      ? visitDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Date unavailable";

  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-sm sm:px-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-container-light)] text-[var(--color-primary)]">
        <span className="material-symbols-outlined text-[20px]">temple_hindu</span>
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-[var(--color-heading)]">
          {visit.pandalName}
        </h3>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-[var(--color-muted)]">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">category</span>
            {category}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">calendar_month</span>
            {formattedDate}
          </span>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-marigold-container)] px-2.5 py-1.5 text-xs font-extrabold tabular-nums text-[var(--color-marigold-text)]">
        <span className="material-symbols-outlined text-[15px]">stars</span>
        +{visit.points}
      </span>
    </article>
  );
};

export default VisitHistoryItem;