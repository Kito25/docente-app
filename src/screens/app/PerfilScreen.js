// PerfilScreen.js — Pantalla de perfil del docente
// Muestra los datos de la cuenta y permite editar el nombre.
// El email no se puede cambiar porque es el identificador de la cuenta en Supabase.

import { useCallback, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function PerfilScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreEditado, setNombreEditado] = useState('');
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [])
  );

  const cargarPerfil = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setEmail(user?.email || '');
    const nombreActual = user?.user_metadata?.nombre_completo || '';
    setNombre(nombreActual);
    setNombreEditado(nombreActual);
    setLoading(false);
  };

  const guardarNombre = async () => {
    if (!nombreEditado.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setGuardando(true);

    // updateUser actualiza los metadatos del usuario en Supabase Auth
    const { error } = await supabase.auth.updateUser({
      data: { nombre_completo: nombreEditado.trim() },
    });

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el nombre');
      return;
    }

    setNombre(nombreEditado.trim());
    setEditando(false);
    Alert.alert('¡Listo!', 'Nombre actualizado correctamente');
  };

  const confirmarCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => await supabase.auth.signOut(),
        },
      ]
    );
  };

  // Generamos las iniciales del nombre para el avatar
  // Si el nombre es "Franco Martin" las iniciales son "FM"
  const iniciales = nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Mi perfil</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar con iniciales */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
            </View>
            <Text style={styles.avatarNombre}>{nombre}</Text>
            <Text style={styles.avatarEmail}>{email}</Text>
          </View>

          {/* Sección de datos */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Datos de la cuenta</Text>

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Email</Text>
              <Text style={styles.campoValor}>{email}</Text>
              <Text style={styles.campoNota}>El email no se puede modificar</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Nombre completo</Text>
              {editando ? (
                <View>
                  <TextInput
                    style={styles.input}
                    value={nombreEditado}
                    onChangeText={setNombreEditado}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <View style={styles.botonesEdicion}>
                    <TouchableOpacity
                      style={[styles.botonGuardar, guardando && styles.buttonDisabled]}
                      onPress={guardarNombre}
                      disabled={guardando}
                    >
                      {guardando
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.botonGuardarText}>Guardar</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.botonCancelar}
                      onPress={() => {
                        setNombreEditado(nombre);
                        setEditando(false);
                      }}
                    >
                      <Text style={styles.botonCancelarText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.campoRow}>
                  <Text style={styles.campoValor}>{nombre}</Text>
                  <TouchableOpacity onPress={() => setEditando(true)}>
                    <Text style={styles.editarLink}>✏️ Editar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.cerrarSesionBtn}
            onPress={confirmarCerrarSesion}
          >
            <Text style={styles.cerrarSesionText}>Cerrar sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  loader: {
    marginTop: 60,
  },
  contenido: {
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTexto: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  seccion: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  campo: {
    marginBottom: 16,
  },
  campoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  campoValor: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  campoNota: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  campoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editarLink: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginTop: 4,
    marginBottom: 8,
  },
  botonesEdicion: {
    flexDirection: 'row',
    gap: 8,
  },
  botonGuardar: {
    flex: 1,
    backgroundColor: '#4F46E5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  botonGuardarText: {
    color: '#fff',
    fontWeight: '600',
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonCancelarText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  cerrarSesionBtn: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cerrarSesionText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
});