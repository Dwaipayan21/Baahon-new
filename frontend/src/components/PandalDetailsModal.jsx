const PandalDetailsModal = ({ pandal, onClose }) => {
  if (!pandal) return null;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pandal.lat},${pandal.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-scale-up">
        {/* Modal Hero Image */}
        <div className="relative w-full h-52 sm:h-60 bg-slate-900">
          <img
            alt={pandal.name}
            className="w-full h-full object-cover"
            src={pandal.image}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md">
              ★ {pandal.rating} / 5.0
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#005bb3] text-white uppercase tracking-wider">
              {pandal.category}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#131b2e]">{pandal.name}</h2>
              {pandal.verified && (
                <span
                  className="material-symbols-outlined text-amber-500 text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Verified Pandal"
                >
                  verified
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {pandal.area} • Kolkata, West Bengal
            </p>
          </div>

          {/* Crowd Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-bold text-amber-900">Live Status:</span>
              <span className="text-amber-800 font-medium">{pandal.crowdLabel}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              About This Pandal
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              {pandal.description ||
                "A grand Durga Puja celebration attracting devotees from across the city with spectacular theme artwork, traditional idol craft, and cultural heritage."}
            </p>
          </div>

          {/* Location & Transit Details */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Location & Transit
            </h3>

            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5">
                pin_drop
              </span>
              <span>{pandal.address}</span>
            </div>

            {pandal.metroStation && (
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <span className="material-symbols-outlined text-[#005bb3] text-[18px]">
                  directions_subway
                </span>
                <span>
                  Nearest Metro Station: <strong>{pandal.metroStation}</strong>
                </span>
              </div>
            )}

            {pandal.source && (
              <div className="text-[11px] text-slate-400 mt-1">
                Source: {pandal.source}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="flex-1 h-12 rounded-full bg-[#005bb3] hover:bg-[#1173dd] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(0,91,179,0.25)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
            <span>Open in Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PandalDetailsModal;
