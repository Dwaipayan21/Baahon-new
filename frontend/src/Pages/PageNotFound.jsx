
import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page relative">
      <img
        src="/404.png"
        alt="Page not found"
        className="not-found-image"
      />

      <button
        type="button"
        onClick={() => navigate("/")}
        
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-6 py-3 text-sm font-bold text-black shadow-lg backdrop-blur-md transition hover:bg-white/25 active:scale-95 sm:bottom-6"

      >
        <span className="material-symbols-outlined text-xl">
          home
        </span>
        Go Home
      </button>
    </div>
  );
}
