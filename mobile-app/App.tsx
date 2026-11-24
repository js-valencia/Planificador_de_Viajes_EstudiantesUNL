import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { buscarRuta, obtenerTerminales, Ruta, Terminal } from './src/api';

const CRITERIOS = [
  { value: 'tiempo', label: 'Menor tiempo total' },
  { value: 'espera', label: 'Menor tiempo de espera' },
  { value: 'conexiones', label: 'Menos conexiones' },
];

export default function App() {
  const [terminales, setTerminales] = useState<Terminal[]>([]);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [fecha, setFecha] = useState('2026-11-02');
  const [hora, setHora] = useState('06:30');
  const [criterio, setCriterio] = useState('tiempo');
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [buscado, setBuscado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [selector, setSelector] = useState<'origen' | 'destino' | 'criterio' | null>(null);

  useEffect(() => {
    obtenerTerminales()
      .then((datos) => {
        setTerminales(datos.terminales);
        setOrigen(datos.terminales.find((t) => t.nombre === 'Catamayo')?.nombre ?? datos.terminales[0]?.nombre ?? '');
        setDestino(datos.terminales.find((t) => t.nombre === 'Loja')?.nombre ?? datos.terminales[1]?.nombre ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor'));
  }, []);

  const coordenadas = useMemo(() => terminales.map((t) => ({ latitude: t.lat, longitude: t.lng })), [terminales]);
  const rutaCoordenadas = useMemo(() => {
    if (!ruta) return [];
    const puntos: { latitude: number; longitude: number }[] = [];
    ruta.tramos.forEach((tramo) => {
      const desde = terminales.find((t) => t.nombre === tramo.desde);
      const hasta = terminales.find((t) => t.nombre === tramo.hasta);
      if (desde) puntos.push({ latitude: desde.lat, longitude: desde.lng });
      if (hasta) puntos.push({ latitude: hasta.lat, longitude: hasta.lng });
    });
    return puntos;
  }, [ruta, terminales]);

  async function buscar() {
    setError('');
    setBuscado(false);
    setRuta(null);
    if (!origen || !destino) return setError('Selecciona un origen y un destino válidos.');
    if (origen === destino) return setError('El origen y el destino deben ser distintos.');

    setCargando(true);
    try {
      const resultado = await buscarRuta({
        origen,
        destino,
        desde: `${fecha}T${hora}:00-05:00`,
        criterio,
      });
      setRuta(resultado);
      setBuscado(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el servidor');
      setBuscado(true);
    } finally {
      setCargando(false);
    }
  }

  function hora12(valor: string) {
    const fechaHora = new Date(valor);
    return new Intl.DateTimeFormat('es-EC', { hour: 'numeric', minute: '2-digit', hour12: true }).format(fechaHora);
  }

  function minutos(valor: number) {
    return `${Math.round(valor)} min`;
  }

  const opciones = selector === 'criterio'
    ? CRITERIOS.map((item) => ({ nombre: item.label, value: item.value }))
    : terminales.map((item) => ({ nombre: item.nombre, value: item.nombre }));

  function seleccionar(value: string) {
    if (selector === 'origen') setOrigen(value);
    if (selector === 'destino') setDestino(value);
    if (selector === 'criterio') setCriterio(value);
    setSelector(null);
  }

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.header}><Text style={styles.headerTitle}>Planificador de viajes</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Origen</Text>
          <Pressable style={styles.select} onPress={() => setSelector('origen')}><Text style={styles.selectText}>{origen || 'Seleccionar'}</Text></Pressable>

          <Text style={styles.label}>Destino</Text>
          <Pressable style={styles.select} onPress={() => setSelector('destino')}><Text style={styles.selectText}>{destino || 'Seleccionar'}</Text></Pressable>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Fecha</Text>
              <TextInput style={styles.input} value={fecha} onChangeText={setFecha} placeholder="AAAA-MM-DD" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Hora</Text>
              <TextInput style={styles.input} value={hora} onChangeText={setHora} placeholder="HH:MM" />
            </View>
          </View>

          <Text style={styles.label}>Prefiero</Text>
          <Pressable style={styles.select} onPress={() => setSelector('criterio')}>
            <Text style={styles.selectText}>{CRITERIOS.find((item) => item.value === criterio)?.label}</Text>
          </Pressable>

          <Pressable style={[styles.button, cargando && styles.buttonDisabled]} onPress={buscar} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Buscar ruta</Text>}
          </Pressable>
        </View>

        {cargando && <Text style={styles.status}>Buscando la mejor conexión...</Text>}
        {!!error && <Text style={[styles.status, styles.error]}>{error}</Text>}
        {buscado && !ruta && !error && <Text style={[styles.status, styles.empty]}>No existe una conexión válida para esos datos. Prueba con otra hora o criterio.</Text>}

        {ruta && (
          <>
            {coordenadas.length > 0 && (
              <View style={styles.mapCard}>
                <MapView
                  style={styles.map}
                  initialRegion={{ latitude: origen === 'Loja' ? -3.9775779 : -4.05, longitude: origen === 'Loja' ? -79.2050981 : -79.35, latitudeDelta: 1.1, longitudeDelta: 1.1 }}
                  mapType="standard"
                >
                  {terminales.map((terminal) => (
                    <Marker key={terminal.nombre} coordinate={{ latitude: terminal.lat, longitude: terminal.lng }} title={terminal.nombre} />
                  ))}
                  {rutaCoordenadas.length > 1 && <Polyline coordinates={rutaCoordenadas} strokeColor="#c8102e" strokeWidth={5} />}
                </MapView>
              </View>
            )}

            {ruta.tramos.map((tramo, index) => (
              <View key={`${tramo.desde}-${tramo.hasta}-${index}`} style={styles.routeCard}>
                <Text style={styles.cooperative}>Cooperativa {tramo.cooperativa}</Text>
                {tramo.nombreRuta && <Text style={styles.routeName}>{tramo.nombreRuta}</Text>}
                <Text style={styles.routeTitle}>{tramo.desde} → {tramo.hasta}</Text>
                <Text style={styles.routeTime}>Sale {hora12(tramo.salida)} · Llega {hora12(tramo.llegada)}</Text>
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
            {opciones.map((opcion) => (
              <Pressable key={opcion.value} style={styles.option} onPress={() => seleccionar(opcion.value)}>
                <Text style={styles.optionText}>{opcion.nombre}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#0a2364', paddingTop: 58, paddingBottom: 18, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, elevation: 3, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8 },
  label: { color: '#475569', fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  select: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', height: 46, justifyContent: 'center', paddingHorizontal: 12 },
  selectText: { color: '#1e293b', fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  readOnly: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, height: 46, justifyContent: 'center', paddingHorizontal: 12 },
  button: { marginTop: 18, height: 48, borderRadius: 10, backgroundColor: '#c8102e', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  status: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#e0e7ff', color: '#3730a3', textAlign: 'center' },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c' },
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
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, height: 46, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#fff', marginTop: 6 },
});
