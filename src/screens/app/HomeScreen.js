// HomeScreen.js — Pantalla principal de la app
// Es lo primero que ve el docente después de iniciar sesión.
// Muestra un saludo personalizado y los accesos a los módulos principales.
// Por ahora es un dashboard estático, más adelante le agregaremos
// datos reales como cantidad de alumnos, últimas asistencias, etc.

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen({ navigation }) {
  // Obtenemos los datos del usuario logueado directamente desde Supabase
  // getUser() devuelve la sesión actual sin hacer un request a la API,
  // ya que los datos se guardan localmente con AsyncStorage
  const user = supabase.auth.getUser();

  // Leemos el nombre que guardamos al momento del registro
  // El operador ?. (optional chaining) evita errores si algún valor es null
  const nombreDocente = user?.data?.user?.user_metadata?.nombre_completo || 'Docente';

  const handleLogout = async () => {
    // signOut cierra la sesión en Supabase y borra los datos locales
    // App.js detecta el cambio automáticamente y vuelve al Login
    await supabase.auth.signOut();
  };

  // Definimos los módulos como un array de objetos
  // Así es fácil agregar más módulos en el futuro sin repetir código
  const modulos = [
    {
      id: 1,
      titulo: 'Mis Cursos',
      descripcion: 'Gestioná tus cursos y alumnos',
      icono: '📚',
      color: '#4F46E5',
      pantalla: 'Cursos', // nombre de la pantalla a la que navega
    },
    {
      id: 2,
      titulo: 'Asistencia',
      descripcion: 'Tomá lista y revisá el historial',
      icono: '✅',
      color: '#059669',
      pantalla: 'Asistencia',
    },
    {
      id: 3,
      titulo: 'Calificaciones',
      descripcion: 'Cargá notas y consultá promedios',
      icono: '📝',
      color: '#D97706',
      pantalla: 'Calificaciones',
    },
    {
  id: 4,
  titulo: 'Exportar PDF',
  descripcion: 'Generá reportes de notas y asistencia',
  icono: '📄',
  color: '#7C3AED',
  pantalla: 'ExportarPDF',
},
   {
      id: 5,
      titulo: 'Configuración',
      descripcion: 'Personalizá las reglas de tu institución',
      icono: '⚙️',
      color: '#6B7280',
      pantalla: 'Configuracion',
},
  ];

  return (
    // ScrollView permite hacer scroll si el contenido no entra en pantalla
    // Es buena práctica usarlo en pantallas con contenido variable
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Encabezado con saludo y botón de logout */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>¡Hola, {nombreDocente}! 👋</Text>
          <Text style={styles.fecha}>{new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Título de la sección */}
      <Text style={styles.sectionTitle}>¿Qué querés hacer hoy?</Text>

      {/* Tarjetas de módulos — recorremos el array con map()
          Cada módulo se convierte en una tarjeta táctil */}
      {modulos.map((modulo) => (
        <TouchableOpacity
          key={modulo.id} // key es obligatorio en listas, ayuda a React a identificar cada elemento
          style={[styles.card, { borderLeftColor: modulo.color }]}
          onPress={() => navigation.navigate(modulo.pantalla)}
          activeOpacity={0.7} // reduce la opacidad al tocar, da feedback visual
        >
          <Text style={styles.cardIcono}>{modulo.icono}</Text>
          <View style={styles.cardTexto}>
            <Text style={styles.cardTitulo}>{modulo.titulo}</Text>
            <Text style={styles.cardDescripcion}>{modulo.descripcion}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row', // coloca los elementos en fila (como flex-direction: row en CSS)
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  saludo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  fecha: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4, // línea de color a la izquierda que diferencia cada módulo
    // sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // sombra para Android (elevation es exclusivo de Android)
    elevation: 2,
  },
  cardIcono: {
    fontSize: 32,
    marginRight: 16,
  },
  cardTexto: {
    flex: 1, // ocupa todo el espacio disponible entre el ícono y la flecha
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescripcion: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardArrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
});