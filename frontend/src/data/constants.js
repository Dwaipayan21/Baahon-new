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

export const METRO_STATIONS = {
  dakshineswar: { name: "Dakshineswar", lat: 22.6534, lng: 88.3582 },
  baranagar: { name: "Baranagar", lat: 22.6535, lng: 88.3789 },
  noapara: { name: "Noapara", lat: 22.6397, lng: 88.3939 },
  dumdum: { name: "Dum Dum", lat: 22.6211, lng: 88.3928 },
  belgachia: { name: "Belgachia", lat: 22.6058, lng: 88.3864 },
  shyambazar: { name: "Shyambazar", lat: 22.6013, lng: 88.3726 },
  shobhabazar: { name: "Shobhabazar Sutanuti", lat: 22.5952, lng: 88.3654 },
  girishpark: { name: "Girish Park", lat: 22.5892, lng: 88.363 },
  mgroad: { name: "Mahatma Gandhi Road", lat: 22.5835, lng: 88.3632 },
  central: { name: "Central", lat: 22.5687, lng: 88.35 },
  chandnichowk: { name: "Chandni Chowk", lat: 22.565, lng: 88.352 },
  esplanade: { name: "Esplanade", lat: 22.5633, lng: 88.3517 },
  parkstreet: { name: "Park Street", lat: 22.5556, lng: 88.3514 },
  maidan: { name: "Maidan", lat: 22.5522, lng: 88.3487 },
  rabindrasadan: { name: "Rabindra Sadan", lat: 22.5397, lng: 88.3455 },
  netajibhavan: { name: "Netaji Bhavan", lat: 22.5314, lng: 88.3448 },
  jatindaspark: { name: "Jatin Das Park", lat: 22.5227, lng: 88.3452 },
  kalighat: { name: "Kalighat", lat: 22.5151, lng: 88.346 },
  rabindrasarobar: { name: "Rabindra Sarobar", lat: 22.5074, lng: 88.3459 },
  uttamkumar: { name: "Mahanayak Uttam Kumar", lat: 22.4981, lng: 88.346 },
  netaji: { name: "Netaji", lat: 22.4867, lng: 88.3483 },
  suryasen: { name: "Masterda Surya Sen", lat: 22.4747, lng: 88.35 },
  gitanjali: { name: "Gitanjali", lat: 22.4667, lng: 88.357 },
  kavinazrul: { name: "Kavi Nazrul", lat: 22.462, lng: 88.3752 },
  shahidkhudiram: { name: "Shahid Khudiram", lat: 22.4526, lng: 88.3779 },
  kavisubhash: { name: "Kavi Subhash", lat: 22.47194, lng: 88.39806 },
  howrahmaidan: { name: "Howrah Maidan", lat: 22.583, lng: 88.331 },
  howrah: { name: "Howrah", lat: 22.5839, lng: 88.3428 },
  mahakaran: { name: "Mahakaran", lat: 22.5666, lng: 88.3474 },
  sealdah: { name: "Sealdah", lat: 22.5675, lng: 88.3698 },
  phoolbagan: { name: "Phoolbagan", lat: 22.573, lng: 88.388 },
  saltlakestadium: { name: "Salt Lake Stadium", lat: 22.5735, lng: 88.402 },
  bengalchemical: { name: "Bengal Chemical", lat: 22.577, lng: 88.4075 },
  citycentre: { name: "City Centre", lat: 22.5875, lng: 88.409 },
  centralpark: { name: "Central Park", lat: 22.588, lng: 88.416 },
  karunamoyee: {
    name: "Karunamoyee",
    lat: 22.5835,
    lng: 88.4230,
  },
  sectorv: {
    name: "Salt Lake Sector V",
    lat: 22.58,
    lng: 88.431,
  },
  dumdumcantonment: { name: "Dum Dum Cantonment", lat: 22.637, lng: 88.398 },
  jessoreroad: { name: "Jessore Road", lat: 22.645, lng: 88.423 },
  jaihind: { name: "Jai Hind (Airport)", lat: 22.643, lng: 88.437 },
  satyajitray: { name: "Satyajit Ray", lat: 22.483, lng: 88.395 },
  jyotirindranandi: { name: "Jyotirindra Nandi", lat: 22.494, lng: 88.397 },
  kavisukanta: { name: "Kavi Sukanta", lat: 22.505, lng: 88.4 },
  hemantamukhopadhyay: { name: "Hemanta Mukhopadhyay", lat: 22.514, lng: 88.402 },
  vipbazar: { name: "VIP Bazar", lat: 22.527, lng: 88.405 },
  ritwikghatak: { name: "Ritwik Ghatak", lat: 22.544, lng: 88.406 },
  barunsengupta: { name: "Barun Sengupta", lat: 22.562, lng: 88.3993 },
  beleghata: { name: "Beleghata", lat: 22.536, lng: 88.4067 },
};

export const METRO_DATA = {
  blueLine: {
    name: "Blue Line",
    color: "#005bb3",
    stations: [
      "dakshineswar", "baranagar", "noapara", "dumdum", "belgachia",
      "shyambazar", "shobhabazar", "girishpark", "mgroad", "central",
      "chandnichowk", "esplanade", "parkstreet", "maidan", "rabindrasadan",
      "netajibhavan", "jatindaspark", "kalighat", "rabindrasarobar", "uttamkumar",
      "netaji", "suryasen", "gitanjali", "kavinazrul", "shahidkhudiram", "kavisubhash",
    ],
  },
  greenLine: {
    name: "Green Line",
    color: "#16a34a",
    stations: [
      "howrahmaidan", "howrah", "mahakaran", "esplanade", "sealdah", "phoolbagan",
      "saltlakestadium", "bengalchemical", "citycentre", "centralpark", "karunamoyee", "sectorv",
    ],
  },
  yellowLine: {
    name: "Yellow Line",
    color: "#eab308",
    stations: ["noapara", "dumdumcantonment", "jessoreroad", "jaihind"],
  },
  orangeLine: {
    name: "Orange Line",
    color: "#f97316",
    stations: [
      "kavisubhash", "satyajitray", "jyotirindranandi", "kavisukanta",
      "hemantamukhopadhyay", "vipbazar", "ritwikghatak", "barunsengupta", "beleghata",
    ],
  },
  purpleLine: {
    name: "Purple Line",
    color: "#8b5cf6",
    stations: [],
  },
};

export const METRO_GEOJSON = {
  blueLine: "/metro/blueline.geojson",
  greenLine: "/metro/greenline.geojson",
  yellowLine: "/metro/yellowline.geojson",
  orangeLine: "/metro/orangeline.geojson",
  purpleLine: "/metro/purpleline.geojson",
};

export const PANDAL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
];
