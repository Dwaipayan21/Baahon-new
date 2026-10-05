import { useEffect, useState } from "react";
import { getPandals, getPandalCrowd } from "../services/api";

export const usePandalData = (onInitialPandalSelect) => {
  const [pandals, setPandals] = useState([]);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPandalsWithCrowd = async () => {
      try {
        const data = await getPandals();

        if (!isMounted) {
          return;
        }

        const pandalsWithCrowd = await Promise.all(
          data.map(async (pandal) => {
            try {
              const crowd = await getPandalCrowd(pandal.id);

              return {
                ...pandal,
                crowdStatus: crowd?.status || "UNKNOWN",
                crowdScore: crowd?.score ?? null,
                crowdSampleCount: crowd?.sampleCount ?? 0,
                crowdObservedAt: crowd?.observedAt ?? null,
              };
            } catch (error) {
              console.error(
                `Failed to load crowd for ${pandal.name}:`,
                error
              );

              return {
                ...pandal,
                crowdStatus: "UNKNOWN",
                crowdScore: null,
                crowdSampleCount: 0,
                crowdObservedAt: null,
              };
            }
          })
        );

        if (!isMounted) {
          return;
        }

        setPandals(pandalsWithCrowd);

        if (pandalsWithCrowd.length > 0) {
          onInitialPandalSelect(pandalsWithCrowd[0]);
        }
      } catch (err) {
        console.error("Backend fetch error:", err);
      } finally {
        if (isMounted) {
          setAppReady(true);
        }
      }
    };

    loadPandalsWithCrowd();

    return () => {
      isMounted = false;
    };
  }, [onInitialPandalSelect]);

  return {
    pandals,
    appReady,
  };
};