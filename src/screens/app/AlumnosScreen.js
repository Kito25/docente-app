// AlumnosScreen.js — Pantalla de alumnos de un curso
// Muestra la lista de alumnos que pertenecen a un curso específico.
// Recibe el objeto 'curso' como parámetro de navegación desde CursosScreen.
// Permite agregar alumnos nuevos mediante un modal.

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

export default function AlumnosScreen({ navigation, route }) {
  // Recibimos el curso completo desde CursosScreen via route.params
  const { curso } = route.params;

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    setLoading(true);

    // Filtramos los alumnos por curso_id para traer solo
    // los que pertenecen al curso que estamos viendo
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id) // eq = equal, equivale a WHERE curso_id = curso.id
      .order('apellido', { ascending: true }); // ordenamos alfabéticamente por apellido

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
    } else {
      setAlumnos(data);
    }

    setLoading(false);
  };

  const agregarAlumno = async () => {
    if (!nombre || !apellido) {
      Alert.alert('Error', 'Completá nombre y apellido');
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from('alumnos')
      .insert({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        curso_id: curso.id, // vinculamos el alumno al curso actual
      });

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo agregar el alumno');
      return;
    }

    // Limpiamos el formulario y cerramos el modal
    setNombre('');
    setApellido('');
    setModalVisible(false);
    cargarAlumnos();
  };

  const renderAlumno = ({ item, index }) => (
    <View style={styles.card}>
      {/* Número de orden en la lista */}
      <View style={styles.numero}>
        <Text style={styles.numeroText}>{index + 1}</Text>
      </View>
      <View style={styles.cardInfo}>
        {/* Mostramos apellido primero, convención en listas escolares */}
        <Text style={styles.cardNombre}>{item.apellido}, {item.nombre}</Text>
      </View>
    </View>
  );

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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Alumno</Text>
        </TouchableOpacity>
      </View>

      {/* Contador de alumnos — útil para el docente saber cuántos tiene */}
      {!loading && (
        <View style={styles.contador}>
          <Text style={styles.contadorText}>
            {alumnos.length} {alumnos.length === 1 ? 'alumno' : 'alumnos'}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <FlatList
          data={alumnos}
          renderItem={renderAlumno}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No hay alumnos en este curso</Text>
              <Text style={styles.emptySubtext}>Tocá "+ Alumno" para agregar el primero</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Agregar alumno</Text>
            <Text style={styles.modalSubtitulo}>Curso: {curso.nombre} — {curso.materia}</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#9CA3AF"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor="#9CA3AF"
              value={apellido}
              onChangeText={setApellido}
              autoCapitalize="words"
            />

            <TouchableOpacity
              style={[styles.button, guardando && styles.buttonDisabled]}
              onPress={agregarAlumno}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Agregar alumno</Text>
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
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: 80,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  contador: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
  },
  contadorText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
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
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  numeroText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  cardInfo: {
    flex: 1,
  },
  cardNombre: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
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
    justifyContent: 'flex-end',
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
    marginBottom: 4,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: '#6B7280',
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