import { useMemo } from "react";
import { normalizeSearchText } from "../utils/searchUtils";

export const usePandalSearch = ({ pandals, searchQuery, activeCategory }) => {
  const filteredPandals = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    const queryWords = query
      ? query.split(" ").filter(Boolean)
      : [];

    const results = pandals
      .filter((pandal) => {
        if (activeCategory === "metro") {
          if (!pandal.metroStation) {
            return false;
          }
        }

        if (activeCategory === "low_rush") {
          if (pandal.crowdType !== "LOW") {
            return false;
          }
        }

        if (activeCategory === "bonedi") {
          const isBonedi =
            pandal.category === "bonedi" ||
            pandal.area
              ?.toLowerCase()
              .includes("north");

          if (!isBonedi) {
            return false;
          }
        }

        if (activeCategory === "theme") {
          if (pandal.category !== "theme") {
            return false;
          }
        }

        if (activeCategory === "traditional") {
          if (pandal.category !== "traditional") {
            return false;
          }
        }

        if (queryWords.length === 0) {
          return true;
        }

        const searchableFields = [
          normalizeSearchText(pandal.name),
          normalizeSearchText(pandal.area),
          normalizeSearchText(pandal.address),
          normalizeSearchText(pandal.metroStation),
          normalizeSearchText(pandal.category),
          normalizeSearchText(pandal.crowdType),
        ];

        return queryWords.every((word) =>
          searchableFields.some((field) =>
            field.includes(word)
          )
        );
      })
      .map((pandal) => {
        if (queryWords.length === 0) {
          return {
            pandal,
            score: 0,
          };
        }

        const name = normalizeSearchText(pandal.name);
        const area = normalizeSearchText(pandal.area);
        const address = normalizeSearchText(pandal.address);
        const metroStation = normalizeSearchText(pandal.metroStation);
        const category = normalizeSearchText(pandal.category);

        let score = 0;

        for (const word of queryWords) {
          if (name === word) {
            score += 100;
          } else if (name.startsWith(word)) {
            score += 70;
          } else if (name.includes(word)) {
            score += 50;
          }

          if (area === word) {
            score += 45;
          } else if (area.startsWith(word)) {
            score += 35;
          } else if (area.includes(word)) {
            score += 25;
          }

          if (metroStation === word) {
            score += 40;
          } else if (metroStation.includes(word)) {
            score += 25;
          }

          if (address.includes(word)) {
            score += 15;
          }

          if (category.includes(word)) {
            score += 10;
          }
        }

        return {
          pandal,
          score,
        };
      })
      .sort((first, second) => second.score - first.score)
      .map(({ pandal }) => pandal);

    return results;
  }, [pandals, searchQuery, activeCategory]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    return filteredPandals.slice(0, 6);
  }, [filteredPandals, searchQuery]);

  return {
    filteredPandals,
    searchResults,
  };
};