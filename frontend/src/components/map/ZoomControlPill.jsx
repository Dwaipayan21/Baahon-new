const ZoomControlPill = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="flex flex-col bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden">
      <button
        type="button"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={onZoomIn}
        className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">
          add
        </span>
      </button>

      <div className="h-[1px] w-6 mx-auto bg-slate-200"></div>

      <button
        type="button"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={onZoomOut}
        className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">
          remove
        </span>
      </button>
    </div>
  );
};

export default ZoomControlPill;
