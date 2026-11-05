const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const GrafoHorarios = require('./algorithms/GrafoHorarios');
const ordenTopologico = require('./algorithms/ordenTopologico');
const Planificador = require('./model/planificador');

const datos = JSON.parse(fs.readFileSync(path.join(__dirname, 'model', 'horarios.json'), 'utf8'));

const grafo = new GrafoHorarios(datos.minutosMinimosTransbordo).cargar(datos.frecuencias);

if (grafo.errores.length) console.warn('Registros inválidos:', grafo.errores);

const { esAciclico } = ordenTopologico(grafo);
console.log(`Nodos: ${grafo.nodos.length} | Aristas: ${grafo.aristas.length} | Grafo acíclico: ${esAciclico}`);
if (!esAciclico) process.exit(1);

const hora = (d) => d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });

const planificador = new Planificador(grafo);
const consulta = { origen: 'Catamayo', destino: 'Cariamanga', desde: '2026-11-02T06:30:00-05:00' };

for (const criterio of ['tiempo', 'espera', 'conexiones']) {
  const r = planificador.buscarRuta({ ...consulta, criterio });
  console.log(`\n=== ${consulta.origen} -> ${consulta.destino} (criterio: ${criterio}) ===`);
  if (!r) {
    console.log('No existe una conexión válida para los parámetros ingresados.');
    continue;
  }
  r.tramos.forEach((t) => console.log(`${t.desde} ${hora(t.salida)} -> ${t.hasta} ${hora(t.llegada)} (Coop. ${t.cooperativa})`));
  console.log(`Transbordos: ${r.transbordos} | Espera entre buses: ${r.esperaTotalMin} min | Duración: ${r.duracionViajeMin} min`);
}

/* ------------------------------------------------------------------ */
/* Frontend: mapa interactivo (Leaflet + OpenStreetMap)               */
/* Se sirve con el módulo nativo node:http, sin dependencias nuevas.  */
/* ------------------------------------------------------------------ */

const terminales = datos.terminales || {};
for (const f of datos.frecuencias) {
  for (const t of [f.origen, f.destino]) {
    if (!terminales[t]) console.warn(`La terminal "${t}" no tiene coordenadas en horarios.json (no se dibujará en el mapa).`);
  }
}

// Pares de terminales con al menos una frecuencia (sin repetir ni importar el sentido).
const conexiones = [];
const vistas = new Set();
for (const f of datos.frecuencias) {
  const par = [f.origen, f.destino].sort();
  const clave = par.join('|');
  if (!vistas.has(clave) && terminales[par[0]] && terminales[par[1]]) {
    vistas.add(clave);
    conexiones.push(par);
  }
}

