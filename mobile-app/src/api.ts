import { Platform } from 'react-native';

const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEFAULT_API_URL = `http://${HOST}:3001`;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export type Terminal = {
  nombre: string;
  lat: number;
  lng: number;
};

export type Tramo = {
  cooperativa: string;
  nombreRuta?: string;
  cantones?: string[];
  desde: string;
  hasta: string;
  salida: string;
  llegada: string;
};

export type Ruta = {
  criterio: string;
  tramos: Tramo[];
  transbordos: number;
  esperaTotalMin: number;
  duracionViajeMin: number;
  esperaInicialMin: number;
};

export async function obtenerTerminales(): Promise<{ terminales: Terminal[]; criterios: string[] }> {
  const response = await fetch(`${API_URL}/api/terminales`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar las terminales');
  return data;
}

export async function buscarRuta(params: {
  origen: string;
  destino: string;
  desde: string;
  criterio: string;
}): Promise<Ruta | null> {
  const query = new URLSearchParams(params);
  const response = await fetch(`${API_URL}/api/ruta?${query.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'No se pudo consultar la ruta');
  return data.ruta ?? null;
}
