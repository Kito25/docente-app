// HomeScreen.js — Pantalla principal de la app
// Muestra un dashboard con estadísticas reales del docente
// y los accesos a los módulos principales.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { obtenerConfiguracion, calcularEstadisticas } from '../../lib/calcularAsistencia';

export default function HomeScreen({ navigation }) {
  const [nombreDocente, setNombreDocente] = useState('Docente');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // useFocusEffect recarga las estadísticas cada vez que volvemos al Home
  // así los números siempre están actualizados
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    setLoadingStats(true);

    // Obtenemos el nombre del docente logueado
    const { data: { user } } = await supabase.auth.getUser();
    setNombreDocente(user?.user_metadata?.nombre_completo || 'Docente');

    const config = await obtenerConfiguracion();

    // Traemos todos los cursos del docente
    const { data: cursos } = await supabase
      .from('cursos')
      .select('id');

    if (!cursos || cursos.length === 0) {
      setStats({ cursos: 0, alumnos: 0, enAlerta: 0, promedio: null });
      setLoadingStats(false);
      return;
    }

    const cursoIds = cursos.map((c) => c.id);

    // Traemos alumnos, asistencias y calificaciones en paralelo
    // Promise.all ejecuta las tres consultas al mismo tiempo, más eficiente
    const [alumnosRes, asistenciasRes, calificacionesRes] = await Promise.all([
      supabase.from('alumnos').select('id').in('curso_id', cursoIds),
      supabase.from('asistencias').select('alumno_id, curso_id, estado, presente').in('curso_id', cursoIds),
      supabase.from('calificaciones').select('nota').in('curso_id', cursoIds),
    ]);

    const alumnos = alumnosRes.data || [];
    const asistencias = asistenciasRes.data || [];
    const calificaciones = calificacionesRes.data || [];

    // Calculamos cuántos alumnos están en alerta
    let enAlerta = 0;
    alumnos.forEach((alumno) => {
      const asistenciasAlumno = asistencias.filter((a) => a.alumno_id === alumno.id);
      const estadisticas = calcularEstadisticas(asistenciasAlumno, config);
      if (estadisticas.enAlerta) enAlerta++;
    });

    // Contamos el total de clases únicas tomadas en todos los cursos
const fechasUnicas = asistenciasRes.data
  ? [...new Set(asistenciasRes.data.map((a) => `${a.curso_id}_${a.fecha ?? ''}`))].length
  : 0;

setStats({
  cursos: cursos.length,
  alumnos: alumnos.length,
  enAlerta,
  clases: fechasUnicas,
});

    setLoadingStats(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const modulos = [
    {
      id: 1,
      titulo: 'Mis Cursos',
      descripcion: 'Gestioná tus cursos y alumnos',
      icono: '📚',
      color: '#4F46E5',
      pantalla: 'Cursos',
    },
    {
      id: 2,
      titulo: 'Asistencia',
      descripcion: 'Tomá lista y revisá el historial',
      icono: '✅',
      color: '#059669',
      pantalla: 'Asistencia',
    },
    {
      id: 3,
      titulo: 'Calificaciones',
      descripcion: 'Cargá notas y consultá promedios',
      icono: '📝',
      color: '#D97706',
      pantalla: 'Calificaciones',
    },
    {
      id: 4,
      titulo: 'Exportar PDF',
      descripcion: 'Generá reportes de notas y asistencia',
      icono: '📄',
      color: '#7C3AED',
      pantalla: 'ExportarPDF',
    },
    {
      id: 5,
      titulo: 'Configuración',
      descripcion: 'Personalizá las reglas de tu institución',
      icono: '⚙️',
      color: '#6B7280',
      pantalla: 'Configuracion',
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Encabezado */}
      <View style={styles.header}>
  <View style={styles.headerLeft}>
    <Text style={styles.saludo}>¡Hola, {nombreDocente}! 👋</Text>
    <Text style={styles.fecha}>{new Date().toLocaleDateString('es-AR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })}</Text>
  </View>
  <View style={styles.headerBotones}>
    <TouchableOpacity
      style={styles.perfilBtn}
      onPress={() => navigation.navigate('Perfil')}
    >
      <Text style={styles.perfilBtnText}>👤</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
      <Text style={styles.logoutText}>Salir</Text>
    </TouchableOpacity>
  </View>
</View>

      {/* Dashboard de estadísticas */}
      {loadingStats ? (
        <ActivityIndicator color="#4F46E5" style={styles.loader} />
      ) : stats && stats.cursos > 0 ? (
        <View style={styles.dashboard}>
          <Text style={styles.dashboardTitulo}>Resumen general</Text>
          <View style={styles.statsGrid}>

            <View style={styles.statCard}>
              <Text style={styles.statNumero}>{stats.cursos}</Text>
              <Text style={styles.statLabel}>Cursos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumero}>{stats.alumnos}</Text>
              <Text style={styles.statLabel}>Alumnos</Text>
            </View>

            <View style={[styles.statCard, stats.enAlerta > 0 && styles.statCardAlerta]}>
              <Text style={[styles.statNumero, stats.enAlerta > 0 && styles.statNumeroAlerta]}>
                {stats.enAlerta}
              </Text>
              <Text style={[styles.statLabel, stats.enAlerta > 0 && styles.statLabelAlerta]}>
                En alerta
              </Text>
            </View>

            <View style={styles.statCard}>
  <Text style={styles.statNumero}>{stats.clases}</Text>
  <Text style={styles.statLabel}>Clases{'\n'}tomadas</Text>
</View>

          </View>

          {/* Banner de alerta si hay alumnos en riesgo */}
          {stats.enAlerta > 0 && (
            <View style={styles.alertaBanner}>
              <Text style={styles.alertaTexto}>
                ⚠️ {stats.enAlerta} {stats.enAlerta === 1 ? 'alumno supera' : 'alumnos superan'} el límite de inasistencias
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Módulos */}
      <Text style={styles.sectionTitle}>¿Qué querés hacer hoy?</Text>

      {modulos.map((modulo) => (
        <TouchableOpacity
          key={modulo.id}
          style={[styles.card, { borderLeftColor: modulo.color }]}
          onPress={() => navigation.navigate(modulo.pantalla)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardIcono}>{modulo.icono}</Text>
          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo}>{modulo.titulo}</Text>
            <Text style={styles.cardDescripcion}>{modulo.descripcion}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  saludo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  fecha: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginVertical: 20,
  },
  dashboard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dashboardTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  statCardAlerta: {
    backgroundColor: '#FEF2F2',
  },
  statNumero: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statNumeroAlerta: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  statLabelAlerta: {
    color: '#EF4444',
  },
  alertaBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  alertaTexto: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcono: {
    fontSize: 32,
    marginRight: 16,
  },
  cardTexto: {
    flex: 1,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescripcion: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  headerLeft: {
  flex: 1,
},
headerBotones: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
perfilBtn: {
  backgroundColor: '#EEF2FF',
  width: 38,
  height: 38,
  borderRadius: 19,
  justifyContent: 'center',
  alignItems: 'center',
},
perfilBtnText: {
  fontSize: 18,
},
});