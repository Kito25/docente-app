// AlumnosCalificacionesScreen.js — Lista de alumnos para ver/cargar notas
// Muestra cada alumno con su promedio actual calculado en tiempo real.
// Al tocar un alumno se accede a sus calificaciones detalladas.

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

export default function AlumnosCalificacionesScreen({ navigation, route }) {
  const { curso } = route.params;
  const [alumnos, setAlumnos] = useState([]);
  const [promedios, setPromedios] = useState({}); // { alumno_id: promedio }
  const [loading, setLoading] = useState(true);

  // useFocusEffect recarga los datos cada vez que volvemos a esta pantalla
  // Esto es importante para que el promedio se actualice después de cargar una nota
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    setLoading(true);

    // Traemos alumnos del curso
    const { data: alumnosData, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('apellido', { ascending: true });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
      setLoading(false);
      return;
    }

    // Traemos todas las calificaciones del curso de una sola consulta
    // Es más eficiente que hacer una consulta por cada alumno
    const { data: calificacionesData } = await supabase
      .from('calificaciones')
      .select('alumno_id, nota')
      .eq('curso_id', curso.id);

    // Calculamos el promedio por alumno en el cliente
    // Agrupamos las notas por alumno_id y calculamos el promedio
    const mapaPromedios = {};
    if (calificacionesData) {
      alumnosData.forEach((alumno) => {
        const notasAlumno = calificacionesData
          .filter((c) => c.alumno_id === alumno.id)
          .map((c) => c.nota);

        if (notasAlumno.length > 0) {
          const suma = notasAlumno.reduce((acc, nota) => acc + nota, 0);
          mapaPromedios[alumno.id] = (suma / notasAlumno.length).toFixed(1);
        } else {
          mapaPromedios[alumno.id] = null; // sin notas aún
        }
      });
    }

    setAlumnos(alumnosData);
    setPromedios(mapaPromedios);
    setLoading(false);
  };

  // Determinamos el color del promedio según la nota
  // Convención escolar argentina: 7+ aprobado, menos de 7 desaprobado
  const colorPromedio = (promedio) => {
    if (!promedio) return '#9CA3AF';
    if (promedio >= 7) return '#059669';
    if (promedio >= 4) return '#D97706';
    return '#EF4444';
  };

  const renderAlumno = ({ item, index }) => {
    const promedio = promedios[item.id];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CargarNota', {
          alumno: item,
          curso: curso,
        })}
      >
        <View style={styles.numero}>
          <Text style={styles.numeroText}>{index + 1}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre}>{item.apellido}, {item.nombre}</Text>
          <Text style={styles.cardSub}>
            {promedio ? `Promedio: ${promedio}` : 'Sin calificaciones aún'}
          </Text>
        </View>
        {/* Badge con el promedio coloreado */}
        <View style={[styles.badge, { backgroundColor: colorPromedio(promedio) + '20' }]}>
          <Text style={[styles.badgeText, { color: colorPromedio(promedio) }]}>
            {promedio ?? '-'}
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

      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={styles.loader} />
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
    color: '#D97706',
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
  lista: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
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
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  numeroText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  cardInfo: {
    flex: 1,
  },
  cardNombre: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 13,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 48,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 15,
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
});