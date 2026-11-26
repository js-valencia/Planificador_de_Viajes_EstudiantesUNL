import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { API_URL, buscarRuta, obtenerTerminales, Ruta, Terminal } from './src/api';
import { trazadoTramoOsm } from './src/trazadoOsm';
import {
  diaEcuadorCorto,
  esFechaValida,
  esHoraValida,
  fechaEcuador,
  horaEcuador12,
  horaSiguienteEcuador,
  instanteConsulta,
} from './src/fechas';

const CRITERIOS = [
  { value: 'tiempo', label: 'Menor tiempo total' },
  { value: 'espera', label: 'Menor tiempo de espera' },
  { value: 'conexiones', label: 'Menos conexiones' },
];

/**
 * En Android, react-native-maps usa Google Maps y la app se cierra si el build no tiene
 * la clave `com.google.android.geo.API_KEY`. Expo Go ya incluye una; un APK propio solo
 * la tiene si se compiló con GOOGLE_MAPS_API_KEY (ver app.config.js).
 */
const MAPA_DISPONIBLE =
  Platform.OS !== 'android' ||
  isRunningInExpoGo() ||
  Constants.expoConfig?.extra?.googleMapsAndroidConfigurado === true;

const ALTO_BARRA_ESTADO = Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 24 : 44;

function minutos(valor: number) {
  return `${Math.round(valor)} min`;
}

