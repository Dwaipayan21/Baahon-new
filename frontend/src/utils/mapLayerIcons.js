const encodeSvg = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export const TOILET_MARKER_SVG = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="30"
  height="30"
  viewBox="0 0 44 44"
>
  <circle
    cx="22"
    cy="22"
    r="20"
    fill="#2563eb"
    stroke="#ffffff"
    stroke-width="3"
  />

  <circle
    cx="16"
    cy="12.5"
    r="2.2"
    fill="#ffffff"
  />
  <path
    d="M13.5 17
       C13.5 15.8 14.5 15 16 15
       C17.5 15 18.5 15.8 18.5 17
       L18.5 24
       L17.3 24
       L17.3 31
       L14.7 31
       L14.7 24
       L13.5 24
       Z"
    fill="#ffffff"
  />
  <circle
    cx="28"
    cy="12.5"
    r="2.2"
    fill="#ffffff"
  />
  <path
    d="M28 15
       C26.5 15 25.5 16 25 17.5
       L22.5 24
       H26
       L25 31
       H27.5
       L28 25
       L28.5 31
       H31
       L30 24
       H33.5
       L31 17.5
       C30.5 16 29.5 15 28 15
       Z"
    fill="#ffffff"
  />
  <path
    d="M22 10v22"
    stroke="#2563eb"
    stroke-width="1.5"
    opacity="0.9"
  />
</svg>
`;

export const MEDICINE_MARKER_SVG = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="30"
  height="30"
  viewBox="0 0 44 44"
>
  <circle
    cx="22"
    cy="22"
    r="20"
    fill="#dc2626"
    stroke="#ffffff"
    stroke-width="3"
  />
  <rect
    x="12"
    y="19"
    width="20"
    height="6"
    rx="2"
    fill="#ffffff"
  />
  <rect
    x="19"
    y="12"
    width="6"
    height="20"
    rx="2"
    fill="#ffffff"
  />
</svg>
`;

export const toiletMarkerIcon = () =>
  encodeSvg(TOILET_MARKER_SVG);

export const medicineMarkerIcon = () =>
  encodeSvg(MEDICINE_MARKER_SVG);

export const createMarkerElement = (svg) => {
  const element = document.createElement("div");

  element.innerHTML = svg;

  element.style.width = "30px";
  element.style.height = "30px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.cursor = "pointer";
  element.style.userSelect = "none";

  const svgElement = element.querySelector("svg");

  if (svgElement) {
    svgElement.style.width = "30px";
    svgElement.style.height = "30px";
    svgElement.style.display = "block";
  }

  return element;
};