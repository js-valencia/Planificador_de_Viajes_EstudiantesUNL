// Mapa con Leaflet. Se usa así:
//   MapaRutas.iniciar('mapa', coordenadas);
//   MapaRutas.dibujarRuta(ruta, coordenadas);
//   MapaRutas.limpiar();
const MapaRutas = (() => {
  const COLOR = {
    linea: '#1e3a8a',
    origen: '#c8102e',
    transbordo: '#f59e0b',
    destino: '#006838',
    terminal: '#94a3b8',
  };

  let mapa = null;
  let capaTerminales = null;
  let capaRuta = null;
  let solicitudRuta = 0;

  function marcador(coord, color, radio, texto) {
    return L.circleMarker([coord.lat, coord.lng], {
      radius: radio,
      color: '#ffffff',
      weight: 2,
      fillColor: color,
      fillOpacity: 1,
    }).bindTooltip(texto);
  }

  function iniciar(idElemento, coordenadas) {
    mapa = L.map(idElemento).setView([-4.05, -79.35], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(mapa);

    capaTerminales = L.layerGroup().addTo(mapa);
    capaRuta = L.layerGroup().addTo(mapa);

    const puntos = [];
    for (const [nombre, c] of Object.entries(coordenadas)) {
      marcador(c, COLOR.terminal, 6, nombre).addTo(capaTerminales);
      puntos.push([c.lat, c.lng]);
    }
    if (puntos.length) mapa.fitBounds(puntos, { padding: [40, 40] });
  }

  function limpiar() {
    solicitudRuta++;
    if (capaRuta) capaRuta.clearLayers();
  }

  function dibujarRuta(ruta, coordenadas) {
    limpiar();
    if (!ruta || !ruta.tramos.length) return;

    const solicitudActual = solicitudRuta;
    const lineas = [];
    const tramos = ruta.tramos;

    tramos.forEach((t, i) => {
      const a = coordenadas[t.desde];
      const b = coordenadas[t.hasta];
      if (!a || !b) return;

      const paradas = [t.desde, ...(t.via || []), t.hasta];
      lineas.push(
        fetch('/api/trazo?' + new URLSearchParams({ paradas: paradas.join(',') }))
          .then((respuesta) => {
            if (!respuesta.ok) throw new Error('No se pudo cargar el trazado');
            return respuesta.json();
          })
          .then((trazo) => ({
            indice: i,
            tramo: t,
            coordenadas: trazo.coordenadas,
            aproximado: trazo.aproximado,
          }))
          .catch(() => ({
            indice: i,
            tramo: t,
            coordenadas: paradas.map((terminal) => coordenadas[terminal])
              .filter(Boolean)
              .map(({ lat, lng }) => [lat, lng]),
            aproximado: true,
          }))
      );

      const esDestino = i === tramos.length - 1;
      marcador(
        b,
        esDestino ? COLOR.destino : COLOR.transbordo,
        10,
        esDestino ? `Destino: ${t.hasta}` : `Transbordo: ${t.hasta}`
      ).addTo(capaRuta);
    });

    for (const tramo of tramos) {
      for (const parada of tramo.via || []) {
        const coord = coordenadas[parada];
        if (coord) marcador(coord, COLOR.terminal, 6, parada).addTo(capaRuta);
      }
    }

    const origen = coordenadas[tramos[0].desde];
    if (origen) {
      marcador(origen, COLOR.origen, 10, `Origen: ${tramos[0].desde}`).addTo(capaRuta);
    }

    Promise.all(lineas).then((resultados) => {
      if (solicitudActual !== solicitudRuta) return;

      const puntos = [];
      for (const { indice, tramo, coordenadas: puntosTramo, aproximado } of resultados) {
        if (!puntosTramo?.length) continue;
        puntos.push(...puntosTramo);
        L.polyline(puntosTramo, {
          color: COLOR.linea,
          weight: 4,
          opacity: 0.9,
          ...(aproximado ? { dashArray: '8, 8' } : {}),
        }).bindPopup(
          `<b>Tramo ${indice + 1}</b><br>` +
          `${tramo.desde} ${Util.hora12(tramo.salida)} → ${tramo.hasta} ${Util.hora12(tramo.llegada)}<br>` +
          `Coop. ${tramo.cooperativa}`
        ).addTo(capaRuta);
      }

      if (puntos.length) mapa.fitBounds(puntos, { padding: [50, 50] });
    });
  }

  return { iniciar, dibujarRuta, limpiar };
})();
