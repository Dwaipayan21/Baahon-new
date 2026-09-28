const SvgMetroTransitOverlay = () => {
  return (
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
      {/* Orange Line (Kavi Subhash - Airport) */}
      <path
        d="M 160 770 L 180 700 L 200 600 L 220 500 L 260 400 L 290 300 L 350 150"
        fill="none"
        stroke="#f97316"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 160 770 L 180 700 L 200 600 L 220 500 L 260 400 L 290 300 L 350 150"
        fill="none"
        stroke="#fdba74"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yellow Line (Noapara - Barasat) */}
      <path
        d="M 182 100 L 250 100 L 350 150 L 400 50"
        fill="none"
        stroke="#eab308"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 182 100 L 250 100 L 350 150 L 400 50"
        fill="none"
        stroke="#fde047"
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
  );
};

export default SvgMetroTransitOverlay;
