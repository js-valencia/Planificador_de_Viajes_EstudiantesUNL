import { useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { cuentaRegresiva, unidadesCuentaRegresiva } from './fechas';

interface Props {
  salidaIso: string;
  titulo: string;
  detalle: string;
}

export default function CuentaRegresivaSalida({ salidaIso, titulo, detalle }: Props) {
  const salidaMs = Date.parse(salidaIso);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    let id: ReturnType<typeof setTimeout> | undefined;
    const tic = () => {
      const instante = Date.now();
      setAhora(instante);
      if (cuentaRegresiva(salidaMs, instante)?.estado === 'salido') return;
      id = setTimeout(tic, 1000 - (instante % 1000));
    };
    tic();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      clearTimeout(id);
      tic();
    });
    return () => {
      clearTimeout(id);
      suscripcion.remove();
    };
  }, [salidaMs]);

  const cuenta = useMemo(() => cuentaRegresiva(salidaMs, ahora), [salidaMs, ahora]);
  if (!cuenta) return null;

  return (
    <View style={[styles.card, cuenta.estado === 'saliendo' && styles.saliendo, cuenta.estado === 'salido' && styles.salido]}>
      <Text style={[styles.titulo, cuenta.estado === 'salido' && styles.textoOscuro]}>{titulo}</Text>
      {cuenta.estado === 'pendiente' && (
        <>
          <Text style={styles.subtitulo}>Tu autobús sale en</Text>
          <View style={styles.unidades} accessibilityRole="timer">
            {unidadesCuentaRegresiva(cuenta).map((u) => (
              <View key={u.etiqueta} style={styles.unidad}>
                <Text style={styles.numero}>{u.valor}</Text>
                <Text style={styles.etiqueta}>{u.etiqueta}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      {cuenta.estado === 'saliendo' && (
        <Text style={styles.mensaje} accessibilityLiveRegion="polite">¡Es la hora de salida! Tu autobús está saliendo.</Text>
      )}
      {cuenta.estado === 'salido' && (
        <Text style={[styles.mensaje, styles.textoOscuro]} accessibilityLiveRegion="polite">Este autobús ya salió.</Text>
      )}
      <Text style={[styles.detalle, cuenta.estado === 'salido' && styles.textoOscuro]}>{detalle} · hora de Ecuador</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, backgroundColor: '#0a2364', borderRadius: 16, padding: 16, alignItems: 'center' },
  saliendo: { backgroundColor: '#059669' },
  salido: { backgroundColor: '#e2e8f0' },
  titulo: { color: '#dbeafe', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  subtitulo: { color: '#fff', fontSize: 14, marginTop: 6 },
  unidades: { flexDirection: 'row', gap: 8, marginTop: 10 },
  unidad: { minWidth: 62, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  numero: { color: '#fff', fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  etiqueta: { color: '#dbeafe', fontSize: 11, marginTop: 2 },
  mensaje: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  detalle: { color: '#dbeafe', fontSize: 12, marginTop: 10 },
  textoOscuro: { color: '#334155' },
});
