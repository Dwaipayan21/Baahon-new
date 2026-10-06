const ToiletIcon = () => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="5" r="2" fill="currentColor" />
    <path
      d="M6 8h4v5H9v7H7v-5H5v-4h1V8Z"
      fill="currentColor"
    />
    <circle cx="16" cy="5" r="2" fill="currentColor" />
    <path
      d="M14.5 8h3L20 14h-2l-1 6h-2l-1-6h-2l2.5-6Z"
      fill="currentColor"
    />
  </svg>
);

const MedicineIcon = () => (
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3Z"
      fill="currentColor"
    />
  </svg>
);

const MapLayerToggleButton = ({
  type,
  active = false,
  onClick,
}) => {
  const isToilet = type === "toilet";
  const label = isToilet
    ? "Public Toilets"
    : "Medicine Stores";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Toggle ${label.toLowerCase()}`}
      aria-pressed={active}
      title={label}
      className={`
        flex h-10 w-10 items-center justify-center
        rounded-xl border
        transition-all duration-200
        shadow-sm
        ${
          active
            ? "border-blue-500 bg-blue-50 text-blue-600 shadow-md"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }
      `}
    >
      {isToilet ? <ToiletIcon /> : <MedicineIcon />}
    </button>
  );
};

export default MapLayerToggleButton;
