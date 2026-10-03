const ScoreProfileCard = ({ user }) => {
  const displayName =
    user?.fullName ||
    user?.username ||
    user?.firstName ||
    "Pujo Explorer";

  const imageUrl = user?.imageUrl;

  return (
    <section className="flex min-w-0 items-center gap-3 rounded-xl border border-[#e3e8e0] bg-white px-3.5 py-3 shadow-[0_3px_12px_rgba(28,48,39,0.04)] sm:px-4">
      {/* Profile picture */}
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#dce9df] bg-[#edf5ee]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#2d6a58]">
            <span className="material-symbols-outlined text-[23px]">
              person
            </span>
          </span>
        )}
      </div>

      {/* User details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-sm font-bold text-[#20332d]">
            {displayName}
          </h2>

          {user && (
            <span className="material-symbols-outlined material-symbols-filled text-[15px] text-[#41866a]">
              verified
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[10px] text-[#78867e]">
          Your Pujo Journey
        </p>
      </div>
    </section>
  );
};

export default ScoreProfileCard;