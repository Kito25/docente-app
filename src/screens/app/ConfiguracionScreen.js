// ConfiguracionScreen.js — Pantalla de configuración del docente
// Permite personalizar parámetros de la app por docente.
// Por ahora maneja la regla de tardanzas por inasistencia.
// La configuración se guarda en Supabase y se aplica en todo el sistema.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function ConfiguracionScreen({ navigation }) {
  const [tardanzas, setTardanzas] = useState(3); // valor por defecto
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarConfiguracion();
    }, [])
  );

  const cargarConfiguracion = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('docente_id', user.id)
      .single(); // single() devuelve un objeto en lugar de un array

    if (error && error.code !== 'PGRST116') {
      // PGRST116 significa "no se encontró ningún registro"
      // lo ignoramos porque simplemente el docente no configuró nada aún
      Alert.alert('Error', 'No se pudo cargar la configuración');
    }

    if (data) {
      setTardanzas(data.tardanzas_por_inasistencia);
    }

    setLoading(false);
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);

    const { data: { user } } = await supabase.auth.getUser();

    // upsert inserta si no existe o actualiza si ya existe
    // Es perfecto para configuraciones donde solo hay un registro por docente
    const { error } = await supabase
      .from('configuracion')
      .upsert({
        docente_id: user.id,
        tardanzas_por_inasistencia: tardanzas,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'docente_id', // si ya existe un registro con este docente_id, lo actualiza
      });

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
      return;
    }

    Alert.alert('¡Listo!', 'Configuración guardada correctamente');
  };

  // Opciones disponibles para tardanzas por inasistencia
  const opciones = [2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Configuración</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <View style={styles.contenido}>

          {/* Sección de tardanzas */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Regla de tardanzas</Text>
            <Text style={styles.seccionDescripcion}>
              ¿Cuántas tardanzas equivalen a una inasistencia?
            </Text>

            {/* Botones de selección — más claro que un input numérico */}
            <View style={styles.opcionesRow}>
              {opciones.map((opcion) => (
                <TouchableOpacity
                  key={opcion}
                  style={[
                    styles.opcionBtn,
                    tardanzas === opcion && styles.opcionBtnActivo,
                  ]}
                  onPress={() => setTardanzas(opcion)}
                >
                  <Text style={[
                    styles.opcionNumero,
                    tardanzas === opcion && styles.opcionNumeroActivo,
                  ]}>
                    {opcion}
                  </Text>
                  <Text style={[
                    styles.opcionLabel,
                    tardanzas === opcion && styles.opcionLabelActivo,
                  ]}>
                    tardanzas
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Explicación de la regla actual seleccionada */}
            <View style={styles.reglaActual}>
              <Text style={styles.reglaTexto}>
                Con esta configuración: {tardanzas} tardanzas = 1 inasistencia
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, guardando && styles.buttonDisabled]}
            onPress={guardarConfiguracion}
            disabled={guardando}
          >
            {guardando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Guardar configuración</Text>
            }
          </TouchableOpacity>

        </View>
      )}
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
  seccion: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  seccionDescripcion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  opcionesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  opcionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  opcionBtnActivo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  opcionNumero: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  opcionNumeroActivo: {
    color: '#4F46E5',
  },
  opcionLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  opcionLabelActivo: {
    color: '#4F46E5',
  },
  reglaActual: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 12,
  },
  reglaTexto: {
    fontSize: 14,
    color: '#4338CA',
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});