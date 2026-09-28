import SvgMetroTransitOverlay from "./SvgMetroTransitOverlay";
import SvgPandalMarker from "./SvgPandalMarker";

const KolkataSvgMap = ({
  pandals = [],
  selectedPandal,
  onSelectPandal,
  metroActive = true,
  zoom = 1,
}) => {
  // SVG coordinates bounds for Kolkata region:
  // Approximate mapping: lat [22.46 .. 22.65] -> y [750 .. 20]
  //                      lng [88.30 .. 88.44] -> x [30 .. 400]
  const mapCoordsToSvg = (lat, lng) => {
    const minLat = 22.46;
    const maxLat = 22.66;
    const minLng = 88.31;
    const maxLng = 88.44;

    const x = ((lng - minLng) / (maxLng - minLng)) * 360 + 30;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 720 + 30;

    return {
      x: Math.max(25, Math.min(395, x)),
      y: Math.max(30, Math.min(750, y)),
    };
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#edf1f2] flex items-center justify-center">
      <svg
        id="kolkataMapCanvas"
        viewBox="0 0 420 780"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full object-cover transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <defs>
          <linearGradient id="riverGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#b6dfee" />
            <stop offset="60%" stopColor="#cae8f2" />
            <stop offset="100%" stopColor="#bcdde8" />
          </linearGradient>
          <filter id="markerShadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#580808" floodOpacity="0.32" />
          </filter>
          <filter id="subtlePillShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.12" />
          </filter>
          <linearGradient id="festiveRedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e62e2e" />
            <stop offset="60%" stopColor="#c1121f" />
            <stop offset="100%" stopColor="#8b0000" />
          </linearGradient>
          <linearGradient id="festiveGoldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="festiveBlueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#005bb3" />
            <stop offset="100%" stopColor="#002d62" />
          </linearGradient>
        </defs>

        {/* Base Landmass Background */}
        <rect width="100%" height="100%" fill="#f4f3ef" />

        {/* Urban Neighborhood Blocks */}
        <rect x="290" y="160" width="120" height="230" rx="6" fill="#edece5" />
        <rect x="300" y="180" width="40" height="35" rx="3" fill="#e7e6df" />
        <rect x="348" y="180" width="55" height="35" rx="3" fill="#e7e6df" />
        <rect x="300" y="225" width="40" height="40" rx="3" fill="#e7e6df" />
        <rect x="348" y="225" width="55" height="40" rx="3" fill="#e7e6df" />
        <rect x="300" y="275" width="102" height="45" rx="3" fill="#e7e6df" />

        {/* Parks & Water Bodies */}
        {/* Maidan */}
        <path
          d="M 128 320 C 132 300, 140 310, 155 330 C 160 355, 158 410, 148 440 C 136 430, 126 395, 128 350 Z"
          fill="#d7ead4"
          opacity="0.95"
        />
        {/* Rabindra Sarobar */}
        <ellipse cx="205" cy="625" rx="38" ry="16" fill="#d2e7cf" />
        <path d="M 180 626 C 190 623, 215 623, 230 627 C 220 630, 195 629, 180 626 Z" fill="#bcdce8" />
        {/* Subhas Sarobar */}
        <ellipse cx="328" cy="290" rx="18" ry="10" fill="#cbe3f0" />

        {/* Hooghly River */}
        <path
          d="M 98 0 C 95 60, 105 120, 85 190 C 70 240, 52 280, 54 360 C 56 430, 78 490, 68 560 C 58 630, 36 710, 42 780 L 0 780 L 0 0 Z"
          fill="url(#riverGradient)"
        />
        <path
          d="M 98 0 C 95 60, 105 120, 85 190 C 70 240, 52 280, 54 360 C 56 430, 78 490, 68 560 C 58 630, 36 710, 42 780"
          fill="none"
          stroke="#a3d3e3"
          strokeWidth="2"
        />

        {/* Arterial Road Grid */}
        <g stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <path d="M 85 120 L 220 120 L 290 140" />
          <path d="M 120 70 L 240 70" />
          <path d="M 80 250 L 320 250" />
          <path d="M 140 280 L 390 280" />
          <path d="M 140 370 L 380 370" />
          <path d="M 80 500 L 390 500" />
          <path d="M 120 540 L 380 540" />
          <path d="M 110 650 L 370 650" />
          <path d="M 230 450 L 230 720" />
          <path d="M 285 400 L 285 700" />
        </g>

        {/* Major Corridors */}
        {/* Central Avenue */}
        <path d="M 175 60 L 175 220 L 170 340" fill="none" stroke="#fcfaf2" strokeWidth="5" />
        <path d="M 175 60 L 175 220 L 170 340" fill="none" stroke="#e0dacb" strokeWidth="1.2" />

        {/* Rashbehari Avenue */}
        <path d="M 75 580 L 400 580" fill="none" stroke="#fcfaf2" strokeWidth="6" />
        <path d="M 75 580 L 400 580" fill="none" stroke="#ded6c3" strokeWidth="1.5" />

        {/* EM Bypass */}
        <path d="M 330 90 C 320 200, 360 350, 345 520 C 335 620, 310 700, 305 780" fill="none" stroke="#fcfaf2" strokeWidth="6" />
        <path d="M 330 90 C 320 200, 360 350, 345 520 C 335 620, 310 700, 305 780" fill="none" stroke="#d5ceba" strokeWidth="1.6" />

        {/* Maa Flyover */}
        <path d="M 235 440 C 270 435, 300 445, 350 470" fill="none" stroke="#ffd285" strokeWidth="4.5" strokeLinecap="round" />

        {/* Howrah Bridge */}
        <g>
          <line x1="68" y1="218" x2="108" y2="218" stroke="#505b69" strokeWidth="5.5" strokeLinecap="butt" />
          <line x1="68" y1="218" x2="108" y2="218" stroke="#ffffff" strokeWidth="2" />
          <line x1="75" y1="214" x2="75" y2="222" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="88" y1="213" x2="88" y2="223" stroke="#1e293b" strokeWidth="2" />
          <line x1="101" y1="214" x2="101" y2="222" stroke="#1e293b" strokeWidth="1.5" />
        </g>

        {/* Vidyasagar Setu */}
        <g>
          <line x1="50" y1="410" x2="118" y2="418" stroke="#475569" strokeWidth="5" strokeLinecap="butt" />
          <line x1="50" y1="410" x2="118" y2="418" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="70" cy="412" r="2.5" fill="#1e293b" />
          <circle cx="102" cy="416" r="2.5" fill="#1e293b" />
        </g>

        {/* Landmark Text Labels */}
        <text x="45" y="110" transform="rotate(-68 45 110)" fill="#699aa8" fontSize="9" fontWeight="700" letterSpacing="0.12em">
          HOOGHLY RIVER
        </text>
        <text x="70" y="210" fill="#334155" fontSize="7.5" fontWeight="600">
          Howrah Br.
        </text>
        <text x="56" y="403" fill="#334155" fontSize="7.5" fontWeight="600">
          Vidyasagar Setu
        </text>
        <text x="133" y="380" fill="#658864" fontSize="8.5" fontWeight="700" letterSpacing="0.08em">
          MAIDAN
        </text>
        <text x="320" y="215" fill="#8c9099" fontSize="8.5" fontWeight="600">
          SALT LAKE SEC-V
        </text>
        <text x="245" y="573" fill="#717784" fontSize="7.5" fontWeight="600">
          Rashbehari Ave
        </text>

        {/* METRO TRANSIT OVERLAY */}
        {metroActive && <SvgMetroTransitOverlay />}

        {/* PANDAL MARKERS */}
        {pandals.map((pandal, index) => {
          const isSelected = selectedPandal?.id === pandal.id || selectedPandal?.name === pandal.name;
          const { x, y } = mapCoordsToSvg(pandal.lat, pandal.lng);

          return (
            <SvgPandalMarker
              key={pandal.id || index}
              pandal={pandal}
              isSelected={isSelected}
              x={x}
              y={y}
              onSelect={onSelectPandal}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default KolkataSvgMap;
