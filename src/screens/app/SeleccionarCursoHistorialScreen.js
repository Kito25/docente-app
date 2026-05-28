// SeleccionarCursoHistorialScreen.js — Selección de curso para ver historial
// Pantalla intermedia que permite elegir el curso
// antes de ver el historial de asistencia detallado.

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

export default function SeleccionarCursoHistorialScreen({ navigation }) {
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
      onPress={() => navigation.navigate('HistorialAsistencia', { curso: item })}
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
        <Text style={styles.titulo}>Historial de asistencia</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.instruccion}>Seleccioná un curso para ver el historial</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      ) : (
        <FlatList
          data={cursos}
          renderItem={renderCurso}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tenés cursos creados</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backBtn: { fontSize: 16, color: '#059669', fontWeight: '500', width: 60 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  instruccion: { fontSize: 14, color: '#6B7280', paddingHorizontal: 20, paddingVertical: 16 },
  lista: { paddingHorizontal: 20 },
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
  cardLeft: { flex: 1 },
  cardNombre: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardMateria: { fontSize: 14, color: '#6B7280' },
  cardArrow: { fontSize: 24, color: '#9CA3AF' },
  loader: { marginTop: 60 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, color: '#6B7280' },
});