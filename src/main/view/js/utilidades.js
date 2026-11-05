// Funciones de ayuda que usan app.js y mapa.js
const Util = {
  // "2026-11-02T12:00:00.000Z" -> "07:00 a. m." (hora de Ecuador)
  hora12(iso) {
    return new Date(iso).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Guayaquil',
    });
  },

  // 135 -> "2 h 15 min"
  minutos(m) {
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return h ? `${h} h ${min} min` : `${min} min`;
  },
};
