/**
 * Utilidades de fecha y hora en la zona de Ecuador continental (UTC-5, sin horario de verano).
 *
 * Los horarios de las cooperativas y las consultas al backend usan siempre -05:00, así que
 * la app no debe depender de la zona horaria configurada en el teléfono.
 */

const DESFASE_ECUADOR_MS = 5 * 60 * 60 * 1000;
export const ZONA_ECUADOR = '-05:00';

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Fecha y hora de Ecuador para un instante, como campos UTC de un Date desplazado. */
function enEcuador(instante: number) {
  return new Date(instante - DESFASE_ECUADOR_MS);
}

/** AAAA-MM-DD de hoy en Ecuador. */
export function fechaEcuador(instante = Date.now()): string {
  const d = enEcuador(instante);
  return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}-${dosDigitos(d.getUTCDate())}`;
}

/** Próxima media hora (al menos 30 min desde ahora), en hora de Ecuador, formato HH:MM. */
export function horaSiguienteEcuador(instante = Date.now()): string {
  const d = enEcuador(instante + 30 * 60 * 1000);
  const minutos = d.getUTCMinutes();
  d.setUTCMinutes(Math.ceil(minutos / 30) * 30, 0, 0);
  return `${dosDigitos(d.getUTCHours())}:${dosDigitos(d.getUTCMinutes())}`;
}

/** Valida AAAA-MM-DD y que la fecha exista en el calendario. */
export function esFechaValida(fecha: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha.trim());
  if (!m) return false;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** Valida HH:MM en formato de 24 horas. */
export function esHoraValida(hora: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hora.trim());
}

/** Instante ISO con zona de Ecuador que espera el backend. */
export function instanteConsulta(fecha: string, hora: string): string {
  return `${fecha.trim()}T${hora.trim()}:00${ZONA_ECUADOR}`;
}

/** "7:05 a. m." a partir de un ISO, siempre en hora de Ecuador. */
export function horaEcuador12(iso: string): string {
  const instante = Date.parse(iso);
  if (Number.isNaN(instante)) return '--:--';
  const d = enEcuador(instante);
  const h24 = d.getUTCHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${dosDigitos(d.getUTCMinutes())} ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}

/** "lun 25/11" si el tramo no sale el mismo día que la consulta. */
export function diaEcuadorCorto(iso: string): string {
  const instante = Date.parse(iso);
  if (Number.isNaN(instante)) return '';
  const d = enEcuador(instante);
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  return `${dias[d.getUTCDay()]} ${dosDigitos(d.getUTCDate())}/${dosDigitos(d.getUTCMonth() + 1)}`;
}
