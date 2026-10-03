import { getFoodForPandal } from "./api";

export const getFoodPlacesForPandal = async (pandalId) => {
  if (!pandalId) {
    return [];
  }

  const places = await getFoodForPandal(pandalId);

  return Array.isArray(places) ? places : [];
};