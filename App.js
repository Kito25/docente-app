// App.js — Punto de entrada de la aplicación
// Registra todas las pantallas disponibles en la app.
// Cuando agregamos una pantalla nueva, siempre hay que registrarla acá.

import ConfiguracionScreen from './src/screens/app/ConfiguracionScreen';
import SeleccionarCursoHistorialScreen from './src/screens/app/SeleccionarCursoHistorialScreen';
import ExportarPDFScreen from './src/screens/app/ExportarPDFScreen';
import AlumnosCalificacionesScreen from './src/screens/app/AlumnosCalificacionesScreen';
import CalificacionesScreen from './src/screens/app/CalificacionesScreen';
import CargarNotaScreen from './src/screens/app/CargarNotaScreen';
import TomarAsistenciaScreen from './src/screens/app/TomarAsistenciaScreen';
import AsistenciaScreen from './src/screens/app/AsistenciaScreen';
import HistorialAsistenciaScreen from './src/screens/app/HistorialAsistenciaScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/lib/supabase';

// Pantallas de autenticación
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Pantallas principales
import HomeScreen from './src/screens/app/HomeScreen';
import CursosScreen from './src/screens/app/CursosScreen';
import AlumnosScreen from './src/screens/app/AlumnosScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
       {session ? (
  // Home siempre primero — es la pantalla raíz del Stack
  // El resto se apila encima cuando navegamos hacia ellas
  <>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Cursos" component={CursosScreen} />
    <Stack.Screen name="Alumnos" component={AlumnosScreen} />
    <Stack.Screen name="Asistencia" component={AsistenciaScreen} />
    <Stack.Screen name="TomarAsistencia" component={TomarAsistenciaScreen} />
    <Stack.Screen name="HistorialAsistencia" component={HistorialAsistenciaScreen} />
    <Stack.Screen name="Calificaciones" component={CalificacionesScreen} />
    <Stack.Screen name="CargarNota" component={CargarNotaScreen} />
    <Stack.Screen name="AlumnosCalificaciones" component={AlumnosCalificacionesScreen} />
    <Stack.Screen name="ExportarPDF" component={ExportarPDFScreen} />
    <Stack.Screen name="SeleccionarCursoHistorial" component={SeleccionarCursoHistorialScreen} />
    <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
  </>
) : (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </>
)}
      </Stack.Navigator>
    </NavigationContainer>
  );
}