const PAGINA = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Planificador de Viajes UNL</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, Arial, sans-serif; display: flex; height: 100vh; color: #1f2937; }
  aside { width: 340px; padding: 16px; overflow-y: auto; border-right: 1px solid #e5e7eb; background: #f9fafb; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6b7280; margin-bottom: 14px; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 10px 0 4px; }
  select, input, button { width: 100%; padding: 8px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 6px; }
  button { margin-top: 14px; background: #1d4ed8; color: #fff; border: 0; cursor: pointer; font-weight: 600; }
  button:hover { background: #1e40af; }
  #resultado { margin-top: 16px; font-size: 14px; }
  .tramo { border-left: 5px solid; padding: 6px 10px; margin-bottom: 8px; background: #fff; border-radius: 0 6px 6px 0; }
  .tramo small { color: #6b7280; }
  .aviso { background: #fef3c7; padding: 8px; border-radius: 6px; }
  .error { background: #fee2e2; padding: 8px; border-radius: 6px; }
  #mapa { flex: 1; }
  @media (max-width: 700px) { body { flex-direction: column-reverse; } aside { width: 100%; height: 50%; } #mapa { height: 50%; } }
</style>
</head>
<body>
<aside>
  <h1>🚌 Planificador de Viajes</h1>
  <div class="sub">Universidad Nacional de Loja</div>
  <label for="origen">Origen</label>
  <select id="origen"></select>
  <label for="destino">Destino</label>
  <select id="destino"></select>
  <label for="desde">Salir a partir de</label>
  <input id="desde" type="datetime-local" value="2026-11-02T06:30">
  <label for="criterio">Optimizar por</label>
  <select id="criterio">
    <option value="tiempo">Menor tiempo total</option>
    <option value="espera">Menor tiempo de espera</option>
    <option value="conexiones">Menos conexiones</option>
  </select>
  <button id="buscar">Buscar ruta</button>
  <div id="resultado"></div>
</aside>
<div id="mapa"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var COLORES = ['#dc2626', '#16a34a', '#9333ea', '#ea580c'];
  var coords = {};
  var mapa = L.map('mapa').setView([-4.1, -79.35], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; Colaboradores de OpenStreetMap'
  }).addTo(mapa);
  var capaRuta = L.layerGroup().addTo(mapa);

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function hora(iso) {
    return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' });
  }
  function mostrar(html, clase) {
    document.getElementById('resultado').innerHTML = '<div class="' + clase + '">' + html + '</div>';
  }

  fetch('/api/terminales').then(function (r) { return r.json(); }).then(function (d) {
    var selO = document.getElementById('origen');
    var selD = document.getElementById('destino');
    d.terminales.forEach(function (t) {
      coords[t.nombre] = [t.lat, t.lng];
      selO.add(new Option(t.nombre, t.nombre));
      selD.add(new Option(t.nombre, t.nombre));
      L.marker([t.lat, t.lng]).addTo(mapa).bindTooltip(t.nombre, { permanent: true, direction: 'top' });
    });
    d.conexiones.forEach(function (par) {
      L.polyline([coords[par[0]], coords[par[1]]], { color: '#9ca3af', weight: 2, dashArray: '6 6' }).addTo(mapa);
    });
    selO.value = 'Catamayo';
    selD.value = 'Cariamanga';
    var puntos = Object.keys(coords).map(function (k) { return coords[k]; });
    if (puntos.length) mapa.fitBounds(puntos, { padding: [40, 40] });
  });

  document.getElementById('buscar').addEventListener('click', function () {
    var origen = document.getElementById('origen').value;
    var destino = document.getElementById('destino').value;
    var desde = document.getElementById('desde').value;
    var criterio = document.getElementById('criterio').value;
    capaRuta.clearLayers();
    if (origen === destino) { mostrar('Elige un origen y un destino distintos.', 'aviso'); return; }
    if (!desde) { mostrar('Indica la fecha y hora de salida.', 'aviso'); return; }

    var q = new URLSearchParams({ origen: origen, destino: destino, desde: desde + ':00-05:00', criterio: criterio });
    fetch('/api/ruta?' + q.toString()).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error) { mostrar(esc(d.error), 'error'); return; }
      if (!d.ruta) { mostrar('No existe una conexión válida para los parámetros ingresados.', 'aviso'); return; }
      var r = d.ruta;
      var html = '';
      var puntos = [];
      r.tramos.forEach(function (t, i) {
        var color = COLORES[i % COLORES.length];
        var a = coords[t.desde];
        var b = coords[t.hasta];
        if (a && b) {
          L.polyline([a, b], { color: color, weight: 6, opacity: 0.9 }).addTo(capaRuta)
            .bindTooltip('Tramo ' + (i + 1) + ': ' + t.desde + ' → ' + t.hasta);
          puntos.push(a, b);
        }
        html += '<div class="tramo" style="border-color:' + color + '"><b>' + (i + 1) + '. ' + esc(t.desde) + ' → ' + esc(t.hasta) + '</b><br>' +
          hora(t.salida) + ' → ' + hora(t.llegada) + '<br><small>Coop. ' + esc(t.cooperativa) + '</small></div>';
      });
      html += '<p><b>Transbordos:</b> ' + r.transbordos + '<br><b>Espera entre buses:</b> ' + r.esperaTotalMin +
        ' min<br><b>Duración del viaje:</b> ' + r.duracionViajeMin + ' min</p>';
      mostrar(html, 'res');
      if (puntos.length) mapa.fitBounds(puntos, { padding: [60, 60] });
    }).catch(function () { mostrar('No se pudo consultar el servidor.', 'error'); });
  });
</script>
</body>
</html>`;

function responder(res, estado, tipo, cuerpo) {
  res.writeHead(estado, { 'Content-Type': tipo });
  res.end(cuerpo);
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/') return responder(res, 200, 'text/html; charset=utf-8', PAGINA);

  if (url.pathname === '/api/terminales') {
    const lista = Object.entries(terminales).map(([nombre, c]) => ({ nombre, lat: c.lat, lng: c.lng }));
    return responder(res, 200, 'application/json; charset=utf-8', JSON.stringify({ terminales: lista, conexiones }));
  }

  if (url.pathname === '/api/ruta') {
    const origen = url.searchParams.get('origen');
    const destino = url.searchParams.get('destino');
    const desde = url.searchParams.get('desde');
    const criterio = url.searchParams.get('criterio') || 'tiempo';
    try {
      if (!terminales[origen] || !terminales[destino]) throw new Error('Terminal de origen o destino no válida');
      if (origen === destino) throw new Error('El origen y el destino deben ser distintos');
      const ruta = planificador.buscarRuta({ origen, destino, desde, criterio });
      return responder(res, 200, 'application/json; charset=utf-8', JSON.stringify({ ruta }));
    } catch (e) {
      return responder(res, 400, 'application/json; charset=utf-8', JSON.stringify({ error: e.message }));
    }
  }

  responder(res, 404, 'text/plain; charset=utf-8', 'No encontrado');
});

const PUERTO = process.env.PORT || 3000;
servidor.listen(PUERTO, () => console.log(`\nMapa disponible en http://localhost:${PUERTO}`));
