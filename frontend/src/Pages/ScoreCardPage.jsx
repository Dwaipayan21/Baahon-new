import ScoreHeader from "../components/UI/Scorecard/ScoreHeader";
import CrowdReporterCard from "../components/UI/Scorecard/CrowdReporterCard";

const ScorecardPage = ({
  user = null,
  scorecard = null,
  pandals = [],
  leaderboard = [],
  onBack,
}) => {
  const visits = Array.isArray(scorecard?.visits)
    ? scorecard.visits
    : [];

  /*
   * Personal stats
   *
   * Rank is intentionally NOT shown here.
   */
  const visitedCount = visits.length;

  /*
   * Placeholder values for stats that are not currently
   * stored in the scorecard backend.
   *
   * We will connect distance + steps to real data later.
   */
  const distanceCovered = Number(
    scorecard?.distanceCovered || 0
  );

  const steps = Number(
    scorecard?.steps || 0
  );

  const displayName =
    user?.fullName ||
    user?.username ||
    "Pujo Explorer";

  const imageUrl = user?.imageUrl || "";

  /*
   * Leaderboard data
   *
   * Sort by total points first.
   * Pandal count is used as a tie-breaker.
   */
  const sortedLeaderboard = [...leaderboard].sort(
    (a, b) => {
      const pointsDifference =
        Number(b?.totalPoints || 0) -
        Number(a?.totalPoints || 0);

      if (pointsDifference !== 0) {
        return pointsDifference;
      }

      return (
        Number(b?.visits || 0) -
        Number(a?.visits || 0)
      );
    }
  );

  const topThree = sortedLeaderboard.slice(0, 3);

  const getUserName = (entry) =>
    entry?.name ||
    entry?.fullName ||
    "Pujo Explorer";

  const getInitials = (name) => {
    const parts = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 0) {
      return "PE";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  };

  const isCurrentUser = (entry) => {
    if (!entry || !user) {
      return false;
    }

    return (
      entry.userId === user.id ||
      entry.id === user.id
    );
  };

  const renderAvatar = (
    entry,
    size = "h-11 w-11"
  ) => {
    const name = getUserName(entry);
    const image =
      entry?.imageUrl ||
      entry?.profileImage ||
      entry?.avatarUrl;

    if (image) {
      return (
        <img
          src={image}
          alt={name}
          className={`${size} shrink-0 rounded-full object-cover`}
        />
      );
    }

    return (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#e8f2ec] font-bold text-[#2d6a58]`}
      >
        {getInitials(name)}
      </div>
    );
  };

  const renderPodiumUser = (
    entry,
    rank
  ) => {
    if (!entry) {
      return null;
    }

    const name = getUserName(entry);
    const visits = Number(entry?.visits || 0);
    const points = Number(entry?.totalPoints || 0);
    const area =
      entry?.area ||
      entry?.location ||
      "Kolkata";

    const isFirst = rank === 1;

    return (
      <div
        className={`flex min-w-0 flex-1 flex-col items-center ${
          isFirst ? "order-2" : rank === 2 ? "order-1" : "order-3"
        }`}
      >
        <div className="relative">
          {isFirst && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
              <span className="material-symbols-outlined text-[22px] text-amber-500">
                crown
              </span>
            </div>
          )}

          <div
            className={`rounded-full p-1 ${
              isFirst
                ? "bg-amber-100"
                : "bg-slate-100"
            }`}
          >
            {renderAvatar(
              entry,
              isFirst
                ? "h-20 w-20"
                : "h-16 w-16"
            )}
          </div>

          <div
            className={`absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full font-bold ${
              isFirst
                ? "h-7 w-7 bg-amber-500 text-white"
                : "h-6 w-6 bg-slate-600 text-white"
            }`}
          >
            {rank}
          </div>
        </div>

        <p className="mt-3 max-w-[110px] truncate text-center text-sm font-bold text-[#131b2e]">
          {name}
        </p>

        <p className="mt-0.5 max-w-[110px] truncate text-center text-xs text-slate-500">
          {area}
        </p>

        <div className="mt-2 text-center">
          <p className="text-sm font-bold text-[#005bb3]">
            {visits} Pandals
          </p>

          <p className="text-[11px] text-slate-500">
            {points.toLocaleString()} points
          </p>
        </div>
      </div>
    );
  };

  return (
    <main className="mx-auto w-full max-w-3xl bg-[#f5f7f3] px-3 py-4 pb-24 sm:px-6 sm:py-5 sm:pb-8">
      <div className="flex w-full flex-col gap-4 sm:gap-5">

        {/* Header */}
        <ScoreHeader
          totalPoints={scorecard?.totalPoints || 0}
          visitedCount={visitedCount}
          onBack={onBack}
        />

        {/* Your Stats */}
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={displayName}
                className="h-16 w-16 shrink-0 rounded-full border-4 border-blue-50 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e8f2ec] text-lg font-bold text-[#2d6a58]">
                {getInitials(displayName)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold text-[#131b2e]">
                  {displayName}
                </h2>

                <span className="shrink-0 rounded-full bg-[#e8f2ec] px-2 py-0.5 text-[10px] font-bold text-[#2d6a58]">
                  You
                </span>
              </div>

              <p className="mt-0.5 text-sm text-slate-500">
                Your Pujo journey
              </p>
            </div>
          </div>

          {/* Personal stats */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-slate-50 py-4">
            <div className="px-2 text-center">
              <p className="text-xl font-extrabold text-[#131b2e]">
                {visitedCount}
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Pandals
              </p>
            </div>

            <div className="px-2 text-center">
              <p className="text-xl font-extrabold text-[#131b2e]">
                {distanceCovered.toFixed(1)}
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Kilometers
              </p>
            </div>

            <div className="px-2 text-center">
              <p className="text-xl font-extrabold text-[#131b2e]">
                {steps > 0
                  ? steps.toLocaleString()
                  : "—"}
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Steps
              </p>
            </div>
          </div>
        </section>

        {/* Pujo Explorers */}
        <section className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5">
            <div>
              <h2 className="text-lg font-extrabold text-[#131b2e]">
                Pujo Explorers
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Updated just now
            </div>
          </div>

          {sortedLeaderboard.length > 0 ? (
            <>
              {/* Top 3 podium */}
              <div className="px-4 pb-7 pt-4">
                <div className="flex items-end justify-center gap-2 sm:gap-6">
                  {renderPodiumUser(topThree[1], 2)}
                  {renderPodiumUser(topThree[0], 1)}
                  {renderPodiumUser(topThree[2], 3)}
                </div>
              </div>

              {/* Full ranking list */}
              <div className="border-t border-slate-100">
                <div className="px-5 py-4">
                  <h3 className="text-sm font-extrabold text-[#131b2e]">
                    Scorecard
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    All explorers ranked by Pujo points
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {sortedLeaderboard.map((entry, index) => {
                    const rank = index + 1;

                    const name = getUserName(entry);

                    const visits = Number(
                      entry?.visits || 0
                    );

                    const points = Number(
                      entry?.totalPoints || 0
                    );

                    const area =
                      entry?.area ||
                      entry?.location ||
                      "Kolkata";

                    const currentUser = isCurrentUser(entry);

                    return (
                      <div
                        key={
                          entry?.userId ||
                          entry?.id ||
                          `${name}-${rank}`
                        }
                        className={`flex items-center gap-3 px-5 py-4 ${
                          currentUser
                            ? "bg-blue-50/60"
                            : ""
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex w-7 shrink-0 justify-center">
                          {rank <= 3 ? (
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                                rank === 1
                                  ? "bg-amber-100 text-amber-700"
                                  : rank === 2
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-orange-100 text-orange-700"
                              }`}
                            >
                              {rank}
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-500">
                              {rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        {renderAvatar(entry)}

                        {/* User info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-[#131b2e]">
                              {name}
                            </p>

                            {currentUser && (
                              <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-[#005bb3]">
                                You
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {area}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-[#131b2e]">
                            {points.toLocaleString()} pts
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {visits} {visits === 1 ? "Pandal" : "Pandals"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="px-5 py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                emoji_events
              </span>

              <p className="mt-2 text-sm font-medium text-slate-500">
                The Scorecard is waiting for its first pilgrims.
              </p>
            </div>
          )}
        </section>

        {/* Crowd Pulse */}
        <CrowdReporterCard
          pandals={pandals}
        />

      </div>
    </main>
  );
};

export default ScorecardPage;