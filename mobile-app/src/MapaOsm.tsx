// Issue #4 [OSM]: mapa de OpenStreetMap (Leaflet) dentro de la app.
import { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

export type PuntoMapa = { latitude: number; longitude: number };
export type MarcadorMapa = { nombre: string; latitude: number; longitude: number };

type Props = {
  ruta: PuntoMapa[];
  marcadores: MarcadorMapa[];
  style?: StyleProp<ViewStyle>;
};

function construirHtml(ruta: PuntoMapa[], marcadores: MarcadorMapa[]) {
  const datos = JSON.stringify({
    ruta: ruta.map((p) => [p.latitude, p.longitude]),
    marcadores,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"/>
<style>html,body,#mapa{height:100%;margin:0}</style>
</head><body>
<div id="mapa"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script>
  const d = ${datos};
  const mapa = L.map('mapa').setView([-3.98, -79.21], 9);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© colaboradores de <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapa);
  if (d.ruta.length > 1) {
    const linea = L.polyline(d.ruta, { color: '#c8102e', weight: 5 }).addTo(mapa);
    mapa.fitBounds(linea.getBounds(), { padding: [20, 20] });
  }
  const pin = L.divIcon({
    className: '',
    html: '<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.4 14 38 14 38s14-13.6 14-24.1C28 6.2 21.7 0 14 0z" fill="#e53935" stroke="#b71c1c" stroke-width="1"/><circle cx="14" cy="14" r="5.5" fill="#7f1d1d"/></svg>',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34]
  });
  d.marcadores.forEach(function (m) {
    L.marker([m.latitude, m.longitude], { icon: pin }).addTo(mapa).bindPopup(m.nombre);
  });
</script>
</body></html>`;
}

export default function MapaOsm({ ruta, marcadores, style }: Props) {
  const html = useMemo(() => construirHtml(ruta, marcadores), [ruta, marcadores]);
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://planificador-viajes-unl.app' }}
        style={{ flex: 1 }}
        javaScriptEnabled
        nestedScrollEnabled
      />
    </View>
  );
}