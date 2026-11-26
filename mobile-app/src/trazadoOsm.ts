// Issue #4 [OSM]: arma en la app el trazado por carretera (OpenStreetMap) de un tramo.
// Solo sirve para dibujar la línea: las paradas y los horarios siguen viniendo de la API.
import datos from './data/geometriasOsm.json';

export type PuntoMapa = { latitude: number; longitude: number };

const segmentos = (datos as unknown as { segmentos: Record<string, [number, number][]> }).segmentos;

function segmento(a: string, b: string): [number, number][] | null {
  const directo = segmentos[`${a}|${b}`];
  if (directo) return directo;
  const inverso = segmentos[`${b}|${a}`];
  return inverso ? [...inverso].reverse() : null; // misma carretera en sentido contrario
}

/** Devuelve los puntos del tramo desde→hasta, o null si no hay trazado completo (la app usa la línea recta). */
export function trazadoTramoOsm(
  paradasRuta: { terminal: string }[] | undefined,
  desde: string,
  hasta: string,
): PuntoMapa[] | null {
  if (!paradasRuta?.length) return null;
  const nombres = paradasRuta.map((p) => p.terminal);
  const i = nombres.indexOf(desde);
  const j = nombres.indexOf(hasta);
  if (i === -1 || j === -1 || i === j) return null;

  const paso = i < j ? 1 : -1;
  const puntos: PuntoMapa[] = [];
  for (let k = i; k !== j; k += paso) {
    const seg = segmento(nombres[k], nombres[k + paso]);
    if (!seg) return null; // si falta un tramo, mejor no dibujar uno incompleto
    seg.forEach(([latitude, longitude], n) => {
      if (n > 0 || !puntos.length) puntos.push({ latitude, longitude });
    });
  }
  return puntos;
}