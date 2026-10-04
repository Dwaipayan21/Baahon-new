import VisitHistoryItem from "./VisitHistoryItem";

const VisitHistory = ({ visits }) => {
  const recentVisits = [...visits].sort(
    (first, second) => {
      const firstDate = new Date(
        first.checkedInAt || 0
      ).getTime();

      const secondDate = new Date(
        second.checkedInAt || 0
      ).getTime();

      return secondDate - firstDate;
    }
  );

  return (
    <section className="pb-1">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Visit History
          </p>

          <h2 className="mt-0.5 text-lg font-bold text-[var(--color-heading)]">
            Your Darshans
          </h2>
        </div>
        <span className="rounded-full border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-[var(--color-heading)]">
          {visits.length}
        </span>
      </div>

      {recentVisits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white px-5 py-8 text-center shadow-sm">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)]">
            <span className="material-symbols-outlined text-[var(--color-primary)]">
              location_on
            </span>
          </span>

          <h3 className="mt-3 text-sm font-bold text-[var(--color-heading)]">
            Your Pujo journey starts here
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--color-muted)]">
            Visit a pandal and your Darshan will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentVisits.map((visit) => (
            <VisitHistoryItem
              key={visit.checkInId || visit.pandalId}
              visit={visit}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default VisitHistory;