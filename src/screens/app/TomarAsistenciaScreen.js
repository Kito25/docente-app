// TomarAsistenciaScreen.js — Pantalla para tomar lista de un curso
// Muestra todos los alumnos del curso y permite marcarlos presente/ausente
// con un simple toque. Por defecto todos arrancan como ausentes.
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

export default function TomarAsistenciaScreen({ navigation, route }) {
  const { curso, fecha } = route.params;

  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({}); // { alumno_id: true/false }
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [yaGuardada, setYaGuardada] = useState(false); // si ya se tomó hoy

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);

    // Traemos los alumnos del curso
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
    // Esto evita que el docente tome lista dos veces el mismo día
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
        mapa[a.alumno_id] = a.presente;
      });
      setAsistencias(mapa);
    } else {
      // No hay asistencia aún — todos arrancan como ausentes por defecto
      const mapaInicial = {};
      alumnosData.forEach((a) => {
        mapaInicial[a.id] = false;
      });
      setAsistencias(mapaInicial);
    }

    setLoading(false);
  };

  // Alterna entre presente y ausente al tocar un alumno
  const toggleAsistencia = (alumnoId) => {
    if (yaGuardada) return; // no permitimos editar si ya está guardada
    setAsistencias((prev) => ({
      ...prev,
      [alumnoId]: !prev[alumnoId],
    }));
  };

  const guardarAsistencia = async () => {
    setGuardando(true);

    // Construimos el array de registros a insertar
    // uno por cada alumno con su estado de asistencia
    const registros = alumnos.map((alumno) => ({
      alumno_id: alumno.id,
      curso_id: curso.id,
      fecha: fecha,
      presente: asistencias[alumno.id] ?? false,
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

  // Contamos presentes para mostrar un resumen al docente
  const presentes = Object.values(asistencias).filter(Boolean).length;
  const ausentes = alumnos.length - presentes;

  const renderAlumno = ({ item, index }) => {
    const estaPresente = asistencias[item.id] ?? false;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          estaPresente ? styles.cardPresente : styles.cardAusente,
        ]}
        onPress={() => toggleAsistencia(item.id)}
        activeOpacity={yaGuardada ? 1 : 0.7}
      >
        <View style={styles.numero}>
          <Text style={styles.numeroText}>{index + 1}</Text>
        </View>
        <Text style={styles.cardNombre}>
          {item.apellido}, {item.nombre}
        </Text>
        {/* Indicador visual de presente/ausente */}
        <View style={[
          styles.badge,
          estaPresente ? styles.badgePresente : styles.badgeAusente,
        ]}>
          <Text style={[
            styles.badgeText,
            estaPresente ? styles.badgeTextPresente : styles.badgeTextAusente,
          ]}>
            {estaPresente ? 'P' : 'A'}
          </Text>
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

      {/* Resumen de presentes y ausentes */}
      <View style={styles.resumen}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{presentes}</Text>
          <Text style={styles.resumenLabel}>Presentes</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={[styles.resumenNumero, { color: '#EF4444' }]}>{ausentes}</Text>
          <Text style={styles.resumenLabel}>Ausentes</Text>
        </View>
        <View style={styles.resumenDivider} />
        <View style={styles.resumenItem}>
          <Text style={styles.resumenNumero}>{alumnos.length}</Text>
          <Text style={styles.resumenLabel}>Total</Text>
        </View>
      </View>

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

      {/* Botón de guardar — solo visible si no está guardada aún */}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  resumenLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  resumenDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPresente: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  cardAusente: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  cardNombre: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePresente: {
    backgroundColor: '#059669',
  },
  badgeAusente: {
    backgroundColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeTextPresente: {
    color: '#fff',
  },
  badgeTextAusente: {
    color: '#9CA3AF',
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