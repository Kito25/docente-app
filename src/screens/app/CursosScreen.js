// CursosScreen.js — Pantalla de lista de cursos
// Muestra todos los cursos del docente logueado.
// Permite crear nuevos cursos y acceder a los alumnos de cada uno.
// Los cursos se traen desde Supabase filtrando por el docente actual,
// gracias a las políticas RLS que configuramos al inicio.

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CursosScreen({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controla si el modal para crear curso está visible
  const [modalVisible, setModalVisible] = useState(false);

  // Campos del formulario para crear un curso nuevo
  const [nombreCurso, setNombreCurso] = useState('');
  const [materiaCurso, setMateriaCurso] = useState('');
  const [guardando, setGuardando] = useState(false);

  // useEffect se ejecuta una vez al montar el componente
  // Es el lugar correcto para cargar datos iniciales
  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    setLoading(true);

    // Traemos solo los cursos del docente logueado
    // Supabase aplica automáticamente el filtro RLS,
    // por lo que no necesitamos filtrar manualmente por docente_id
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false }); // más recientes primero

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los cursos');
    } else {
      setCursos(data);
    }

    setLoading(false);
  };

  const crearCurso = async () => {
    if (!nombreCurso || !materiaCurso) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }

    setGuardando(true);

    // Obtenemos el ID del docente logueado para asociarlo al curso
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('cursos')
      .insert({
        nombre: nombreCurso.trim(),
        materia: materiaCurso.trim(),
        docente_id: user.id, // vinculamos el curso al docente actual
      });

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo crear el curso');
      return;
    }

    // Limpiamos el formulario y cerramos el modal
    setNombreCurso('');
    setMateriaCurso('');
    setModalVisible(false);

    // Recargamos la lista para mostrar el curso nuevo
    cargarCursos();
  };

  // Componente que representa cada tarjeta de curso en la lista
  const renderCurso = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Alumnos', { curso: item })}
      // Pasamos el objeto curso completo a la pantalla de alumnos
      // para no tener que volver a buscarlo en la base de datos
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

      {/* Encabezado con botón de volver */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Mis Cursos</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de cursos — FlatList es más eficiente que ScrollView
          para listas largas porque solo renderiza los elementos visibles */}
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <FlatList
          data={cursos}
          renderItem={renderCurso}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            // Mensaje cuando no hay cursos todavía
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tenés cursos aún</Text>
              <Text style={styles.emptySubtext}>Tocá "+ Nuevo" para crear tu primer curso</Text>
            </View>
          }
        />
      )}

      {/* Modal para crear curso nuevo
          Un Modal flota sobre la pantalla actual sin cambiar de ruta */}
      <Modal
        visible={modalVisible}
        transparent={true} // fondo semitransparente
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Nuevo curso</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del curso (ej: 3° A)"
              placeholderTextColor="#9CA3AF"
              value={nombreCurso}
              onChangeText={setNombreCurso}
            />

            <TextInput
              style={styles.input}
              placeholder="Materia (ej: Matemática)"
              placeholderTextColor="#9CA3AF"
              value={materiaCurso}
              onChangeText={setMateriaCurso}
            />

            <TouchableOpacity
              style={[styles.button, guardando && styles.buttonDisabled]}
              onPress={crearCurso}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Crear curso</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    color: '#4F46E5',
    fontWeight: '500',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  lista: {
    padding: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // el modal sube desde abajo, más natural en mobile
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 16,
  },
});