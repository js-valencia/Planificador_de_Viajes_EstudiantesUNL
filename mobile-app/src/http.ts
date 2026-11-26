/**
 * Cliente HTTP del backend. No depende de React Native: la app lo usa a través de
 * `src/api.ts` y las pruebas de integración lo ejecutan con Node contra el servidor real.
 */

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
  paradasRuta?: { terminal: string }[];
};

export type Ruta = {
  criterio: string;
  tramos: Tramo[];
  transbordos: number;
  esperaTotalMin: number;
  duracionViajeMin: number;
  esperaInicialMin: number;
};

export type ConsultaRuta = {
  origen: string;
  destino: string;
  desde: string;
  criterio: string;
};

export type TipoErrorApi = 'config' | 'red' | 'timeout' | 'http' | 'formato';

export class ApiError extends Error {
  tipo: TipoErrorApi;
  status?: number;

  constructor(message: string, tipo: TipoErrorApi, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.tipo = tipo;
    this.status = status;
  }
}

type OpcionesCliente = {
  timeoutMs?: number;
  /** Mensaje a mostrar cuando no hay URL configurada. */
  problemaConfiguracion?: string;
  fetchImpl?: typeof fetch;
};

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return !!valor && typeof valor === 'object' && !Array.isArray(valor);
}

function esTerminal(valor: unknown): valor is Terminal {
  return esObjeto(valor) && typeof valor.nombre === 'string'
    && typeof valor.lat === 'number' && typeof valor.lng === 'number';
}

function esRuta(valor: unknown): valor is Ruta {
  return esObjeto(valor) && Array.isArray(valor.tramos) && valor.tramos.length > 0
    && valor.tramos.every((t) => esObjeto(t) && typeof t.desde === 'string' && typeof t.hasta === 'string'
      && typeof t.salida === 'string' && typeof t.llegada === 'string')
    && typeof valor.transbordos === 'number';
}

export function crearClienteApi(baseUrl: string, opciones: OpcionesCliente = {}) {
  const timeoutMs = opciones.timeoutMs ?? 12000;
  const fetchImpl = opciones.fetchImpl ?? fetch;

  async function getJson(path: string): Promise<Record<string, unknown>> {
    if (!baseUrl) {
      throw new ApiError(
        opciones.problemaConfiguracion ?? 'La URL de la API no está configurada para esta compilación.',
        'config',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}${path}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError(
            `El backend (${baseUrl}) tardó más de ${Math.round(timeoutMs / 1000)} s en responder. Revisa la red e inténtalo otra vez.`,
            'timeout',
          );
        }
        throw new ApiError(
          `No se pudo conectar con ${baseUrl}. Comprueba que el backend esté activo, que el teléfono esté en la misma red y que el firewall permita el puerto.`,
          'red',
        );
      }

      const contentType = response.headers.get('content-type') ?? '';
      const body = await response.text();

      if (!contentType.includes('application/json')) {
        throw new ApiError(
          `${baseUrl} respondió con un formato inesperado (HTTP ${response.status}). ¿Es la URL del backend del planificador?`,
          'formato',
          response.status,
        );
      }

      let data: unknown;
      try {
        data = JSON.parse(body);
      } catch {
        throw new ApiError('La API devolvió una respuesta JSON inválida.', 'formato', response.status);
      }

      if (!esObjeto(data)) {
        throw new ApiError('La API devolvió una respuesta JSON con formato inesperado.', 'formato', response.status);
      }

      if (!response.ok) {
        throw new ApiError(
          typeof data.error === 'string' ? data.error : `Error de API (HTTP ${response.status}).`,
          'http',
          response.status,
        );
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    baseUrl,

    async verificarSalud(): Promise<boolean> {
      const data = await getJson('/api/health');
      return data.ok === true;
    },

    async obtenerTerminales(): Promise<{ terminales: Terminal[]; criterios: string[] }> {
      const data = await getJson('/api/terminales');
      if (!Array.isArray(data.terminales) || !data.terminales.every(esTerminal)) {
        throw new ApiError('La lista de terminales recibida no tiene el formato esperado.', 'formato');
      }
      const criterios = Array.isArray(data.criterios)
        ? data.criterios.filter((c): c is string => typeof c === 'string')
        : [];
      return { terminales: data.terminales, criterios };
    },

    async buscarRuta(consulta: ConsultaRuta): Promise<Ruta | null> {
      const query = new URLSearchParams(consulta);
      const data = await getJson(`/api/ruta?${query.toString()}`);
      if (data.ruta === null) return null;
      if (!esRuta(data.ruta)) {
        throw new ApiError('La ruta recibida no tiene el formato esperado.', 'formato');
      }
      return data.ruta;
    },
  };
}

export type ClienteApi = ReturnType<typeof crearClienteApi>;
