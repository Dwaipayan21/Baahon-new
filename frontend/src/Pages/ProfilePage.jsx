import {
  useUser,
  useClerk,
  SignInButton,
  SignUpButton,
} from "@clerk/react";

import JourneyProgress from "../components/UI/Scorecard/JourneyProgress";
import ScoreStats from "../components/UI/Scorecard/ScoreStats";
import RouteActivity from "../components/UI/Scorecard/RouteActivity";
import Achievements from "../components/UI/Scorecard/Achievements";
import VisitHistory from "../components/UI/Scorecard/VisitHistory";

import { getScorecardRouteSummary } from "../utils/scorecardRouteMetrics";

const ProfilePage = ({
  scorecard = null,
  pandals = [],
  routeData = null,
  routeSegments = [],
  selectedPandals = [],
  activeRouteMode = null,
}) => {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
        <div className="flex min-h-[70vh] flex-col items-center justify-center">
          
          {/* Guest avatar */}
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[#dce9df] bg-[#edf5ee]">
            <span className="material-symbols-outlined text-[38px] text-[#2d6a58]">
              person
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-xl font-bold text-[#20332d]">
            Your Profile
          </h1>

          <p className="mt-2 max-w-xs text-center text-sm leading-5 text-[#78867e]">
            Sign in to save your Pujo journey, track your visits, and keep your
            profile with you.
          </p>

          {/* Clerk authentication */}
          <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
            <SignInButton mode="modal">
              <button
                type="button"
                className="h-11 w-full rounded-xl bg-[#005bb3] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004b93]"
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="h-11 w-full rounded-xl border border-[#dce9df] bg-white px-5 text-sm font-semibold text-[#2d6a58] transition hover:bg-[#f4f8f5]"
              >
                Sign Up
              </button>
            </SignUpButton>
          </div>

          {/* Small guest note */}
          <div className="mt-6 flex items-center gap-2 text-[11px] text-[#8a968f]">
            <span className="material-symbols-outlined text-[16px]">
              lock
            </span>
            <span>Your account keeps your Pujo progress safe.</span>
          </div>
        </div>
      </main>
    );
  }
  const displayName =
    user.fullName ||
    user.username ||
    "Pujo Explorer";

  const email =
    user.primaryEmailAddress?.emailAddress ||
    "No email available";

  const visits = Array.isArray(scorecard?.visits)
    ? scorecard.visits
    : [];

  const totalPoints = Number(scorecard?.totalPoints) || 0;

  const totalPandals = Array.isArray(pandals)
    ? pandals.length
    : 0;

  const visitedCount = visits.length;

  const percentage =
    totalPandals > 0
      ? Math.min(
          Math.round((visitedCount / totalPandals) * 100),
          100
        )
      : 0;

  const remaining = Math.max(
    totalPandals - visitedCount,
    0
  );

  const categoryCounts = visits.reduce(
    (counts, visit) => {
      const category = String(
        visit?.category || ""
      ).toLowerCase();

      if (!category) {
        return counts;
      }

      counts[category] =
        (counts[category] || 0) + 1;

      return counts;
    },
    {}
  );

  const categoryCount =
    Object.keys(categoryCounts).length;

  const routeSummary = getScorecardRouteSummary({
    routeData,
    routeSegments,
    selectedPandals,
    activeRouteMode,
  });

  const scorecardStats = {
    visitedCount,
    totalPandals,
    percentage,
    remaining,
    categoryCount,
    totalPoints,
  };

  const achievementStats = {
    visited: visitedCount,
    categories: categoryCount,
    progress:
      totalPandals > 0
        ? visitedCount / totalPandals
        : 0,
    hasRoute: Boolean(routeSummary),
    hasMetroRoute:
      routeSummary?.mode === "metro",
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#faf8ff]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-5">
          <h1 className="text-xl font-bold">
            Profile
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-5 sm:py-6">

        {/* Profile identity */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={user.imageUrl}
              alt={displayName}
              className="h-20 w-20 shrink-0 rounded-full border-4 border-blue-50 object-cover"
            />

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">
                {displayName}
              </h2>

              <p className="mt-1 break-all text-sm text-slate-500">
                {email}
              </p>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005bb3]">
                <span className="material-symbols-outlined text-[15px]">
                  emoji_events
                </span>

                {totalPoints} Pujo Points
              </div>
            </div>
          </div>
        </section>

        {/* Personal journey */}
        <section className="mt-5">
          <JourneyProgress
            visited={visitedCount}
            total={totalPandals}
            percentage={percentage}
            remaining={remaining}
          />
        </section>

        {/* Personal statistics */}
        <section className="mt-5">
          <ScoreStats
            scorecardStats={scorecardStats}
            categoryCounts={categoryCounts}
            routeSummary={routeSummary}
          />
        </section>

        {/* Route activity */}
        <section className="mt-5">
          <RouteActivity
            routeSummary={routeSummary}
          />
        </section>

        {/* Achievements */}
        <section className="mt-5">
          <Achievements
            achievementStats={achievementStats}
          />
        </section>

        {/* Visit history */}
        <section className="mt-5">
          <VisitHistory
            visits={visits}
          />
        </section>

        {/* Account information */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-bold">
              Account information
            </h3>
          </div>

          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Name
            </p>

            <p className="mt-1 text-sm font-medium">
              {displayName}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="mt-1 break-all text-sm font-medium">
              {email}
            </p>
          </div>
        </section>

        {/* Sign out */}
        <section className="mt-5">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>

            <span>Sign Out</span>
          </button>
        </section>

      </main>
    </div>
  );
};

export default ProfilePage;