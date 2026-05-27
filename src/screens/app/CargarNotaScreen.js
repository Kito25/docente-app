// CargarNotaScreen.js — Pantalla para cargar y ver notas de un alumno
// Muestra el historial de calificaciones del alumno seleccionado
// y permite agregar una nota nueva con descripción y fecha.

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

export default function CargarNotaScreen({ navigation, route }) {
  const { alumno, curso } = route.params;

  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarCalificaciones();
    }, [])
  );

  const cargarCalificaciones = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('alumno_id', alumno.id)
      .eq('curso_id', curso.id)
      .order('fecha', { ascending: false }); // más recientes primero

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar las calificaciones');
    } else {
      setCalificaciones(data);
    }

    setLoading(false);
  };

  const guardarNota = async () => {
    if (!descripcion || !nota) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }

    // Validamos que la nota sea un número entre 1 y 10
    const notaNum = parseFloat(nota.replace(',', '.'));
    if (isNaN(notaNum) || notaNum < 1 || notaNum > 10) {
      Alert.alert('Error', 'La nota debe ser un número entre 1 y 10');
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from('calificaciones')
      .insert({
        alumno_id: alumno.id,
        curso_id: curso.id,
        descripcion: descripcion.trim(),
        nota: notaNum,
        fecha: new Date().toISOString().split('T')[0], // fecha de hoy
      });

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar la nota');
      return;
    }

    setDescripcion('');
    setNota('');
    setModalVisible(false);
    cargarCalificaciones();
  };

  // Calculamos el promedio de todas las notas del alumno
  const promedio = calificaciones.length > 0
    ? (calificaciones.reduce((acc, c) => acc + c.nota, 0) / calificaciones.length).toFixed(1)
    : null;

  const colorNota = (n) => {
    if (n >= 7) return '#059669';
    if (n >= 4) return '#D97706';
    return '#EF4444';
  };

  const renderCalificacion = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardDescripcion}>{item.descripcion}</Text>
        <Text style={styles.cardFecha}>
          {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>
      {/* Nota con color según aprobado/desaprobado */}
      <Text style={[styles.cardNota, { color: colorNota(item.nota) }]}>
        {item.nota % 1 === 0 ? item.nota : item.nota}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.titulo}>{alumno.apellido}, {alumno.nombre}</Text>
          <Text style={styles.subtitulo}>{curso.nombre} — {curso.materia}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Nota</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de promedio */}
      {promedio && (
        <View style={[styles.promedioBanner, { borderLeftColor: colorNota(parseFloat(promedio)) }]}>
          <Text style={styles.promedioLabel}>Promedio actual</Text>
          <Text style={[styles.promedioNumero, { color: colorNota(parseFloat(promedio)) }]}>
            {promedio}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={styles.loader} />
      ) : (
        <FlatList
          data={calificaciones}
          renderItem={renderCalificacion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Sin calificaciones aún</Text>
              <Text style={styles.emptySubtext}>Tocá "+ Nota" para cargar la primera</Text>
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
            <Text style={styles.modalTitulo}>Nueva calificación</Text>
            <Text style={styles.modalSubtitulo}>
              {alumno.apellido}, {alumno.nombre}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Descripción (ej: Primer parcial)"
              placeholderTextColor="#9CA3AF"
              value={descripcion}
              onChangeText={setDescripcion}
              autoCapitalize="sentences"
            />

            <TextInput
              style={styles.input}
              placeholder="Nota (1 a 10)"
              placeholderTextColor="#9CA3AF"
              value={nota}
              onChangeText={setNota}
              keyboardType="decimal-pad" // teclado numérico con decimales
            />

            <TouchableOpacity
              style={[styles.button, guardando && styles.buttonDisabled]}
              onPress={guardarNota}
              disabled={guardando}
            >
              {guardando
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Guardar nota</Text>
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
    color: '#D97706',
    fontWeight: '500',
    width: 60,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitulo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: 60,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  promedioBanner: {
    backgroundColor: '#fff',
    padding: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  promedioLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  promedioNumero: {
    fontSize: 28,
    fontWeight: 'bold',
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
  cardInfo: {
    flex: 1,
  },
  cardDescripcion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  cardFecha: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardNota: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
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
    backgroundColor: '#D97706',
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