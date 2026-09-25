import { createPortal } from "react-dom";

const PandalDetailsModal = ({ pandal, onClose }) => {
  if (!pandal) return null;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pandal.lat},${pandal.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[20rem] sm:max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-100 max-h-[80vh] flex flex-col animate-scale-up"
      >
        {/* Hero */}
        <div className="relative w-full h-32 sm:h-40 bg-slate-800 shrink-0">
          <img
            alt={pandal.name}
            className="w-full h-full object-cover"
            src={pandal.image}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
              ★ {pandal.rating} / 5.0
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#005bb3] text-white uppercase tracking-wider">
              {pandal.category}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-[#131b2e] leading-tight">{pandal.name}</h2>
              {pandal.verified && (
                <span
                  className="material-symbols-outlined material-symbols-filled text-amber-500 text-[18px]"
                  title="Verified Pandal"
                >
                  verified
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {pandal.area} • Kolkata, West Bengal
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold text-amber-900">Live Status:</span>
            <span className="text-amber-800 font-medium">{pandal.crowdLabel}</span>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              About This Pandal
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {pandal.description ||
                "A grand Durga Puja celebration attracting devotees from across the city with spectacular theme artwork, traditional idol craft, and cultural heritage."}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Location & Transit
            </h3>

            <div className="flex items-start gap-2 text-[11px] text-slate-700">
              <span className="material-symbols-outlined text-slate-400 text-[16px] mt-0.5">pin_drop</span>
              <span>{pandal.address}</span>
            </div>

            {pandal.metroStation && (
              <div className="flex items-center gap-2 text-[11px] text-slate-700">
                <span className="material-symbols-outlined text-[#005bb3] text-[16px]">directions_subway</span>
                <span>
                  Nearest Metro Station: <strong>{pandal.metroStation}</strong>
                </span>
              </div>
            )}

            {pandal.source && (
              <div className="text-[10px] text-slate-400">Source: {pandal.source}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="flex-[1.4] h-10 rounded-full bg-[#005bb3] hover:bg-[#1173dd] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(0,91,179,0.25)] transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">near_me</span>
            <span>Open in Maps</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PandalDetailsModal;