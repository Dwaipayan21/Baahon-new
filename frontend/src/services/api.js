import { PANDAL_FALLBACK_IMAGES } from "../data/constants";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const crowdLevels = [
  { label: "Low Rush • ~5m queue", type: "low", color: "emerald" },
  { label: "Moderate Crowd • ~15m queue", type: "moderate", color: "amber" },
  { label: "High Rush • ~45m queue", type: "high", color: "rose" },
];

export const normalizePandal = (pandal, index = 0) => {
  const coords = pandal.location?.coordinates || [];
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);

  const defaultCrowd = crowdLevels[index % crowdLevels.length];

  return {
    ...pandal,
    id: pandal._id || pandal.id || `pandal-${index}`,
    name: pandal.name || "Durga Puja Pandal",
    area: pandal.area || "Kolkata",
    address: pandal.address || "Kolkata, West Bengal",
    description: pandal.description || "Traditional Durga Puja Celebration in Kolkata.",
    category: (pandal.category || "traditional").toLowerCase(),
    metroStation: pandal.metroStation || "",
    verified: Boolean(pandal.verified),
    lat: Number.isFinite(lat) ? lat : 22.5726,
    lng: Number.isFinite(lng) ? lng : 88.3639,
    image: pandal.image || PANDAL_FALLBACK_IMAGES[index % PANDAL_FALLBACK_IMAGES.length],
    rating: (4.6 + (index % 4) * 0.1).toFixed(1),
    crowdLabel: defaultCrowd.label,
    crowdType: defaultCrowd.type,
    crowdColor: defaultCrowd.color,
    distanceText: `${(0.4 + (index % 8) * 0.5).toFixed(1)} km • ${(5 + (index % 8) * 4)} min`,
  };
};

export const getPandals = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/pandals`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const json = await response.json();
    const rawList = Array.isArray(json) ? json : json.data || json.pandals || [];
    return rawList.map(normalizePandal);
  } catch (err) {
    console.warn("Could not load from backend API, using fallback data if available:", err);
    throw err;
  }
};

export const getPandalById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/pandals/${id}`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const json = await response.json();
    return normalizePandal(json.data || json);
  } catch (err) {
    console.error(`Failed to fetch pandal ${id}:`, err);
    throw err;
  }
};
