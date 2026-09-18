import { useState } from 'react';

const Header = ({ metroActive, onToggleMetro, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#faf8ff]/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-slate-200/50">
      <div className="h-16 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Hamburger & Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            {menuOpen && (
              <div className="absolute top-12 left-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-50 flex flex-col">
                <button
                  onClick={() => { setMenuOpen(false); onNavigate?.("profile"); }}
                  className="px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005bb3] transition-colors"
                >
                  PROFILE
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onNavigate?.("scoreboard"); }}
                  className="px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#005bb3] transition-colors"
                >
                  SCOREBOARD
                </button>
              </div>
            )}
          </div>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#005bb3] to-[#257ce6] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,91,179,0.25)]">
            <span className="material-symbols-outlined text-[20px]">
              temple_hindu
            </span>
          </div>

          <div className="flex flex-col justify-center">
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

        {/* Right Actions: User Avatar */}
        <div className="flex items-center gap-2.5">

          <button
            type="button"
            aria-label="Account Profile"
            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:ring-2 hover:ring-[#005bb3]/30 transition-all overflow-hidden"
          >
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
