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
        {metroActive && (
          <g className="transition-opacity duration-300">
            {/* Blue Line (North-South) */}
            <path
              d="M 188 15 L 182 100 L 175 195 L 168 310 L 158 395 L 152 485 L 150 580 L 154 690 L 160 770"
              fill="none"
              stroke="#005bb3"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 188 15 L 182 100 L 175 195 L 168 310 L 158 395 L 152 485 L 150 580 L 154 690 L 160 770"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Green Line (East-West) */}
            <path
              d="M 40 220 L 75 220 L 120 226 L 168 230 L 225 230 L 275 240 L 350 240 L 395 240"
              fill="none"
              stroke="#16a34a"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 40 220 L 75 220 L 120 226 L 168 230 L 225 230 L 275 240 L 350 240 L 395 240"
              fill="none"
              stroke="#86efac"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Tunnel across Hooghly */}
            <path d="M 70 220 L 105 223" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 3" />

            {/* Metro Stations */}
            <circle cx="182" cy="100" r="4.5" fill="#ffffff" stroke="#005bb3" strokeWidth="2.5" />
            <text x="190" y="103" fill="#003566" fontSize="7.5" fontWeight="700">Shyambazar</text>

            <circle cx="168" cy="230" r="7" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <circle cx="168" cy="230" r="3.2" fill="#005bb3" />
            <rect x="178" y="222" width="54" height="13" rx="3" fill="#ffffff" filter="url(#subtlePillShadow)" />
            <text x="181" y="231" fill="#0f172a" fontSize="7" fontWeight="700">Esplanade ⇄</text>

            <circle cx="163" cy="350" r="4.5" fill="#ffffff" stroke="#005bb3" strokeWidth="2.5" />
            <text x="172" y="353" fill="#003566" fontSize="7" fontWeight="600">Park St</text>

            <circle cx="150" cy="580" r="5" fill="#ffffff" stroke="#005bb3" strokeWidth="2.5" />
            <text x="88" y="583" fill="#003566" fontSize="7.5" fontWeight="700">Kalighat Metro</text>

            <circle cx="60" cy="220" r="4.5" fill="#ffffff" stroke="#16a34a" strokeWidth="2.5" />
            <text x="25" y="212" fill="#14532d" fontSize="7" fontWeight="700">Howrah Stn</text>

            <circle cx="225" cy="230" r="4.5" fill="#ffffff" stroke="#16a34a" strokeWidth="2.5" />
            <text x="215" y="221" fill="#14532d" fontSize="7" fontWeight="700">Sealdah</text>

            <circle cx="380" cy="240" r="4.5" fill="#ffffff" stroke="#16a34a" strokeWidth="2.5" />
            <text x="325" y="253" fill="#14532d" fontSize="7" fontWeight="600">Salt Lake Sec V</text>
          </g>
        )}

        {/* PANDAL MARKERS */}
        {pandals.map((pandal, index) => {
          const isSelected = selectedPandal?.id === pandal.id || selectedPandal?.name === pandal.name;
          const { x, y } = mapCoordsToSvg(pandal.lat, pandal.lng);

          return (
            <g
              key={pandal.id || index}
              className="cursor-pointer group select-none transition-transform duration-200"
              onClick={() => onSelectPandal(pandal)}
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
        })}
      </svg>
    </div>
  );
};

export default KolkataSvgMap;
