/**
 * Configuración dinámica de Expo. Extiende app.json con:
 *  - El tráfico HTTP (cleartext) en Android, solo cuando la API usa http://.
 *  - La clave de Google Maps para Android (obligatoria fuera de Expo Go).
 *  - Validaciones que hacen fallar el build de EAS con un mensaje claro en lugar de
 *    generar un APK que no abre o que se cierra al mostrar el mapa.
 *
 * Las variables EAS_BUILD / EAS_BUILD_PROFILE / EAS_BUILD_PLATFORM solo existen en el
 * servidor de EAS (o con `eas build --local`); en `expo start` estas validaciones no corren.
 */
const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
const mapsApiKey = (process.env.GOOGLE_MAPS_API_KEY ?? '').trim();

const esBuildEas = process.env.EAS_BUILD === 'true';
const perfil = process.env.EAS_BUILD_PROFILE;
const plataformaBuild = process.env.EAS_BUILD_PLATFORM;

function paqueteInstalado(nombre) {
  try {
    require.resolve(`${nombre}/package.json`);
    return true;
  } catch {
    return false;
  }
}

function validarBuild() {
  if (!esBuildEas) return;

  if (perfil === 'development' && !paqueteInstalado('expo-dev-client')) {
    throw new Error(
      '[app.config] El perfil "development" genera un development build, pero "expo-dev-client" no está instalado. ' +
        'Sin él, el APK es un build debug que busca Metro al abrir y se queda en "Unable to load script". ' +
        'Instálalo con `npx expo install expo-dev-client` o usa el perfil "preview" para un APK autónomo.',
    );
  }

  if (perfil !== 'development' && !apiUrl) {
    throw new Error(
      `[app.config] El perfil "${perfil}" no define EXPO_PUBLIC_API_URL. La app no podría contactar al backend. ` +
        'Defínela en eas.json (env) o con `eas env:create` para ese entorno.',
    );
  }

  if (perfil === 'production' && apiUrl.startsWith('http://')) {
    console.warn(
      `[app.config] AVISO: el build de producción usa una API sin HTTPS (${apiUrl}). ` +
        'Solo funcionará en la misma red que el servidor; despliega el backend con HTTPS para usuarios reales.',
    );
  }

  if (plataformaBuild === 'android' && !mapsApiKey) {
    console.warn(
      '[app.config] AVISO: GOOGLE_MAPS_API_KEY no está definida. El APK funcionará, pero el mapa se ' +
        'reemplazará por un aviso (Google Maps cierra la app si no hay clave).',
    );
  }
}

validarBuild();

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    // iOS bloquea HTTP (ATS) en compilaciones propias; se permite solo si la API usa http://.
    ...(apiUrl.startsWith('http://')
      ? {
          infoPlist: {
            ...config.ios?.infoPlist,
            NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
          },
        }
      : {}),
  },
  plugins: [
    ...(config.plugins ?? []),
    ['./plugins/withAndroidCleartextTraffic', { enabled: apiUrl.startsWith('http://') }],
    ...(mapsApiKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsApiKey }]] : []),
  ],
  extra: {
    ...config.extra,
    // La app lo usa para no montar Google Maps en Android si el build no tiene clave.
    googleMapsAndroidConfigurado: Boolean(mapsApiKey),
  },
});
