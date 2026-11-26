import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { resolverApiUrl } from './apiUrl';
import { crearClienteApi, type ConsultaHorarios, type ConsultaRuta, type Ruta, type Terminal } from './http';

export type { ConsultaHorarios, ConsultaRuta, Ruta, Terminal, Tramo } from './http';
export { ApiError } from './http';

// `process.env.EXPO_PUBLIC_API_URL` debe escribirse literalmente: babel-preset-expo
// lo reemplaza por su valor al generar el bundle (Expo Go y compilaciones EAS).
const configuracion = resolverApiUrl({
  envUrl: process.env.EXPO_PUBLIC_API_URL,
  hostUri: Constants.expoConfig?.hostUri,
  plataforma: Platform.OS,
  esDesarrollo: __DEV__,
});

export const API_URL = configuracion.url;
export const FUENTE_API_URL = configuracion.fuente;

if (__DEV__) {
  console.log(`[api] Backend: ${API_URL || '(sin configurar)'} (origen: ${FUENTE_API_URL})`);
  if (configuracion.problema) console.warn(`[api] ${configuracion.problema}`);
}

const cliente = crearClienteApi(API_URL, {
  timeoutMs: 12000,
  problemaConfiguracion: configuracion.problema,
});

export function obtenerTerminales(): Promise<{ terminales: Terminal[]; criterios: string[] }> {
  return cliente.obtenerTerminales();
}

export function obtenerHorarios(params: ConsultaHorarios): Promise<string[]> {
  return cliente.obtenerHorarios(params);
}

export function buscarRuta(params: ConsultaRuta): Promise<Ruta | null> {
  return cliente.buscarRuta(params);
}
