import {
  useUser,
  useClerk,
  SignInButton,
  SignUpButton,
} from "@clerk/react";

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

  /* =====================================================
     GUEST STATE
     ===================================================== */

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-heading)] pb-24">
        <div className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-lg items-center justify-center px-5 py-10">
          <div className="w-full">

            {/* Guest hero */}
            <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm">

              {/* Decorative top section */}
              <div className="relative h-28 overflow-hidden bg-[var(--color-primary)]">
                <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-[var(--color-marigold)]/20" />
                <div className="absolute -left-10 bottom-[-55px] h-32 w-32 rounded-full bg-white/10" />

                <div className="absolute left-5 top-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-white">
                    temple_hindu
                  </span>

                  <span className="text-sm font-semibold tracking-wide text-white">
                    Baahon
                  </span>
                </div>
              </div>

              {/* Avatar */}
              <div className="relative flex justify-center">
                <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[var(--color-marigold-container)] shadow-md">
                  <span className="material-symbols-outlined text-[36px] text-[var(--color-marigold-text)]">
                    person
                  </span>
                </div>
              </div>

              <div className="px-6 pb-7 pt-4 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-heading)]">
                  Your Puja Journey
                </h1>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                  Sign in to save your pandal visits, collect Pujo Points,
                  unlock achievements, and keep your Baahon journey with you.
                </p>

                {/* Authentication */}
                <div className="mt-6 flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-heading-secondary)] active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        login
                      </span>

                      Sign In
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-5 text-sm font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary-container-light)] active:scale-[0.99]"
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        person_add
                      </span>

                      Create Account
                    </button>
                  </SignUpButton>
                </div>

                {/* Privacy note */}
                <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[var(--color-muted-light)]">
                  <span className="material-symbols-outlined text-[15px]">
                    lock
                  </span>

                  <span>Your Puja journey stays connected to your account.</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     USER DATA
     ===================================================== */

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

  const bonediBariVisited = visits.filter(
    (visit) => visit.category === "traditional"
  ).length;

  const themePandalsVisited = visits.filter(
    (visit) =>
      visit.category === "theme" ||
      visit.category === "community"
  ).length;

  const totalPandals = Array.isArray(pandals)
    ? pandals.length
    : 0;

  const visitedCount = visits.length;

  const routeSummary = getScorecardRouteSummary({
    routeData,
    routeSegments,
    selectedPandals,
    activeRouteMode,
  });

  const achievementStats = {
    visited: visitedCount,
    progress:
      totalPandals > 0
        ? visitedCount / totalPandals
        : 0,
    hasRoute: Boolean(routeSummary),
    hasMetroRoute:
      routeSummary?.mode === "metro",
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-heading)] pb-24">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="border-b border-slate-200/70 bg-[var(--color-background)] shadow-sm">
        <div className="h-16 px-4 sm:px-6 max-w-7xl mx-auto flex items-center">
          <div className="flex items-center gap-3 min-w-fit">
            {/* Same logo sizing and position as Explore */}
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src="/Baahon.jpeg"
                alt="Baahon"
                className="w-10 h-10 object-contain"
              />
            </div>

            <div className="flex flex-col leading-none">
              {/* Brand */}
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

              {/* Page */}
              <span className="mt-1 text-[11px] font-extrabold tracking-[0.08em] text-[var(--color-heading)]">
                PROFILE
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">

        {/* =================================================
            PROFILE SUMMARY
            ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm">
          <div className="flex items-center gap-4 px-5 py-5 sm:px-6 sm:py-6">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10">
                {user.imageUrl ? (
                  <img
                    src={user.imageUrl}
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

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
                Pujo Explorer
              </p>

              <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight text-white">
                {displayName}
              </h2>

              <p className="mt-0.5 truncate text-xs text-white/65">
                {email}
              </p>
            </div>
          </div>

        </section>

        {/* =================================================
            DARSHAN HIGHLIGHTS
            ================================================= */}

        <section className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--color-heading)]">
                Darshan Highlights
              </h3>

              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Your Pujo journey so far
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)]">
              <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)]">
                temple_hindu
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Total Pandals */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-container-light)]">
                <span className="material-symbols-outlined text-[19px] text-[var(--color-primary)]">
                  temple_hindu
                </span>
              </div>

              <p className="mt-4 text-2xl font-extrabold text-[var(--color-heading)]">
                {visitedCount}
              </p>

              <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                Pandals Visited
              </p>
            </div>

            {/* Total Points */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-marigold-container)]">
                <span className="material-symbols-outlined text-[19px] text-[var(--color-marigold-text)]">
                  emoji_events
                </span>
              </div>

              <p className="mt-4 text-2xl font-extrabold text-[var(--color-heading)]">
                {totalPoints}
              </p>

              <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                Pujo Points
              </p>
            </div>

            {/* Bonedi Bari */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-container-light)]">
                <span className="material-symbols-outlined text-[19px] text-[var(--color-primary)]">
                  account_balance
                </span>
              </div>

              <p className="mt-4 text-2xl font-extrabold text-[var(--color-heading)]">
                {bonediBariVisited}
              </p>

              <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                Bonedi Bari
              </p>
            </div>

            {/* Theme Pandals */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-marigold-container)]">
                <span className="material-symbols-outlined text-[19px] text-[var(--color-marigold-text)]">
                  palette
                </span>
              </div>

              <p className="mt-4 text-2xl font-extrabold text-[var(--color-heading)]">
                {themePandalsVisited}
              </p>

              <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">
                Theme Pandals
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            ACHIEVEMENTS
            ================================================= */}

        <ProfileSectionHeader
          icon="emoji_events"
          title="Achievements"
          subtitle="Milestones from your journey"
        />

        <section className="mt-3">
          <Achievements
            achievementStats={achievementStats}
          />
        </section>

        {/* =================================================
            VISIT HISTORY
            ================================================= */}

        <ProfileSectionHeader
          icon="history"
          title="Visit History"
          subtitle="Pandals you've checked in to"
        />

        <section className="mt-3">
          <VisitHistory
            visits={visits}
          />
        </section>

        {/* =================================================
            ACCOUNT
            ================================================= */}

        <ProfileSectionHeader
          icon="manage_accounts"
          title="Account"
          subtitle="Your Baahon account details"
        />

        <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">

          <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)]">
              <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)]">
                person
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-light)]">
                Name
              </p>

              <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-heading)]">
                {displayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)]">
              <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)]">
                mail
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted-light)]">
                Email
              </p>

              <p className="mt-0.5 break-all text-sm font-semibold text-[var(--color-heading)]">
                {email}
              </p>
            </div>
          </div>

        </section>

        {/* =================================================
            SIGN OUT
            ================================================= */}

        <section className="mt-5">
          <button
            type="button"
            onClick={() => signOut()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[19px]">
              logout
            </span>

            Sign Out
          </button>
        </section>

        <p className="mt-4 text-center text-[11px] text-[var(--color-muted-light)]">
          Baahon • মা আসছেন
        </p>

      </main>
    </div>
  );
};


/* =====================================================
   SECTION HEADER
   ===================================================== */

const ProfileSectionHeader = ({
  icon,
  title,
  subtitle,
}) => {
  return (
    <div className="mt-7 flex items-center gap-3 px-1">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)] text-[var(--color-primary)]">
        <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">
          {icon}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-bold text-[var(--color-heading)]">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          {subtitle}
        </p>
      </div>

    </div>
  );
};

export default ProfilePage;