export default function App() {
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [criteriosApi, setCriteriosApi] = useState<string[]>([]);
  const [cargandoTerminales, setCargandoTerminales] = useState(true);
  const [errorTerminales, setErrorTerminales] = useState('');
  const [origen, setOrigen] = useState('Loja');
  const [destino, setDestino] = useState('Machala');
  const [fecha, setFecha] = useState(() => fechaEcuador());
  const [hora, setHora] = useState(() => horaSiguienteEcuador());
  const [criterio, setCriterio] = useState('tiempo');
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [fechaBuscada, setFechaBuscada] = useState('');
  const [buscado, setBuscado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [selector, setSelector] = useState<'origen' | 'destino' | 'criterio' | null>(null);

  const pedirTerminales = useCallback(() => {
    obtenerTerminales()
      .then((datos) => {
        setTerminales(datos.terminales);
        setCriteriosApi(datos.criterios);
        setOrigen((actual) =>
          datos.terminales.some((t) => t.nombre === actual) ? actual : datos.terminales[0]?.nombre ?? '');
        setDestino((actual) =>
          datos.terminales.some((t) => t.nombre === actual) ? actual : datos.terminales[1]?.nombre ?? '');
      })
      .catch((e) => setErrorTerminales(e instanceof Error ? e.message : 'No se pudo conectar con el servidor'))
      .finally(() => setCargandoTerminales(false));
  }, []);

  useEffect(() => {
    pedirTerminales();
  }, [pedirTerminales]);

  function reintentarTerminales() {
    setCargandoTerminales(true);
    setErrorTerminales('');
    pedirTerminales();
  }

  const criterios = useMemo(
    () => (criteriosApi.length ? CRITERIOS.filter((c) => criteriosApi.includes(c.value)) : CRITERIOS),
    [criteriosApi],
  );

  const rutaCoordenadas = useMemo(() => {
    if (!ruta) return [];
    const puntos: { latitude: number; longitude: number }[] = [];
    ruta.tramos.forEach((tramo, i) => {
          const trazado = trazadoTramoOsm(tramo.paradasRuta, tramo.desde, tramo.hasta);
      if (trazado) {
        trazado.forEach((p) => puntos.push(p));
        return;
      }
      const desde = terminales.find((t) => t.nombre === tramo.desde);
      const hasta = terminales.find((t) => t.nombre === tramo.hasta);
      if (desde && i === 0) puntos.push({ latitude: desde.lat, longitude: desde.lng });
      if (hasta) puntos.push({ latitude: hasta.lat, longitude: hasta.lng });
    });
    return puntos;
  }, [ruta, terminales]);

  const regionMapa = useMemo(() => {
    if (!rutaCoordenadas.length) {
      return { latitude: -3.98, longitude: -79.21, latitudeDelta: 0.3, longitudeDelta: 0.3 };
    }
    const latitudes = rutaCoordenadas.map((punto) => punto.latitude);
    const longitudes = rutaCoordenadas.map((punto) => punto.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.15),
      longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.15),
    };
  }, [rutaCoordenadas]);

  async function buscar() {
    setError('');
    setBuscado(false);
    setRuta(null);
    if (!terminales.length) return setError('Primero hay que cargar las terminales desde el servidor.');
    if (!origen || !destino) return setError('Selecciona un origen y un destino válidos.');
    if (origen === destino) return setError('El origen y el destino deben ser distintos.');
    if (!esFechaValida(fecha)) return setError('La fecha debe tener el formato AAAA-MM-DD y ser una fecha real.');
    if (!esHoraValida(hora)) return setError('La hora debe tener el formato HH:MM (24 horas), por ejemplo 07:30.');

    setCargando(true);
    try {
      const resultado = await buscarRuta({
        origen,
        destino,
        desde: instanteConsulta(fecha, hora),
        criterio,
      });
      setRuta(resultado);
      setFechaBuscada(fecha.trim());
      setBuscado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor');
      setBuscado(true);
    } finally {
      setCargando(false);
    }
  }

  function horaConDia(iso: string) {
    const horaTexto = horaEcuador12(iso);
    return fechaEcuador(Date.parse(iso)) === fechaBuscada ? horaTexto : `${horaTexto} (${diaEcuadorCorto(iso)})`;
  }

  const opciones = selector === 'criterio'
    ? criterios.map((item) => ({ nombre: item.label, value: item.value }))
    : terminales.map((item) => ({ nombre: item.nombre, value: item.nombre }));

  function seleccionar(value: string) {
    if (selector === 'origen') setOrigen(value);
    if (selector === 'destino') setDestino(value);
    if (selector === 'criterio') setCriterio(value);
    setSelector(null);
  }

  const sinTerminales = !terminales.length;

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: ALTO_BARRA_ESTADO + 14 }]}>
        <Text style={styles.headerTitle}>Planificador de viajes</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {cargandoTerminales && <Text style={styles.status}>Conectando con el servidor...</Text>}
        {!!errorTerminales && (
          <View style={[styles.status, styles.error]}>
            <Text style={styles.errorText}>{errorTerminales}</Text>
            {!!API_URL && <Text style={styles.errorDetail}>Servidor: {API_URL}</Text>}
            <Pressable style={styles.retryButton} onPress={reintentarTerminales}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Origen</Text>
          <Pressable style={styles.select} disabled={sinTerminales} onPress={() => setSelector('origen')}>
            <Text style={styles.selectText}>{origen || 'Seleccionar'}</Text>
          </Pressable>

          <Text style={styles.label}>Destino</Text>
          <Pressable style={styles.select} disabled={sinTerminales} onPress={() => setSelector('destino')}>
            <Text style={styles.selectText}>{destino || 'Seleccionar'}</Text>
          </Pressable>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Fecha</Text>
              <TextInput
                style={styles.input}
                value={fecha}
                onChangeText={setFecha}
                placeholder="AAAA-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Hora</Text>
              <TextInput
                style={styles.input}
                value={hora}
                onChangeText={setHora}
                placeholder="HH:MM"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          <Text style={styles.label}>Prefiero</Text>
          <Pressable style={styles.select} onPress={() => setSelector('criterio')}>
            <Text style={styles.selectText}>{CRITERIOS.find((item) => item.value === criterio)?.label}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, (cargando || sinTerminales) && styles.buttonDisabled]}
            onPress={buscar}
            disabled={cargando || sinTerminales}
          >
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Buscar ruta</Text>}
          </Pressable>
        </View>

        {cargando && <Text style={styles.status}>Buscando la mejor conexión...</Text>}
        {!!error && <Text style={[styles.status, styles.error, styles.errorText]}>{error}</Text>}
        {buscado && !ruta && !error && <Text style={[styles.status, styles.empty]}>No existe una conexión válida para esos datos. Prueba con otra hora o criterio.</Text>}

        {ruta && (
          <>
            {rutaCoordenadas.length > 0 && (MAPA_DISPONIBLE ? (
              <View style={styles.mapCard}>
                <MapView
                  style={styles.map}
                  initialRegion={regionMapa}
                  mapType="standard"
                >
                  {terminales.map((terminal) => (
                    <Marker key={terminal.nombre} coordinate={{ latitude: terminal.lat, longitude: terminal.lng }} title={terminal.nombre} />
                  ))}
                  {rutaCoordenadas.length > 1 && <Polyline coordinates={rutaCoordenadas} strokeColor="#c8102e" strokeWidth={5} />}
                </MapView>
              </View>
            ) : (
              <Text style={[styles.status, styles.empty]}>
                Mapa no disponible: este APK se compiló sin GOOGLE_MAPS_API_KEY. El itinerario se muestra abajo.
              </Text>
            ))}

            {ruta.tramos.map((tramo, index) => (
              <View key={`${tramo.desde}-${tramo.hasta}-${index}`} style={styles.routeCard}>
                <Text style={styles.cooperative}>Cooperativa {tramo.cooperativa}</Text>
                {!!tramo.nombreRuta && <Text style={styles.routeName}>{tramo.nombreRuta}</Text>}
                <Text style={styles.routeTitle}>{tramo.desde} → {tramo.hasta}</Text>
                <Text style={styles.routeTime}>Sale {horaConDia(tramo.salida)} · Llega {horaConDia(tramo.llegada)}</Text>
                {!!tramo.cantones?.length && <Text style={styles.cantons}>Cantones: {tramo.cantones.join(', ')}</Text>}
              </View>
            ))}

            <View style={styles.summary}>
              <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{ruta.transbordos}</Text><Text style={styles.summaryLabel}>Transbordos</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{minutos(ruta.esperaTotalMin)}</Text><Text style={styles.summaryLabel}>Espera</Text></View>
              <View style={styles.summaryItem}><Text style={styles.summaryNumber}>{minutos(ruta.duracionViajeMin)}</Text><Text style={styles.summaryLabel}>Duración</Text></View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal transparent visible={selector !== null} animationType="fade" onRequestClose={() => setSelector(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelector(null)}>
          <View style={styles.modalCard}>
            <ScrollView>
              {opciones.map((opcion) => (
                <Pressable key={opcion.value} style={styles.option} onPress={() => seleccionar(opcion.value)}>
                  <Text style={styles.optionText}>{opcion.nombre}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#0a2364', paddingBottom: 18, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, elevation: 3, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8 },
  label: { color: '#475569', fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  select: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', height: 46, justifyContent: 'center', paddingHorizontal: 12 },
  selectText: { color: '#1e293b', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  button: { marginTop: 18, height: 48, borderRadius: 10, backgroundColor: '#c8102e', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  status: { marginVertical: 7, padding: 12, borderRadius: 12, backgroundColor: '#e0e7ff', color: '#3730a3', textAlign: 'center' },
  error: { backgroundColor: '#fee2e2' },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  errorDetail: { color: '#7f1d1d', fontSize: 12, textAlign: 'center', marginTop: 6 },
  retryButton: { alignSelf: 'center', marginTop: 10, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#b91c1c' },
  retryText: { color: '#fff', fontWeight: '700' },
  empty: { backgroundColor: '#fffbeb', color: '#92400e' },
  mapCard: { height: 230, marginTop: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' },
  map: { flex: 1 },
  routeCard: { marginTop: 12, backgroundColor: '#fff', borderRadius: 14, padding: 15, borderLeftWidth: 5, borderLeftColor: '#c8102e', elevation: 2 },
  cooperative: { color: '#64748b', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  routeName: { color: '#334155', marginTop: 3, fontWeight: '600' },
  routeTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginTop: 5 },
  routeTime: { color: '#475569', marginTop: 5 },
  cantons: { color: '#64748b', fontSize: 12, marginTop: 8 },
  summary: { marginTop: 12, backgroundColor: '#0a2364', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNumber: { color: '#fff', fontWeight: '800', fontSize: 15 },
  summaryLabel: { color: '#dbeafe', fontSize: 11, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, maxHeight: '70%', overflow: 'hidden' },
  option: { paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  optionText: { color: '#1e293b', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, height: 46, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#fff', color: '#1e293b' },
});
