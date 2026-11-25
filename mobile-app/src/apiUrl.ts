/**
 * Resolución de la URL del backend.
 *
 * Es una función pura (sin dependencias de React Native) para poder probarla con Node.
 * Orden de prioridad:
 *   1. EXPO_PUBLIC_API_URL (se inyecta en el bundle al iniciar Expo o al compilar con EAS).
 *   2. En desarrollo con Expo Go / Metro: la IP de la computadora que sirve el bundle (hostUri).
 *   3. En desarrollo sin hostUri: el emulador (10.0.2.2 en Android, localhost en iOS/web).
 *   4. En una compilación release sin URL: no hay backend; se informa el problema.
 */

export type FuenteApiUrl = 'env' | 'expo-host' | 'emulador' | 'ninguna';

export type ResultadoApiUrl = {
  url: string;
  fuente: FuenteApiUrl;
  /** Motivo por el que no hay URL utilizable (se muestra al usuario). */
  problema?: string;
};

export type EntradaApiUrl = {
  envUrl?: string | null;
  hostUri?: string | null;
  plataforma: string;
  esDesarrollo: boolean;
  puerto?: number;
};

const URL_VALIDA = /^https?:\/\/[^\s/?#]+(?::\d+)?(\/[^\s]*)?$/i;
const HOSTS_TUNEL = /(\.exp\.direct|\.exp\.host|\.ngrok\.io|\.ngrok-free\.app)$/i;

function sinBarraFinal(url: string) {
  return url.replace(/\/+$/, '');
}

/** Extrae el host de un hostUri de Expo ("192.168.1.5:8081", "abc.exp.direct", "[::1]:8081"). */
export function hostDesdeHostUri(hostUri: string): string {
  const sinRuta = hostUri.trim().replace(/^[a-z]+:\/\//i, '').split('/')[0];
  if (sinRuta.startsWith('[')) {
    const fin = sinRuta.indexOf(']');
    return fin > 0 ? sinRuta.slice(0, fin + 1) : sinRuta;
  }
  return sinRuta.split(':')[0];
}

export function resolverApiUrl({
  envUrl,
  hostUri,
  plataforma,
  esDesarrollo,
  puerto = 3001,
}: EntradaApiUrl): ResultadoApiUrl {
  const configurada = (envUrl ?? '').trim();

  if (configurada) {
    if (!URL_VALIDA.test(configurada)) {
      return {
        url: '',
        fuente: 'env',
        problema: `EXPO_PUBLIC_API_URL no es una URL válida ("${configurada}"). Usa el formato http://IP:3001 o https://dominio.`,
      };
    }
    return { url: sinBarraFinal(configurada), fuente: 'env' };
  }

  if (hostUri) {
    const host = hostDesdeHostUri(hostUri);
    if (host && HOSTS_TUNEL.test(host)) {
      return {
        url: '',
        fuente: 'expo-host',
        problema:
          'Expo se inició con --tunnel y el backend no se puede alcanzar por ese túnel. ' +
          'Define EXPO_PUBLIC_API_URL con la IP local de tu computadora (o una URL pública) y reinicia Expo.',
      };
    }
    if (host) return { url: `http://${host}:${puerto}`, fuente: 'expo-host' };
  }

  if (esDesarrollo) {
    const host = plataforma === 'android' ? '10.0.2.2' : 'localhost';
    return { url: `http://${host}:${puerto}`, fuente: 'emulador' };
  }

  return {
    url: '',
    fuente: 'ninguna',
    problema:
      'Esta compilación no tiene configurada la URL del backend (EXPO_PUBLIC_API_URL). ' +
      'Vuelve a compilar indicando la URL en eas.json o en las variables de entorno de EAS.',
  };
}
