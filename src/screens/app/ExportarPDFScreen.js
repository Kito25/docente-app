// ExportarPDFScreen.js — Pantalla para generar y compartir PDFs
// Permite al docente exportar dos tipos de documentos:
// 1. Reporte de calificaciones de un curso con promedios
// 2. Reporte de asistencia de un curso con porcentajes
// El PDF se genera en el dispositivo y se puede compartir
// por WhatsApp, email, Google Drive, etc.

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../lib/supabase';

export default function ExportarPDFScreen({ navigation }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(null); // id del curso que está generando

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los cursos');
    } else {
      setCursos(data);
    }
    setLoading(false);
  };

  // Genera el PDF de calificaciones para un curso
  const exportarCalificaciones = async (curso) => {
    setGenerando(curso.id + '_cal');

    // Traemos alumnos del curso
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('apellido', { ascending: true });

    // Traemos todas las calificaciones del curso
    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('curso_id', curso.id);

    if (!alumnos || alumnos.length === 0) {
      Alert.alert('Sin datos', 'Este curso no tiene alumnos cargados');
      setGenerando(null);
      return;
    }

    // Construimos las filas de la tabla HTML para el PDF
    // Por cada alumno calculamos su promedio y listamos sus notas
    const filas = alumnos.map((alumno) => {
      const notasAlumno = calificaciones
        ? calificaciones.filter((c) => c.alumno_id === alumno.id)
        : [];

      const promedio = notasAlumno.length > 0
        ? (notasAlumno.reduce((acc, c) => acc + c.nota, 0) / notasAlumno.length).toFixed(1)
        : '-';

      const colorPromedio = promedio === '-' ? '#6B7280'
        : promedio >= 7 ? '#059669'
        : promedio >= 4 ? '#D97706'
        : '#EF4444';

      const notasTexto = notasAlumno.length > 0
        ? notasAlumno.map((n) => `${n.descripcion}: <strong>${n.nota}</strong>`).join(' | ')
        : 'Sin calificaciones';

      return `
        <tr>
          <td>${alumno.apellido}, ${alumno.nombre}</td>
          <td style="font-size:12px; color:#6B7280">${notasTexto}</td>
          <td style="text-align:center; font-weight:bold; color:${colorPromedio}">${promedio}</td>
        </tr>
      `;
    }).join('');

    // El PDF se genera a partir de HTML
    // Esto nos da control total sobre el diseño del documento
    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { color: #4F46E5; font-size: 22px; margin-bottom: 4px; }
            h2 { color: #6B7280; font-size: 16px; font-weight: normal; margin-bottom: 24px; }
            .meta { font-size: 13px; color: #6B7280; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #4F46E5; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
            td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
            tr:nth-child(even) td { background: #F9FAFB; }
            .footer { margin-top: 32px; font-size: 11px; color: #9CA3AF; text-align: center; }
          </style>
        </head>
        <body>
          <h1>DocenteApp — Reporte de Calificaciones</h1>
          <h2>${curso.nombre} · ${curso.materia}</h2>
          <div class="meta">
            Fecha de generación: ${new Date().toLocaleDateString('es-AR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })} · Total de alumnos: ${alumnos.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Calificaciones</th>
                <th style="text-align:center">Promedio</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <div class="footer">Generado con DocenteApp</div>
        </body>
      </html>
    `;

    try {
      // expo-print convierte el HTML a un archivo PDF en el dispositivo
      const { uri } = await Print.printToFileAsync({ html });

      // expo-sharing abre el menú nativo para compartir el archivo
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Calificaciones ${curso.nombre}`,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    }

    setGenerando(null);
  };

  // Genera el PDF de asistencia para un curso
  const exportarAsistencia = async (curso) => {
    setGenerando(curso.id + '_asis');

    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('apellido', { ascending: true });

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('*')
      .eq('curso_id', curso.id)
      .order('fecha', { ascending: true });

    if (!alumnos || alumnos.length === 0) {
      Alert.alert('Sin datos', 'Este curso no tiene alumnos cargados');
      setGenerando(null);
      return;
    }

    // Obtenemos las fechas únicas en que se tomó asistencia
    const fechas = asistencias
      ? [...new Set(asistencias.map((a) => a.fecha))].sort()
      : [];

    const filas = alumnos.map((alumno) => {
      const asistenciasAlumno = asistencias
        ? asistencias.filter((a) => a.alumno_id === alumno.id)
        : [];

      const presentes = asistenciasAlumno.filter((a) => a.presente).length;
      const total = asistenciasAlumno.length;
      const porcentaje = total > 0
        ? Math.round((presentes / total) * 100)
        : '-';

      const colorPorcentaje = porcentaje === '-' ? '#6B7280'
        : porcentaje >= 75 ? '#059669'
        : porcentaje >= 50 ? '#D97706'
        : '#EF4444';

      // Generamos las celdas de cada fecha con P o A
      const celdasFechas = fechas.map((fecha) => {
        const registro = asistenciasAlumno.find((a) => a.fecha === fecha);
        if (!registro) return '<td style="text-align:center; color:#9CA3AF">-</td>';
        return registro.presente
          ? '<td style="text-align:center; color:#059669; font-weight:bold">P</td>'
          : '<td style="text-align:center; color:#EF4444; font-weight:bold">A</td>';
      }).join('');

      return `
        <tr>
          <td>${alumno.apellido}, ${alumno.nombre}</td>
          ${celdasFechas}
          <td style="text-align:center; font-weight:bold; color:${colorPorcentaje}">
            ${porcentaje}${porcentaje !== '-' ? '%' : ''}
          </td>
        </tr>
      `;
    }).join('');

    // Encabezados de fechas formateados
    const encabezadosFechas = fechas.map((fecha) => {
      const d = new Date(fecha + 'T00:00:00');
      return `<th style="text-align:center; font-size:11px">${d.getDate()}/${d.getMonth() + 1}</th>`;
    }).join('');

    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { color: #059669; font-size: 22px; margin-bottom: 4px; }
            h2 { color: #6B7280; font-size: 16px; font-weight: normal; margin-bottom: 24px; }
            .meta { font-size: 13px; color: #6B7280; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #059669; color: white; padding: 8px 10px; text-align: left; font-size: 12px; }
            td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; font-size: 12px; }
            tr:nth-child(even) td { background: #F9FAFB; }
            .footer { margin-top: 32px; font-size: 11px; color: #9CA3AF; text-align: center; }
          </style>
        </head>
        <body>
          <h1>DocenteApp — Reporte de Asistencia</h1>
          <h2>${curso.nombre} · ${curso.materia}</h2>
          <div class="meta">
            Fecha de generación: ${new Date().toLocaleDateString('es-AR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })} · Total de clases: ${fechas.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                ${encabezadosFechas}
                <th style="text-align:center">Asistencia</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <div class="footer">P = Presente · A = Ausente · Generado con DocenteApp</div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Asistencia ${curso.nombre}`,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    }

    setGenerando(null);
  };

  const renderCurso = (curso) => (
    <View key={curso.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardNombre}>{curso.nombre}</Text>
        <Text style={styles.cardMateria}>{curso.materia}</Text>
      </View>

      {/* Dos botones por curso: uno para calificaciones, otro para asistencia */}
      <View style={styles.botonesRow}>
        <TouchableOpacity
          style={[styles.boton, styles.botonCalif]}
          onPress={() => exportarCalificaciones(curso)}
          disabled={generando !== null}
        >
          {generando === curso.id + '_cal'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.botonText}>📝 Calificaciones</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, styles.botonAsist]}
          onPress={() => exportarAsistencia(curso)}
          disabled={generando !== null}
        >
          {generando === curso.id + '_asis'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.botonText}>✅ Asistencia</Text>
          }
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
        <Text style={styles.titulo}>Exportar PDF</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          Seleccioná un curso y el tipo de reporte. El PDF se va a generar en tu dispositivo y podrás compartirlo por WhatsApp, email o Drive.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {cursos.length === 0
            ? <View style={styles.empty}>
                <Text style={styles.emptyText}>No tenés cursos creados</Text>
              </View>
            : cursos.map(renderCurso)
          }
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
  infoBanner: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  infoText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 20,
  },
  lista: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardMateria: {
    fontSize: 14,
    color: '#6B7280',
  },
  botonesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  boton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonCalif: {
    backgroundColor: '#D97706',
  },
  botonAsist: {
    backgroundColor: '#059669',
  },
  botonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginTop: 60,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});