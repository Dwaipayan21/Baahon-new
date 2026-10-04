import { useMemo } from "react";

const getDistanceInMeters = (
  lat1,
  lng1,
  lat2,
  lng2
) => {
  const earthRadius = 6371000;

  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};

const formatDistance = (distance) => {
  if (!Number.isFinite(distance)) {
    return "Distance unavailable";
  }

  if (distance < 1000) {
    return `${Math.round(distance)} m away`;
  }

  return `${(distance / 1000).toFixed(1)} km away`;
};

const FoodPlaceCard = ({
  foodPlace,
  userLocation,
  onClose,
}) => {
  const distanceFromUser = useMemo(() => {
    if (
      !foodPlace ||
      !userLocation ||
      !Number.isFinite(Number(foodPlace.latitude)) ||
      !Number.isFinite(Number(foodPlace.longitude))
    ) {
      return null;
    }

    return getDistanceInMeters(
      userLocation.lat,
      userLocation.lng,
      Number(foodPlace.latitude),
      Number(foodPlace.longitude)
    );
  }, [foodPlace, userLocation]);

  if (!foodPlace) {
    return null;
  }

  const handleGoogleSearch = () => {
    const query = [
      foodPlace.name,
      foodPlace.address,
      "Kolkata",
    ]
      .filter(Boolean)
      .join(" ");

    const url =
      `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="absolute bottom-24 left-1/2 z-[900] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 sm:bottom-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.16)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <span className="material-symbols-outlined text-[20px]">
              restaurant
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-[var(--color-heading)]">
              {foodPlace.name}
            </h3>

            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {formatDistance(distanceFromUser)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close food place"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              close
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogleSearch}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-xs font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-heading-secondary)]"
        >
          <span className="material-symbols-outlined text-[17px]">
            search
          </span>

          <span>Search on Google</span>
        </button>
      </div>
    </div>
  );
};

export default FoodPlaceCard;