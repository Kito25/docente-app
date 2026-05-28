// HistorialAsistenciaScreen.js — Historial de asistencia por curso
// Muestra estadísticas de asistencia de cada alumno:
// presentes, ausentes y porcentaje total.
// Permite identificar rápidamente alumnos con bajo porcentaje de asistencia.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { obtenerConfiguracion, calcularEstadisticas } from '../../lib/calcularAsistencia';

export default function HistorialAsistenciaScreen({ navigation, route }) {
  const { curso } = route.params;

  const [alumnos, setAlumnos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalClases, setTotalClases] = useState(0);

  // useFocusEffect recarga los datos cada vez que volvemos a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    setLoading(true);

    // Obtenemos la configuración del docente antes de calcular
    const config = await obtenerConfiguracion();

    const { data: alumnosData, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('apellido', { ascending: true });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
      setLoading(false);
      return;
    }

    const { data: asistenciasData } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', curso.id);

    const fechasUnicas = asistenciasData
      ? [...new Set(asistenciasData.map((a) => a.fecha))]
      : [];
    setTotalClases(fechasUnicas.length);

    // Usamos la función utilitaria para calcular estadísticas
    // pasando la configuración del docente
    const mapaEstadisticas = {};
    alumnosData.forEach((alumno) => {
      const asistenciasAlumno = asistenciasData
        ? asistenciasData.filter((a) => a.alumno_id === alumno.id)
        : [];
      mapaEstadisticas[alumno.id] = calcularEstadisticas(asistenciasAlumno, config);
    });

    setAlumnos(alumnosData);
    setEstadisticas(mapaEstadisticas);
    setLoading(false);
  };

  // Color del porcentaje según umbral de asistencia
  // 75% es el umbral común en instituciones educativas argentinas
  const colorPorcentaje = (p) => {
    if (p === null) return '#9CA3AF';
    if (p >= 75) return '#059669';
    if (p >= 50) return '#D97706';
    return '#EF4444';
  };

  const renderAlumno = ({ item, index }) => {
    const stats = estadisticas[item.id] || {
      presentes: 0, tardes: 0, tardesRestantes: 0,
      ausentesReales: 0, inasistenciasTotal: 0, porcentaje: null
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.numero}>
            <Text style={styles.numeroText}>{index + 1}</Text>
          </View>
          <Text style={styles.cardNombre}>{item.apellido}, {item.nombre}</Text>
          <View style={[
            styles.badge,
            { backgroundColor: colorPorcentaje(stats.porcentaje) + '20' }
          ]}>
            <Text style={[styles.badgeText, { color: colorPorcentaje(stats.porcentaje) }]}>
              {stats.porcentaje !== null ? `${stats.porcentaje}%` : 'S/D'}
            </Text>
          </View>
        </View>

        {stats.porcentaje !== null && (
          <View style={styles.barraContainer}>
            <View style={styles.barraFondo}>
              <View style={[
                styles.barraRelleno,
                {
                  width: `${stats.porcentaje}%`,
                  backgroundColor: colorPorcentaje(stats.porcentaje),
                }
              ]} />
            </View>
          </View>
        )}

        <View style={styles.detalle}>
          <View style={styles.detalleItem}>
            <Text style={[styles.detalleNumero, { color: '#059669' }]}>{stats.presentes}</Text>
            <Text style={styles.detalleLabel}>Presentes</Text>
          </View>
          <View style={styles.detalleDivider} />
          <View style={styles.detalleItem}>
            <Text style={[styles.detalleNumero, { color: '#D97706' }]}>{stats.tardes}</Text>
            <Text style={styles.detalleLabel}>Tardes</Text>
          </View>
          <View style={styles.detalleDivider} />
          <View style={styles.detalleItem}>
            <Text style={[styles.detalleNumero, { color: '#EF4444' }]}>{stats.inasistenciasTotal}</Text>
            <Text style={styles.detalleLabel}>Inasist.</Text>
          </View>
          <View style={styles.detalleDivider} />
          <View style={styles.detalleItem}>
            <Text style={styles.detalleNumero}>{totalClases}</Text>
            <Text style={styles.detalleLabel}>Clases</Text>
          </View>
        </View>

        {/* Mostramos la conversión de tardanzas solo si tiene tardanzas */}
        {stats.tardes > 0 && (
          <View style={styles.tardanzaInfo}>
            <Text style={styles.tardanzaTexto}>
              {stats.tardes} tarde{stats.tardes > 1 ? 's' : ''} →{' '}
              {stats.inasistenciasPorTardes > 0
                ? `${stats.inasistenciasPorTardes} inasist. + ${stats.tardesRestantes} tarde${stats.tardesRestantes !== 1 ? 's' : ''} pendiente${stats.tardesRestantes !== 1 ? 's' : ''}`
                : `${stats.tardesRestantes} tarde${stats.tardesRestantes !== 1 ? 's' : ''} pendiente${stats.tardesRestantes !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.titulo}>Historial</Text>
          <Text style={styles.subtitulo}>{curso.nombre} — {curso.materia}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Banner informativo con el umbral de asistencia */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          🟢 75% o más · 🟡 50% a 74% · 🔴 Menos del 50%
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      ) : (
        <FlatList
          data={alumnos}
          renderItem={renderAlumno}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay alumnos en este curso</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
    width: 60,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitulo: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  infoBanner: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  lista: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numeroText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  cardNombre: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 52,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barraContainer: {
    marginBottom: 12,
  },
  barraFondo: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: 6,
    borderRadius: 3,
  },
  detalle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detalleItem: {
    alignItems: 'center',
  },
  detalleNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  detalleLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  detalleDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  loader: {
    marginTop: 60,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  tardanzaInfo: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
  },
  tardanzaTexto: {
    fontSize: 12,
    color: '#D97706',
    textAlign: 'center',
  },
});