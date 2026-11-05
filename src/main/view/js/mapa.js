// Todo lo relacionado con el mapa (Leaflet). app.js lo usa a través del objeto Mapa.
const COLORES_COOPERATIVA = { Loja: '#1d6a86', Catamayo: '#c2185b' };
const COLOR_OTRA = '#6a4c93';

const Mapa = {
  mapa: null,
  capaRuta: null,

  // Crea el mapa centrado en la provincia de Loja
  iniciar() {
    this.mapa = L.map('mapa').setView([-4.05, -79.3], 10);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; Colaboradores de OpenStreetMap',
    }).addTo(this.mapa);
    this.capaRuta = L.layerGroup().addTo(this.mapa);
  },

  colorDe(cooperativa) {
    return COLORES_COOPERATIVA[cooperativa] || COLOR_OTRA;
  },

  // Pone un marcador con nombre en cada terminal que tenga coordenadas
  marcarTerminales(terminales, coords) {
    const puntos = [];
    for (const nombre of terminales) {
      const p = coords[nombre];
      if (!p) {
        console.warn('Sin coordenadas para:', nombre);
        continue;
      }
      puntos.push([p.lat, p.lng]);
      L.circleMarker([p.lat, p.lng], {
        radius: 7, color: '#14303a', weight: 2, fillColor: '#fff', fillOpacity: 1,
      })
        .bindTooltip(nombre, { permanent: true, direction: 'top', offset: [0, -6] })
        .addTo(this.mapa);
    }
    if (puntos.length) this.mapa.fitBounds(puntos, { padding: [50, 50] });
  },

  limpiarRuta() {
    this.capaRuta.clearLayers();
  },

  // Dibuja cada tramo como una línea del color de su cooperativa
  dibujarRuta(ruta, coords) {
    this.limpiarRuta();
    const limites = [];
    for (const t of ruta.tramos) {
      const a = coords[t.desde];
      const b = coords[t.hasta];
      if (!a || !b) continue;
      const pa = [a.lat, a.lng];
      const pb = [b.lat, b.lng];
      limites.push(pa, pb);
      const color = this.colorDe(t.cooperativa);
      L.polyline([pa, pb], { color, weight: 5, opacity: 0.9 })
        .bindTooltip(`${t.desde} → ${t.hasta} · Coop. ${t.cooperativa}`)
        .addTo(this.capaRuta);
      L.circleMarker(pb, { radius: 6, color, fillOpacity: 1 }).addTo(this.capaRuta);
    }
    if (limites.length) this.mapa.fitBounds(limites, { padding: [60, 60] });
  },
};