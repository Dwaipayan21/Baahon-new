import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/react";

const Header = ({ onNavigate }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-[#faf8ff] border-b border-slate-200/70 shadow-sm pt-safe" style={{ zIndex: 100 }}>
      <div className="h-16 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">

        {/* Left: Logo + PujoPath */}
        <div className="flex items-center gap-3 min-w-0">

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#005bb3] to-[#257ce6] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,91,179,0.25)] flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              temple_hindu
            </span>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-lg text-[#131b2e] tracking-tight">
                PujoPath
              </span>

              <span className="text-[11px] font-bold text-[#005bb3] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Explore
              </span>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Maa Asche • Kolkata
            </span>
          </div>
        </div>

        {/* Right: Authentication */}
        <div className="flex items-center gap-2">

          {/* Logged out */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="px-3 py-2 text-sm font-semibold text-[#005bb3] hover:bg-blue-50 rounded-lg transition-all"
              >
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button
                type="button"
                className="px-3 py-2 text-sm font-semibold text-white bg-[#005bb3] hover:bg-[#004a91] rounded-lg transition-all shadow-sm"
              >
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          {/* Logged in */}
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
          </Show>

        </div>

      </div>
    </header>
  );
};

export default Header;