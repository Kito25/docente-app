// HistorialAsistenciaScreen.js — Placeholder temporal
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HistorialAsistenciaScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Volver</Text>
      </TouchableOpacity>
      <Text style={styles.texto}>Historial — próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20, paddingTop: 60 },
  back: { fontSize: 16, color: '#059669', marginBottom: 20 },
  texto: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 60 },
});