import {
  useUser,
  useClerk,
  SignInButton,
  SignUpButton,
} from "@clerk/react";

const ProfilePage = ({ onViewScorecard }) => {
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

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#faf8ff]/95 backdrop-blur-xl border-b border-slate-200/70">
        <div className="h-16 px-5 flex items-center">
          <h1 className="text-xl font-bold">
            Profile
          </h1>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-5 py-6">

        {/* Profile identity */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center gap-4">

            <img
              src={user.imageUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-50"
            />

            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">
                {displayName}
              </h2>

              <p className="text-sm text-slate-500 mt-1 break-all">
                {email}
              </p>
            </div>
          </div>
        </section>

        {/* Account information */}
        <section className="mt-5 bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold">
              Account information
            </h3>
          </div>

          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Name
            </p>

            <p className="mt-1 text-sm font-medium">
              {displayName}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Email
            </p>

            <p className="mt-1 text-sm font-medium break-all">
              {email}
            </p>
          </div>

        </section>

        {/* Scorecard */}
        <section className="mt-5 bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#005bb3]">
                emoji_events
              </span>
            </div>

            <div className="flex-1">
              <h3 className="font-bold">
                Your Pujo Scorecard
              </h3>

              <p className="text-sm text-slate-500 mt-0.5">
                View your Pujo journey, visits and achievements.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewScorecard}
            className="w-full mt-5 h-11 rounded-xl bg-[#005bb3] text-white font-semibold hover:bg-[#004a91] transition-colors flex items-center justify-center gap-2"
          >
            <span>View Scorecard</span>

            <span className="material-symbols-outlined text-[19px]">
              arrow_forward
            </span>
          </button>

        </section>

        {/* Sign out */}
        <section className="mt-5">
            <button
                type="button"
                onClick={() => signOut()}
                className="w-full h-11 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
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