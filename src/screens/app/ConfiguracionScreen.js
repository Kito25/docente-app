// ConfiguracionScreen.js — Pantalla de configuración del docente
// Permite personalizar parámetros de la app por docente.
// Centralizar la configuración aquí facilita agregar nuevas opciones en el futuro.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function ConfiguracionScreen({ navigation }) {
  const [tardanzas, setTardanzas] = useState(3);
  const [umbralInasistencias, setUmbralInasistencias] = useState(5);
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
      .single();

    if (error && error.code !== 'PGRST116') {
      Alert.alert('Error', 'No se pudo cargar la configuración');
    }

    if (data) {
      setTardanzas(data.tardanzas_por_inasistencia);
      setUmbralInasistencias(data.umbral_inasistencias ?? 5);
    }

    setLoading(false);
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('configuracion')
      .upsert({
        docente_id: user.id,
        tardanzas_por_inasistencia: tardanzas,
        umbral_inasistencias: umbralInasistencias,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'docente_id',
      });

    setGuardando(false);

    if (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
      return;
    }

    Alert.alert('¡Listo!', 'Configuración guardada correctamente');
  };

  const opcionesTardanzas = [2, 3, 4, 5];
  const opcionesUmbral = [3, 4, 5, 6, 8, 10];

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
        <ScrollView contentContainerStyle={styles.contenido}>

          {/* Sección 1: Tardanzas */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>⏰ Regla de tardanzas</Text>
            <Text style={styles.seccionDescripcion}>
              ¿Cuántas tardanzas equivalen a una inasistencia?
            </Text>
            <View style={styles.opcionesRow}>
              {opcionesTardanzas.map((opcion) => (
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
            <View style={styles.reglaActual}>
              <Text style={styles.reglaTexto}>
                {tardanzas} tardanzas = 1 inasistencia
              </Text>
            </View>
          </View>

          {/* Sección 2: Umbral de alerta */}
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>🚨 Alerta de inasistencias</Text>
            <Text style={styles.seccionDescripcion}>
              ¿A partir de cuántas inasistencias alertar al docente?
            </Text>
            <View style={styles.opcionesRow}>
              {opcionesUmbral.map((opcion) => (
                <TouchableOpacity
                  key={opcion}
                  style={[
                    styles.opcionBtn,
                    umbralInasistencias === opcion && styles.opcionBtnRojo,
                  ]}
                  onPress={() => setUmbralInasistencias(opcion)}
                >
                  <Text style={[
                    styles.opcionNumero,
                    umbralInasistencias === opcion && styles.opcionNumeroRojo,
                  ]}>
                    {opcion}
                  </Text>
                  <Text style={[
                    styles.opcionLabel,
                    umbralInasistencias === opcion && styles.opcionLabelRojo,
                  ]}>
                    faltas
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.reglaActualRojo}>
              <Text style={styles.reglaTextoRojo}>
                Alertar cuando un alumno supere {umbralInasistencias} inasistencias
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

        </ScrollView>
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
    marginBottom: 16,
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
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  opcionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 64,
  },
  opcionBtnActivo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  opcionBtnRojo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  opcionNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  opcionNumeroActivo: {
    color: '#4F46E5',
  },
  opcionNumeroRojo: {
    color: '#EF4444',
  },
  opcionLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  opcionLabelActivo: {
    color: '#4F46E5',
  },
  opcionLabelRojo: {
    color: '#EF4444',
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
  reglaActualRojo: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
  },
  reglaTextoRojo: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
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