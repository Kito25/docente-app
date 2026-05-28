// AlumnosScreen.js — Pantalla de alumnos de un curso
// Permite agregar, editar y eliminar alumnos.
// Al eliminar un alumno se eliminan también sus asistencias y calificaciones
// gracias al ON DELETE CASCADE que configuramos en la base de datos.

import { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function AlumnosScreen({ navigation, route }) {
  const { curso } = route.params;

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarAlumnos();
    }, [])
  );

  const cargarAlumnos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('apellido', { ascending: true });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los alumnos');
    } else {
      setAlumnos(data);
    }
    setLoading(false);
  };

  const abrirModalNuevo = () => {
    setAlumnoEditando(null);
    setNombre('');
    setApellido('');
    setModalVisible(true);
  };

  const abrirModalEditar = (alumno) => {
    setAlumnoEditando(alumno);
    setNombre(alumno.nombre);
    setApellido(alumno.apellido);
    setModalVisible(true);
  };

  const guardarAlumno = async () => {
    if (!nombre || !apellido) {
      Alert.alert('Error', 'Completá nombre y apellido');
      return;
    }

    setGuardando(true);

    if (alumnoEditando) {
      const { error } = await supabase
        .from('alumnos')
        .update({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
        })
        .eq('id', alumnoEditando.id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el alumno');
        setGuardando(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from('alumnos')
        .insert({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          curso_id: curso.id,
        });

      if (error) {
        Alert.alert('Error', 'No se pudo agregar el alumno');
        setGuardando(false);
        return;
      }
    }

    setGuardando(false);
    setNombre('');
    setApellido('');
    setModalVisible(false);
    cargarAlumnos();
  };

  const eliminarAlumno = (alumno) => {
    Alert.alert(
      'Eliminar alumno',
      `¿Estás seguro que querés eliminar a "${alumno.apellido}, ${alumno.nombre}"? Se eliminarán también todas sus asistencias y calificaciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('alumnos')
              .delete()
              .eq('id', alumno.id);

            if (error) {
              Alert.alert('Error', 'No se pudo eliminar el alumno');
              return;
            }
            cargarAlumnos();
          },
        },
      ]
    );
  };

  const renderAlumno = ({ item, index }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.numero}>
          <Text style={styles.numeroText}>{index + 1}</Text>
        </View>
        <Text style={styles.cardNombre}>{item.apellido}, {item.nombre}</Text>
      </View>
      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.accionEditar}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={styles.accionEditarText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.accionEliminar}
          onPress={() => eliminarAlumno(item)}
        >
          <Text style={styles.accionEliminarText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.addBtn} onPress={abrirModalNuevo}>
          <Text style={styles.addBtnText}>+ Alumno</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.modalTitulo}>
              {alumnoEditando ? 'Editar alumno' : 'Agregar alumno'}
            </Text>
            <Text style={styles.modalSubtitulo}>
              Curso: {curso.nombre} — {curso.materia}
            </Text>

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
              onPress={guardarAlumno}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>
                    {alumnoEditando ? 'Guardar cambios' : 'Agregar alumno'}
                  </Text>
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
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 16,
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
  cardNombre: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  acciones: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    elevation: 1,
  },
  accionEditar: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  accionEditarText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },
  accionEliminar: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  accionEliminarText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
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