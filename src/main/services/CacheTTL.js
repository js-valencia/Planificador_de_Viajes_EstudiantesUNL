/**
 * Caché en memoria con vencimiento (TTL) y tamaño máximo (LRU).
 * - Una entrada vencida nunca se devuelve: get() la elimina y cuenta un "vencimiento".
 * - Al superar maxEntradas se expulsa la entrada menos usada recientemente.
 * - El reloj es inyectable para poder probar el vencimiento sin esperar.
 */
class CacheTTL {
  constructor({ ttlMs, maxEntradas = 500, ahora = Date.now } = {}) {
    if (!(ttlMs > 0)) throw new Error('ttlMs debe ser un número positivo');
    if (!(maxEntradas >= 1)) throw new Error('maxEntradas debe ser al menos 1');
    this.ttlMs = ttlMs;
    this.maxEntradas = maxEntradas;
    this.ahora = ahora;
    this.mapa = new Map(); // clave -> { valor, venceEn }; el orden de inserción es el orden LRU
    this.reiniciarContadores();
  }

  reiniciarContadores() {
    this.aciertos = 0;
    this.fallos = 0;
    this.vencimientos = 0;
    this.expulsiones = 0;
    this.invalidaciones = 0;
  }

  get(clave) {
    const entrada = this.mapa.get(clave);
    if (!entrada) { this.fallos++; return undefined; }
    if (this.ahora() >= entrada.venceEn) {
      this.mapa.delete(clave);
      this.vencimientos++;
      this.fallos++;
      return undefined;
    }
    this.mapa.delete(clave); // se reinserta para marcarla como la más reciente
    this.mapa.set(clave, entrada);
    this.aciertos++;
    return entrada.valor;
  }

  set(clave, valor) {
    this.mapa.delete(clave);
    this.mapa.set(clave, { valor, venceEn: this.ahora() + this.ttlMs });
    while (this.mapa.size > this.maxEntradas) {
      this.mapa.delete(this.mapa.keys().next().value);
      this.expulsiones++;
    }
    return valor;
  }

  /** Elimina todo (datos modificados). Devuelve cuántas entradas se descartaron. */
  limpiar() {
    const n = this.mapa.size;
    this.mapa.clear();
    this.invalidaciones += n;
    return n;
  }

  /** Elimina las vencidas sin esperar a que alguien las consulte. */
  purgarVencidos() {
    const t = this.ahora();
    let n = 0;
    for (const [clave, entrada] of this.mapa) {
      if (t >= entrada.venceEn) { this.mapa.delete(clave); n++; }
    }
    this.vencimientos += n;
    return n;
  }

  get tamano() { return this.mapa.size; }

  estadisticas() {
    const consultas = this.aciertos + this.fallos;
    return {
      entradas: this.mapa.size,
      maxEntradas: this.maxEntradas,
      ttlMs: this.ttlMs,
      aciertos: this.aciertos,
      fallos: this.fallos,
      vencimientos: this.vencimientos,
      expulsiones: this.expulsiones,
      invalidaciones: this.invalidaciones,
      tasaAciertos: consultas ? this.aciertos / consultas : 0,
    };
  }
}

module.exports = CacheTTL;
