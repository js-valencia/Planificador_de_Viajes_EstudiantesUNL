// Conecta el formulario con la API del servidor y con el mapa (mapa.js).
(async function () {
  const $ = (id) => document.getElementById(id);
  const mensaje = $('mensaje');
  const resultado = $('resultado');

  const hora = (iso) => new Date(iso).toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil',
  });

  const duracion = (min) => {
    const m = Math.round(min);
    return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
  };

  const avisar = (texto, esError = false) => {
    mensaje.textContent = texto;
    mensaje.className = esError ? 'error' : '';
  };

  // Muestra el resumen y la lista de tramos en el panel lateral
  function mostrar(ruta) {
    resultado.replaceChildren();

    const resumen = document.createElement('div');
    resumen.className = 'resumen';
    [
      [duracion(ruta.duracionViajeMin), 'duración'],
      [String(ruta.transbordos), ruta.transbordos === 1 ? 'transbordo' : 'transbordos'],
      [duracion(ruta.esperaTotalMin), 'espera entre buses'],
    ].forEach(([valor, etiqueta]) => {
      const d = document.createElement('div');
      d.className = 'dato';
      const b = document.createElement('b');
      b.textContent = valor;
      const s = document.createElement('span');
      s.textContent = etiqueta;
      d.append(b, s);
      resumen.append(d);
    });
    resultado.append(resumen);

    ruta.tramos.forEach((t) => {
      const div = document.createElement('div');
      div.className = 'tramo ' + t.cooperativa.toLowerCase();
      const fuerte = document.createElement('strong');
      fuerte.textContent = `${t.desde} → ${t.hasta}`;
      const peque = document.createElement('small');
      peque.textContent = `${hora(t.salida)} – ${hora(t.llegada)} · Coop. ${t.cooperativa}`;
      div.append(fuerte, peque);
      resultado.append(div);
    });
  }

  Mapa.iniciar();

  // Carga terminales y coordenadas desde el servidor
  let terminales;
  let coords;
  try {
    const [t, c] = await Promise.all([
      fetch('/api/terminales').then((r) => r.json()),
      fetch('/api/coordenadas').then((r) => r.json()),
    ]);
    terminales = t.terminales;
    coords = c;
  } catch (e) {
    avisar('No se pudo conectar con el servidor. Verifica que esté en ejecución.', true);
    return;
  }

  // Llena los selectores de origen y destino
  for (const sel of [$('origen'), $('destino')]) {
    for (const nombre of terminales) sel.add(new Option(nombre, nombre));
  }
  if (terminales.includes('Loja')) $('origen').value = 'Loja';
  $('destino').selectedIndex = terminales.findIndex((n) => n !== $('origen').value);

  Mapa.marcarTerminales(terminales, coords);

  // Al buscar: pide la ruta al servidor y la muestra en el panel y en el mapa
  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    resultado.replaceChildren();
    Mapa.limpiarRuta();

    const params = new URLSearchParams({
      origen: $('origen').value,
      destino: $('destino').value,
      desde: `${$('desde').value}:00-05:00`,
      criterio: $('criterio').value,
    });

    avisar('Buscando la mejor ruta…');
    try {
      const resp = await fetch('/api/ruta?' + params);
      const datos = await resp.json();
      if (!resp.ok) {
        avisar(datos.error || 'No se pudo calcular la ruta.', true);
        return;
      }
      if (!datos.ruta) {
        avisar('No hay una conexión válida para esa fecha y hora. Prueba con una hora más temprana.', true);
        return;
      }
      avisar('');
      mostrar(datos.ruta);
      await Mapa.dibujarRuta(datos.ruta, coords);
      Mapa.dibujarRuta(datos.ruta, coords);
    } catch (err) {
      avisar('Error de conexión con el servidor.', true);
    }
  });
})();