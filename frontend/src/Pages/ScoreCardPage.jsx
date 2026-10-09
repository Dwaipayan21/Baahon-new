import CrowdReporterCard from "../components/UI/Scorecard/CrowdReporterCard";

const ScorecardPage = ({
  user = null,
  scorecard = null,
  pandals = [],
  leaderboard = [],
}) => {
  const visits = Array.isArray(scorecard?.visits)
    ? scorecard.visits
    : [];

  /*
   * Personal stats
   */
  const visitedCount = visits.length;

  const distanceCovered = Number(
    scorecard?.distanceCovered || 0
  );

  const steps = Number(
    scorecard?.steps || 0
  );

  const totalPoints = Number(
    scorecard?.totalPoints || 0
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
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
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
        className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-container)] font-bold text-[var(--color-primary)]`}
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

    const isFirst = rank === 1;

    return (
      <div
        className={`flex min-w-0 flex-1 flex-col items-center ${
          isFirst
            ? "order-2"
            : rank === 2
              ? "order-1"
              : "order-3"
        }`}
      >
        <div className="relative">

          {isFirst && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2">
              <span className="material-symbols-outlined text-[22px] text-[var(--color-marigold)]">
                crown
              </span>
            </div>
          )}

          <div
            className={`rounded-full p-1 ${
              isFirst
                ? "bg-[var(--color-marigold-container)]"
                : "bg-[var(--color-primary-container-light)]"
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
                ? "h-7 w-7 bg-[var(--color-marigold-container)] text-[var(--color-marigold-text)]"
                : rank === 2
                  ? "h-6 w-6 bg-[var(--color-primary-container-light)] text-[var(--color-primary)]"
                  : "h-6 w-6 border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-heading-secondary)]"
            }`}
          >
            {rank}
          </div>
        </div>

        <p className="mt-3 max-w-[110px] truncate text-center text-sm font-bold text-[var(--color-heading)]">
          {name}
        </p>

        <p className="mt-0.5 max-w-[110px] truncate text-center text-xs text-[var(--color-muted)]">
          {area}
        </p>

        <div className="mt-2 text-center">
          <p className="text-sm font-bold text-[var(--color-primary)]">
            {visits} Pandals
          </p>

          <p className="text-[11px] text-[var(--color-muted)]">
            {points.toLocaleString()} points
          </p>
        </div>
      </div>
    );
  };

  return (
    
    <main className="min-h-screen bg-[var(--color-background)] pb-24 sm:pb-8">
      {/* Full-width navbar */}
      <header className="w-full border-b border-slate-200/70 bg-[var(--color-background)] shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6">
          <div className="flex min-w-fit items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <img
                src="/Baahon.jpeg"
                alt="Baahon"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium tracking-tight text-[var(--color-heading)]">
                  BAAHON
                </span>
                <span className="text-[13px] font-medium text-[var(--color-muted)]">
                  ·
                </span>
                <span className="text-[11px] font-medium text-[var(--color-primary)]">
                  মা আসছেন
                </span>
              </div>

              <span className="mt-1 text-[11px] font-extrabold tracking-[0.08em] text-[var(--color-heading)]">
                SCORE BOARD
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Keep the rest of the page content centered */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 pt-4 sm:gap-6 sm:px-6 sm:pt-6">

        {/* =====================================================
            SCORECARD
        ====================================================== */}
        <section className="overflow-hidden rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm">

          <div className="px-5 py-6 sm:px-6 sm:py-7">

            {/* User profile */}
            <div className="flex items-center gap-4">

              <div className="relative shrink-0">

                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10">

                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[28px] text-white">
                      person
                    </span>
                  )}

                </div>

                <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-success)]">
                  <span className="material-symbols-outlined text-[11px] text-white">
                    check
                  </span>
                </div>

              </div>

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <h2 className="truncate text-lg font-bold text-white">
                    {displayName}
                  </h2>

                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                    You
                  </span>

                </div>

                <p className="mt-0.5 text-sm text-white/65">
                  Your Pujo journey
                </p>

              </div>
            </div>

            {/* Personal stats */}
            <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--color-border)] rounded-2xl bg-[var(--color-primary-container-light)] py-4">

              {/* Pandals */}
              <div className="px-2 text-center">
                <p className="text-xl font-extrabold text-[var(--color-heading)]">
                  {visitedCount}
                </p>

                <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)]">
                  Pandals
                </p>
              </div>

              {/* Distance */}
              <div className="px-2 text-center">
                <p className="text-xl font-extrabold text-[var(--color-heading)]">
                  {distanceCovered.toFixed(1)}
                </p>

                <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)]">
                  Kilometers
                </p>
              </div>

              {/* Steps */}
              <div className="px-2 text-center">
                <p className="text-xl font-extrabold text-[var(--color-heading)]">
                  {steps > 0
                    ? steps.toLocaleString()
                    : "—"}
                </p>

                <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)]">
                  Steps
                </p>
              </div>

            </div>

            {/* Total score */}
            <div className="mt-3 rounded-2xl bg-white px-5 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                    Total Score
                  </p>

                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-[var(--color-heading)]">
                    {totalPoints.toLocaleString()}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-marigold-container)]">
                  <span className="material-symbols-outlined text-[22px] text-[var(--color-marigold-text)]">
                    emoji_events
                  </span>
                </div>

              </div>

              <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                Pujo Points
              </p>

            </div>

          </div>
        </section>

        {/* =====================================================
            PUJO EXPLORERS
        ====================================================== */}
        <section className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-5">

            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-heading)]">
                Pujo Explorers
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
              Updated just now
            </div>

          </div>

          {sortedLeaderboard.length > 0 ? (
            <>
              {/* Top 3 podium */}
              <div className="px-4 pb-7 pt-4">
                <div className="flex items-end justify-center gap-2 sm:gap-6">

                  {renderPodiumUser(
                    topThree[1],
                    2
                  )}

                  {renderPodiumUser(
                    topThree[0],
                    1
                  )}

                  {renderPodiumUser(
                    topThree[2],
                    3
                  )}

                </div>
              </div>

              {/* Full ranking list */}
              <div className="border-t border-[var(--color-border)]">

                <div className="px-5 py-4">

                  <h3 className="text-sm font-extrabold text-[var(--color-heading)]">
                    Scorecard
                  </h3>

                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    All explorers ranked by Pujo points
                  </p>

                </div>

                <div className="divide-y divide-[var(--color-border)]">

                  {sortedLeaderboard.map(
                    (entry, index) => {
                      const rank = index + 1;

                      const name =
                        getUserName(entry);

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

                      const currentUser =
                        isCurrentUser(entry);

                      return (
                        <div
                          key={
                            entry?.userId ||
                            entry?.id ||
                            `${name}-${rank}`
                          }
                          className={`flex items-center gap-3 px-5 py-4 ${
                            currentUser
                              ? "bg-[var(--color-primary-container-light)]/60"
                              : ""
                          }`}
                        >

                          {/* Rank */}
                          <div className="flex w-7 shrink-0 justify-center">

                            {rank <= 3 ? (
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                                  rank === 1
                                    ? "bg-[var(--color-marigold-container)] text-[var(--color-marigold-text)]"
                                    : rank === 2
                                      ? "bg-[var(--color-primary-container-light)] text-[var(--color-primary)]"
                                      : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-heading-secondary)]"
                                }`}
                              >
                                {rank}
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-[var(--color-muted)]">
                                {rank}
                              </span>
                            )}

                          </div>

                          {/* Avatar */}
                          {renderAvatar(entry)}

                          {/* User info */}
                          <div className="min-w-0 flex-1">

                            <div className="flex items-center gap-2">

                              <p className="truncate text-sm font-bold text-[var(--color-heading)]">
                                {name}
                              </p>

                              {currentUser && (
                                <span className="shrink-0 rounded-full bg-[var(--color-primary-container)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-primary)]">
                                  You
                                </span>
                              )}

                            </div>

                            <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                              {area}
                            </p>

                          </div>

                          {/* Stats */}
                          <div className="shrink-0 text-right">

                            <p className="text-sm font-bold text-[var(--color-heading)]">
                              {points.toLocaleString()} pts
                            </p>

                            <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                              {visits}{" "}
                              {visits === 1
                                ? "Pandal"
                                : "Pandals"}
                            </p>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="px-5 py-10 text-center">

              <span className="material-symbols-outlined text-4xl text-[var(--color-muted)]">
                emoji_events
              </span>

              <p className="mt-2 text-sm font-medium text-[var(--color-muted)]">
                The Scorecard is waiting for its first pilgrims.
              </p>

            </div>
          )}

        </section>

        {/* =====================================================
            CROWD PULSE
        ====================================================== */}
        <CrowdReporterCard
          pandals={pandals}
        />

      </div>
    </main>
  );
};

export default ScorecardPage;