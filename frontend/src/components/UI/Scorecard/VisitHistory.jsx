import VisitHistoryItem from "./VisitHistoryItem";

const VisitHistory = ({ visits }) => {
  const recentVisits = [...visits].sort((first, second) => {
    const firstDate = new Date(first.checkedInAt || 0).getTime();
    const secondDate = new Date(second.checkedInAt || 0).getTime();
    return secondDate - firstDate;
  });

  return (
    <section className="pb-1">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-[#a86743]">VISIT HISTORY</p>
          <h2 className="mt-0.5 text-lg font-bold text-[#1b302b]">Your Darshans</h2>
        </div>
        <span className="rounded-full border border-[#e2e8df] bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-[#53645a]">
          {visits.length}
        </span>
      </div>

      {recentVisits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d8dfd5] bg-white/70 px-5 py-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e4] text-[#a54b37]">
            <span className="material-symbols-outlined text-[25px]">temple_hindu</span>
          </span>
          <h3 className="mt-3 text-sm font-bold text-[#243b32]">Your Pujo journey starts here</h3>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[#718078]">
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