// Mini arnés de pruebas (mismo estilo que /tests del backend, sin dependencias).
export function crearArnes(titulo) {
  let correctas = 0;
  const fallos = [];
  console.log(titulo);
  return {
    async prueba(nombre, cuerpo) {
      try { await cuerpo(); correctas++; console.log(`  ✓ ${nombre}`); }
      catch (e) { fallos.push(`${nombre}: ${e.message}`); console.log(`  ✗ ${nombre}\n      ${e.message.split('\n')[0]}`); }
    },
    fin() {
      console.log(`\n${correctas} pruebas correctas, ${fallos.length} fallidas`);
      if (fallos.length) { console.error(fallos.join('\n')); process.exit(1); }
    },
  };
}
