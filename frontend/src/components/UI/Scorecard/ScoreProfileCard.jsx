const formatCoordinate = (value, positive, negative) => {
  if (!Number.isFinite(value)) return "";
  return `${Math.abs(value).toFixed(3)}° ${value >= 0 ? positive : negative}`;
};

const ScoreProfileCard = ({ guestUserId, userLocation }) => {
  const locationText = userLocation
    ? `${formatCoordinate(userLocation.lat, "N", "S")} · ${formatCoordinate(
        userLocation.lng,
        "E",
        "W"
      )}`
    : "Location not shared";

  return (
    <section className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e3e8e0] bg-white px-3.5 py-3 shadow-[0_3px_12px_rgba(28,48,39,0.04)] sm:px-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dce9df] bg-[#edf5ee] text-[#2d6a58]">
        <span className="material-symbols-outlined text-[23px]">person</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-sm font-bold text-[#20332d]">Pujo Explorer</h2>
          <span className="material-symbols-outlined material-symbols-filled text-[15px] text-[#41866a]">
            verified
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-[#78867e]">
          {guestUserId ? "Guest profile" : "Guest profile unavailable"}
        </p>
      </div>
      <div className="max-w-[46%] min-w-0 text-right">
        <p className="flex items-center justify-end gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#6d8175]">
          <span className={`h-1.5 w-1.5 rounded-full ${userLocation ? "bg-[#4d9b68]" : "bg-[#c2a15e]"}`} />
          {userLocation ? "Location active" : "Location off"}
        </p>
        <p className="mt-1 truncate text-[10px] font-medium tabular-nums text-[#33483e]">
          {locationText}
        </p>
      </div>
    </section>
  );
};

export default ScoreProfileCard;