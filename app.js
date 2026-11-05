// Coordenadas base (Campus La Argelia, Loja, Ecuador)
const LOJA_UNL_COORDS = [-4.0325, -79.2032];
const DEFAULT_ZOOM = 15;

// Array de puntos de interés del campus/ciudad
const unlLocations = [
  { name: "Campus La Argelia (Central)", coords: [-4.0325, -79.2032], description: "Administración Central y Facultades principales." },
  { name: "Facultad de la Salud", coords: [-4.0250, -79.1980], description: "Carreras de Medicina, Enfermería, etc." },
  { name: "Parque Central (Centro)", coords: [-3.9931, -79.2045], description: "Punto céntrico de transbordo de buses." }
];

let map;
let activeMarkers = [];

// 1. Inicializar Mapa
function initMap() {
  map = L.map('map').setView(LOJA_UNL_COORDS, DEFAULT_ZOOM);

  // Capa gráfica de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Cargar marcadores iniciales
  renderLocations();

  // Evento: Clic directo en el mapa para marcar origen
  map.on('click', onMapClick);
}

// 2. Renderizar Puntos y Lista Lateral
function renderLocations() {
  const listContainer = document.getElementById('location-items');
  listContainer.innerHTML = '';

  unlLocations.forEach((place) => {
    // Añadir Marcador al Mapa
    const marker = L.marker(place.coords).addTo(map);
    marker.bindPopup(`<b>${place.name}</b><br>${place.description}`);
    activeMarkers.push(marker);

    // Añadir Elemento a la Lista Lateral
    const li = document.createElement('li');
    li.textContent = place.name;
    li.addEventListener('click', () => {
      map.flyTo(place.coords, 17, { duration: 1.5 });
      marker.openPopup();
    });
    listContainer.appendChild(li);
  });
}

// 3. Manejo de Selección manual de formulario
document.getElementById('travel-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const destValue = document.getElementById('destination').value;
  
  if (destValue) {
    const [lat, lng] = destValue.split(',').map(Number);
    map.flyTo([lat, lng], 17);
  }
});

// 4. Capturar clic en el mapa
function onMapClick(e) {
  const { lat, lng } = e.latlng;
  
  L.popup()
    .setLatLng(e.latlng)
    .setContent(`Punto seleccionado:<br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`)
    .openOn(map);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', initMap);
