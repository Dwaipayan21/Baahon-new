const SvgPandalMarker = ({
  pandal,
  isSelected,
  x,
  y,
  onSelect,
}) => {
  return (
    <g
      className="cursor-pointer group select-none transition-transform duration-200"
      onClick={() => onSelect(pandal)}
    >
      {/* Pulse animation ring if selected */}
      {isSelected && (
        <g>
          <circle cx={x} cy={y} r="22" fill="#005bb3" opacity="0.25" className="animate-ping" />
          <circle cx={x} cy={y} r="14" fill="#005bb3" opacity="0.3" />
        </g>
      )}

      {/* Festive Durga Puja Pandal Pin Marker */}
      <g filter="url(#markerShadow)" transform={`translate(${x - 16}, ${y - 38})`}>
        {/* Pin Body */}
        <path
          d="M 16 1.2 C 7.8 1.2 1.2 7.8 1.2 16 C 1.2 27 16 39 16 39 C 16 39 30.8 27 30.8 16 C 30.8 7.8 24.2 1.2 16 1.2 Z"
          fill={isSelected ? "url(#festiveBlueGrad)" : "url(#festiveRedGrad)"}
          stroke="url(#festiveGoldGrad)"
          strokeWidth="1.6"
        />
        {/* Inner White/Ivory Medallion */}
        <circle cx="16" cy="15.2" r="9.8" fill="#ffffff" stroke="#fef08a" strokeWidth="0.5" />
        
        {/* 1. Sacred Kalash & Trishul Finial */}
        <path d="M 16 6.2 L 16 9.4 M 14.4 7.3 C 14.4 8.4 16 9 16 9 C 16 9 17.6 8.4 17.6 7.3" fill="none" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
        <circle cx="16" cy="9.7" r="0.9" fill="#d97706" />
        
        {/* 2. Tiered Bengali Chala / Mandap Canopy */}
        <path d="M 16 9.4 C 14 11 11.6 12.1 9.8 13.1 C 11.2 13.4 13.6 13.6 16 13.6 C 18.4 13.6 20.8 13.4 22.2 13.1 C 20.4 12.1 18 11 16 9.4 Z" fill={isSelected ? "#005bb3" : "#b91c1c"} />
        
        {/* 3. Middle Cornice */}
        <path d="M 9.2 13.8 L 22.8 13.8 C 22.8 15.1 20.8 15.7 16 15.7 C 11.2 15.7 9.2 15.1 9.2 13.8 Z" fill={isSelected ? "#003d7a" : "#8b0000"} />
        <circle cx="16" cy="14.7" r="0.6" fill="#fbbf24" />
        
        {/* 4. Mandap Columns & Sanctum */}
        <rect x="9.6" y="16.2" width="1.9" height="5.8" rx="0.4" fill={isSelected ? "#005bb3" : "#c1121f"} />
        <rect x="20.5" y="16.2" width="1.9" height="5.8" rx="0.4" fill={isSelected ? "#005bb3" : "#c1121f"} />
        <path d="M 12 22 L 12 18.1 C 12 16.5 20 16.5 20 18.1 L 20 22 Z" fill={isSelected ? "#002d62" : "#780000"} />
        
        {/* 5. Holy Diya / Sacred Flame */}
        <path d="M 16 17.5 C 15 18.8 15 19.8 16 20.6 C 17 19.8 17 18.8 16 17.5 Z" fill="#fbbf24" />
        
        {/* 6. Base Plinth */}
        <rect x="8.4" y="22" width="15.2" height="1.4" rx="0.5" fill={isSelected ? "#003d7a" : "#8b0000"} />
      </g>

      {/* Pandal Label Pill */}
      <g filter="url(#subtlePillShadow)" transform={`translate(${x}, ${y + 6})`}>
        <rect
          x="-45"
          y="0"
          width="90"
          height="16"
          rx="8"
          fill={isSelected ? "#005bb3" : "#ffffff"}
        />
        <text
          x="0"
          y="11"
          textAnchor="middle"
          fill={isSelected ? "#ffffff" : "#131b2e"}
          fontSize="7.5"
          fontWeight="700"
        >
          {pandal.name.length > 14 ? `${pandal.name.slice(0, 13)}…` : pandal.name}
        </text>
      </g>
    </g>
  );
};

export default SvgPandalMarker;
