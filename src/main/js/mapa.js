const UNL_COORDS = [-4.0325, -79.2032];

const unlLocations = [
  { name: "Campus La Argelia (Central)", coords: [-4.0325, -79.2032], description: "Administración Central y Facultades." },
  { name: "Facultad de la Salud", coords: [-4.0250, -79.1980], description: "Medicina y ciencias de la salud." },
  { name: "Campus Motupe", coords: [-4.0340, -79.2020], description: "Área Agropecuaria." }
];

let map;

function initMap() {
  map = L.map('map').setView(UNL_COORDS, 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const listContainer = document.getElementById('location-items');

  unlLocations.forEach((place) => {
    const marker = L.marker(place.coords).addTo(map);
    marker.bindPopup(`<b>${place.name}</b><br>${place.description}`);

    const li = document.createElement('li');
    li.textContent = place.name;
    li.addEventListener('click', () => {
      map.flyTo(place.coords, 17, { duration: 1.5 });
      marker.openPopup();
    });
    listContainer.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', initMap);