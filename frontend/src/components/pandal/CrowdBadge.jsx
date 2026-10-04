
const CrowdBadge = ({
  status = "UNKNOWN",
  observedAt = null,
}) => {
  const normalizedStatus = String(status).toUpperCase();

  const config = {
    LOW: {
      label: "LOW CROWD",
      bg: "bg-emerald-50",
      text: "text-[var(--color-heading-secondary)]",
      dot: "bg-emerald-500",
    },
    MODERATE: {
      label: "MODERATE CROWD",
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    HIGH: {
      label: "HIGH CROWD",
      bg: "bg-orange-100",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    UNKNOWN: {
      label: "UNKNOWN",
      bg: "bg-slate-100",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
  };

  const crowd = config[normalizedStatus] || config.UNKNOWN;

  const getUpdatedText = () => {
    if (!observedAt) {
      return "No recent data";
    }

    const observedTime = new Date(observedAt);

    if (Number.isNaN(observedTime.getTime())) {
      return "No recent data";
    }

    const diffMs = Date.now() - observedTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return "Updated just now";
    }

    if (diffMinutes < 60) {
      return `Updated ${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `Updated ${diffHours} hr ago`;
    }

    return "Data is old";
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${crowd.bg} ${crowd.text}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${crowd.dot}`}
        />

        <span>{crowd.label}</span>
      </span>

      <span className="text-[10px] text-slate-400 whitespace-nowrap">
        {getUpdatedText()}
      </span>
    </div>
  );
};

export default CrowdBadge;

