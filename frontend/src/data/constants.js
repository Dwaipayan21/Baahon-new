export const KOLKATA_CENTER = {
  lat: 22.5726,
  lng: 88.3639,
};

export const DEFAULT_ZOOM = 13;

export const CATEGORIES = [
  { id: "all", label: "All Pandals", icon: "temple_hindu" },
  { id: "metro", label: "Metro Nearby", icon: "directions_subway" },
  { id: "low_rush", label: "Low Rush", icon: "family_restroom" },
  { id: "bonedi", label: "Bonedi Bari", icon: "history_edu" },
  { id: "theme", label: "Theme Pandals", icon: "palette" },
  { id: "traditional", label: "Traditional", icon: "flare" },
];

export const METRO_DATA = {
  blueLine: {
    name: "Blue Line (North - South)",
    color: "#005bb3",
    path: [
      { lat: 22.6534, lng: 88.3582, name: "Dakshineswar" },
      { lat: 22.6219, lng: 88.3934, name: "Dum Dum" },
      { lat: 22.601, lng: 88.371, name: "Shyambazar" },
      { lat: 22.595, lng: 88.364, name: "Shobhabazar" },
      { lat: 22.5857, lng: 88.3621, name: "Girish Park" },
      { lat: 22.5805, lng: 88.3615, name: "MG Road" },
      { lat: 22.5685, lng: 88.3601, name: "Central" },
      { lat: 22.5645, lng: 88.3575, name: "Chandni Chowk" },
      { lat: 22.563, lng: 88.351, name: "Esplanade" },
      { lat: 22.5532, lng: 88.3515, name: "Park Street" },
      { lat: 22.5445, lng: 88.349, name: "Maidan" },
      { lat: 22.5375, lng: 88.3485, name: "Rabindra Sadan" },
      { lat: 22.5315, lng: 88.3475, name: "Netaji Bhavan" },
      { lat: 22.5225, lng: 88.3465, name: "Jatin Das Park" },
      { lat: 22.517, lng: 88.346, name: "Kalighat" },
      { lat: 22.508, lng: 88.3455, name: "Rabindra Sarobar" },
      { lat: 22.4975, lng: 88.345, name: "Tollygunge" },
      { lat: 22.47, lng: 88.397, name: "Kavi Subhash" },
    ],
  },
  greenLine: {
    name: "Green Line (East - West)",
    color: "#16a34a",
    path: [
      { lat: 22.583, lng: 88.331, name: "Howrah Maidan" },
      { lat: 22.5839, lng: 88.3428, name: "Howrah Station" },
      { lat: 22.563, lng: 88.351, name: "Esplanade" },
      { lat: 22.567, lng: 88.3715, name: "Sealdah" },
      { lat: 22.57, lng: 88.388, name: "Phoolbagan" },
      { lat: 22.5735, lng: 88.402, name: "Salt Lake Stadium" },
      { lat: 22.577, lng: 88.4075, name: "Bengal Chemical" },
      { lat: 22.5875, lng: 88.409, name: "City Centre" },
      { lat: 22.588, lng: 88.416, name: "Central Park" },
      { lat: 22.5865, lng: 88.42, name: "Karunamoyee" },
      { lat: 22.58, lng: 88.431, name: "Salt Lake Sector V" },
    ],
  },
};

export const PANDAL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
];
