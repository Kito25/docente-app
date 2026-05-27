// CalificacionesScreen.js — Pantalla principal del módulo de calificaciones
// Muestra los cursos del docente para seleccionar en cuál cargar notas.
// El flujo es: seleccionar curso → ver alumnos → seleccionar alumno → cargar nota

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

export default function CalificacionesScreen({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los cursos');
    } else {
      setCursos(data);
    }

    setLoading(false);
  };

  const renderCurso = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AlumnosCalificaciones', { curso: item })}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardNombre}>{item.nombre}</Text>
        <Text style={styles.cardMateria}>{item.materia}</Text>
      </View>
      <Text style={styles.cardArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Calificaciones</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.instruccion}>Seleccioná un curso para ver las notas</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={styles.loader} />
      ) : (
        <FlatList
          data={cursos}
          renderItem={renderCurso}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tenés cursos creados</Text>
              <Text style={styles.emptySubtext}>Creá un curso primero desde "Mis Cursos"</Text>
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
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  instruccion: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  lista: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
  },
  cardNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardMateria: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardArrow: {
    fontSize: 24,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});