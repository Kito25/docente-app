// CursosScreen.js — Pantalla de lista de cursos
// Permite crear, editar y eliminar cursos.
// Swipe o botón largo en una tarjeta muestra las opciones de editar/eliminar.

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

export default function CursosScreen({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // cursoEditando es null cuando creamos uno nuevo
  // o contiene el objeto curso cuando editamos uno existente
  const [cursoEditando, setCursoEditando] = useState(null);
  const [nombreCurso, setNombreCurso] = useState('');
  const [materiaCurso, setMateriaCurso] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarCursos();
    }, [])
  );

  const cargarCursos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los cursos');
    } else {
      setCursos(data);
    }
    setLoading(false);
  };

  // Abre el modal para crear un curso nuevo
  const abrirModalNuevo = () => {
    setCursoEditando(null);
    setNombreCurso('');
    setMateriaCurso('');
    setModalVisible(true);
  };

  // Abre el modal precargado con los datos del curso a editar
  const abrirModalEditar = (curso) => {
    setCursoEditando(curso);
    setNombreCurso(curso.nombre);
    setMateriaCurso(curso.materia);
    setModalVisible(true);
  };

  const guardarCurso = async () => {
    if (!nombreCurso || !materiaCurso) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }

    setGuardando(true);

    if (cursoEditando) {
      // Modo edición — usamos update con el id del curso
      const { error } = await supabase
        .from('cursos')
        .update({
          nombre: nombreCurso.trim(),
          materia: materiaCurso.trim(),
        })
        .eq('id', cursoEditando.id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el curso');
        setGuardando(false);
        return;
      }
    } else {
      // Modo creación — insert normal
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('cursos')
        .insert({
          nombre: nombreCurso.trim(),
          materia: materiaCurso.trim(),
          docente_id: user.id,
        });

      if (error) {
        Alert.alert('Error', 'No se pudo crear el curso');
        setGuardando(false);
        return;
      }
    }

    setGuardando(false);
    setNombreCurso('');
    setMateriaCurso('');
    setModalVisible(false);
    cargarCursos();
  };

  const eliminarCurso = (curso) => {
    // Alert.alert con múltiples botones funciona como un diálogo de confirmación
    // Siempre pedimos confirmación antes de eliminar para evitar borrados accidentales
    Alert.alert(
      'Eliminar curso',
      `¿Estás seguro que querés eliminar "${curso.nombre}"? Se eliminarán también todos los alumnos, asistencias y calificaciones asociadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive', // en iOS pone el texto en rojo
          onPress: async () => {
            const { error } = await supabase
              .from('cursos')
              .delete()
              .eq('id', curso.id);

            if (error) {
              Alert.alert('Error', 'No se pudo eliminar el curso');
              return;
            }

            cargarCursos();
          },
        },
      ]
    );
  };

  const renderCurso = ({ item }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Alumnos', { curso: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.cardNombre}>{item.nombre}</Text>
          <Text style={styles.cardMateria}>{item.materia}</Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>

      {/* Botones de editar y eliminar visibles en cada tarjeta */}
      <View style={styles.acciones}>
        <TouchableOpacity
          style={styles.accionEditar}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={styles.accionEditarText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.accionEliminar}
          onPress={() => eliminarCurso(item)}
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
        <Text style={styles.titulo}>Mis Cursos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={abrirModalNuevo}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <FlatList
          data={cursos}
          renderItem={renderCurso}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No tenés cursos aún</Text>
              <Text style={styles.emptySubtext}>Tocá "+ Nuevo" para crear tu primer curso</Text>
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
            {/* El título del modal cambia según si estamos creando o editando */}
            <Text style={styles.modalTitulo}>
              {cursoEditando ? 'Editar curso' : 'Nuevo curso'}
            </Text>

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
              onPress={guardarCurso}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>
                    {cursoEditando ? 'Guardar cambios' : 'Crear curso'}
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
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 18,
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
  acciones: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    elevation: 2,
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