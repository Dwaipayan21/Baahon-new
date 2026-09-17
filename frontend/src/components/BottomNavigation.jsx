const BottomNavigation = ({ activeTab = "explore", onSelectTab }) => {
  const tabs = [
    { id: "explore", label: "Explore", icon: "explore" },
    { id: "routes", label: "Routes", icon: "route" },
    { id: "checkins", label: "Check-ins", icon: "verified" },
    { id: "profile", label: "Profile", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:hidden select-none">
      <div className="flex items-center justify-around h-15 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab?.(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 gap-1 transition-colors cursor-pointer ${
                isActive ? "text-[#005bb3] font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
                style={isActive && tab.id === "checkins" ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
