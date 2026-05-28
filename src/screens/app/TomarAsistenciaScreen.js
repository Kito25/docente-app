// TomarAsistenciaScreen.js — Pantalla para tomar lista de un curso
// Maneja tres estados de asistencia: presente, tarde y ausente.
// Cada toque en un alumno cicla entre los tres estados.
// Al guardar, verifica si ya existe asistencia para ese día y curso
// para evitar duplicados en la base de datos.

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

// Definimos los tres estados como constantes para evitar errores de tipeo
// y facilitar el mantenimiento futuro
const ESTADOS = {
  AUSENTE: 'ausente',
  TARDE: 'tarde',
  PRESENTE: 'presente',
};

// Configuración visual de cada estado
// Centralizar esto evita repetir colores y etiquetas en múltiples lugares
const CONFIG_ESTADO = {
  ausente:  { label: 'A', color: '#EF4444', bg: '#FEE2E2', texto: 'Ausente' },
  tarde:    { label: 'T', color: '#D97706', bg: '#FEF3C7', texto: 'Tarde' },
  presente: { label: 'P', color: '#059669', bg: '#ECFDF5', texto: 'Presente' },
};

export default function TomarAsistenciaScreen({ navigation, route }) {
  const { curso, fecha } = route.params;

  const [alumnos, setAlumnos] = useState([]);
  const [estados, setEstados] = useState({}); // { alumno_id: 'presente'|'tarde'|'ausente' }
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [yaGuardada, setYaGuardada] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    const { data: alumnosData, error: alumnosError } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('apellido', { ascending: true });

    if (alumnosError) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
      setLoading(false);
      return;
    }

    // Verificamos si ya existe asistencia guardada para hoy
    const { data: asistenciasData } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', curso.id)
      .eq('fecha', fecha);

    setAlumnos(alumnosData);

    if (asistenciasData && asistenciasData.length > 0) {
      // Ya hay asistencia guardada — mostramos los datos existentes
      setYaGuardada(true);
      const mapa = {};
      asistenciasData.forEach((a) => {
        // Usamos el campo estado nuevo, con fallback al campo presente viejo
        // para compatibilidad con registros anteriores a la migración
        mapa[a.alumno_id] = a.estado || (a.presente ? 'presente' : 'ausente');
      });
      setEstados(mapa);
    } else {
      // No hay asistencia aún — todos arrancan como ausentes por defecto
      const mapaInicial = {};
      alumnosData.forEach((a) => {
        mapaInicial[a.id] = ESTADOS.AUSENTE;
      });
      setEstados(mapaInicial);
    }

    setLoading(false);
  };

  // Cicla entre los tres estados al tocar un alumno:
  // ausente → presente → tarde → ausente → ...
  // Este orden tiene lógica: primero marcás presentes,
  // los que quedan ausentes los dejás, y los tardíos los marcás al final
  const toggleEstado = (alumnoId) => {
    if (yaGuardada) return;
    setEstados((prev) => {
      const estadoActual = prev[alumnoId];
      const siguiente = estadoActual === ESTADOS.AUSENTE ? ESTADOS.PRESENTE
        : estadoActual === ESTADOS.PRESENTE ? ESTADOS.TARDE
        : ESTADOS.AUSENTE;
      return { ...prev, [alumnoId]: siguiente };
    });
  };

  const guardarAsistencia = async () => {
    setGuardando(true);

    const registros = alumnos.map((alumno) => ({
      alumno_id: alumno.id,
      curso_id: curso.id,
      fecha: fecha,
      estado: estados[alumno.id] ?? ESTADOS.AUSENTE,
      // Mantenemos el campo presente por compatibilidad con el PDF y otras pantallas
      presente: estados[alumno.id] === ESTADOS.PRESENTE,
    }));

    const { error } = await supabase
      .from('asistencias')
      .insert(registros);

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar la asistencia');
      return;
    }

    setYaGuardada(true);
    Alert.alert('¡Listo!', 'Asistencia guardada correctamente');
  };

  // Contamos cada estado para el resumen
  const contarEstado = (estado) =>
    Object.values(estados).filter((e) => e === estado).length;

  const renderAlumno = ({ item, index }) => {
    const estadoActual = estados[item.id] ?? ESTADOS.AUSENTE;
    const config = CONFIG_ESTADO[estadoActual];

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: config.bg, borderColor: config.color + '40' }]}
        onPress={() => toggleEstado(item.id)}
        activeOpacity={yaGuardada ? 1 : 0.7}
      >
        <View style={styles.numero}>
          <Text style={styles.numeroText}>{index + 1}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{item.apellido}, {item.nombre}</Text>
          {/* Mostramos el estado en texto para mayor claridad */}
          <Text style={[styles.cardEstado, { color: config.color }]}>
            {config.texto}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.titulo}>{curso.nombre}</Text>
          <Text style={styles.subtitulo}>{curso.materia}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Resumen de los tres estados */}
      <View style={styles.resumen}>
        <View style={styles.resumenItem}>
          <Text style={[styles.resumenNumero, { color: '#059669' }]}>
            {contarEstado(ESTADOS.PRESENTE)}
          </Text>
          <Text style={styles.resumenLabel}>Presentes</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={[styles.resumenNumero, { color: '#D97706' }]}>
            {contarEstado(ESTADOS.TARDE)}
          </Text>
          <Text style={styles.resumenLabel}>Tarde</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={[styles.resumenNumero, { color: '#EF4444' }]}>
            {contarEstado(ESTADOS.AUSENTE)}
          </Text>
          <Text style={styles.resumenLabel}>Ausentes</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{alumnos.length}</Text>
          <Text style={styles.resumenLabel}>Total</Text>
        </View>
      </View>

      {/* Instrucción de uso */}
      {!yaGuardada && (
        <View style={styles.instruccionBanner}>
          <Text style={styles.instruccionText}>
            Tocá para ciclar: Ausente → Presente → Tarde
          </Text>
        </View>
      )}

      {yaGuardada && (
        <View style={styles.guardadaBanner}>
          <Text style={styles.guardadaText}>✓ Asistencia ya guardada para hoy</Text>
        </View>
      )}

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

      {!yaGuardada && alumnos.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.guardarBtn, guardando && styles.buttonDisabled]}
            onPress={guardarAsistencia}
            disabled={guardando}
          >
            {guardando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.guardarBtnText}>Guardar asistencia</Text>
            }
          </TouchableOpacity>
        </View>
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
  resumen: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resumenItem: {
    flex: 1,
    alignItems: 'center',
  },
  resumenNumero: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  resumenLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  resumenDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  instruccionBanner: {
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  instruccionText: {
    fontSize: 13,
    color: '#4338CA',
    textAlign: 'center',
  },
  guardadaBanner: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  guardadaText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  lista: {
    padding: 16,
  },
  card: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numeroText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardInfo: {
    flex: 1,
  },
  cardNombre: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  cardEstado: {
    fontSize: 12,
    fontWeight: '500',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  guardarBtn: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  guardarBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});