// LoginScreen.js — Pantalla de inicio de sesión
// Es la primera pantalla que ve el usuario si no está logueado.
// Se comunica con Supabase Auth para verificar las credenciales.
// Si el login es exitoso, App.js detecta el cambio de sesión
// automáticamente y redirige al Home sin que hagamos nada extra.

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function LoginScreen({ navigation }) {
  // Guardamos lo que el usuario escribe en los campos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Controlamos si hay una petición en curso para deshabilitar el botón
  // y evitar que el usuario toque dos veces y mande dos requests
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validación básica antes de llamar a la API
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completá todos los campos');
      return;
    }

    setLoading(true);

    // signInWithPassword es el método de Supabase para autenticar
    // Devuelve un error si las credenciales son incorrectas
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(), // trim() elimina espacios accidentales
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error al ingresar', error.message);
    }
    // Si no hay error, App.js detecta la nueva sesión automáticamente
    // y cambia la pantalla al Home sin necesidad de navegar manualmente
  };

  return (
    // KeyboardAvoidingView empuja el contenido hacia arriba
    // cuando aparece el teclado, para que no tape los inputs
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* Encabezado */}
        <Text style={styles.title}>DocenteApp</Text>
        <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

        {/* Campo de email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none" // evita que el teclado ponga mayúscula automática
        />

        {/* Campo de contraseña */}
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // oculta el texto como contraseña
        />

        {/* Botón de login — muestra spinner mientras carga */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Ingresar</Text>
          }
        </TouchableOpacity>

        {/* Link para ir a registrarse */}
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>¿No tenés cuenta? Registrate</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

// StyleSheet es la forma de React Native de escribir estilos,
// similar a CSS pero con sintaxis de objeto JavaScript.
// Los nombres de propiedades usan camelCase en vez de kebab-case
// (backgroundColor en vez de background-color)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
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
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6, // visualmente indica que el botón está deshabilitado
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#4F46E5',
    textAlign: 'center',
    fontSize: 14,
  },
});