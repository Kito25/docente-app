// calcularAsistencia.js — Utilidades para calcular asistencia
// Centralizar este cálculo en un solo lugar garantiza que
// el PDF y el historial siempre muestren los mismos números.
// Si en el futuro cambia la lógica, solo se modifica acá.

import { supabase } from './supabase';

// Obtiene la configuración del docente logueado
// Si no tiene configuración guardada, devuelve los valores por defecto
export const obtenerConfiguracion = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('configuracion')
    .select('*')
    .eq('docente_id', user.id)
    .single();

  // Si no hay configuración guardada usamos el valor por defecto
  return {
    tardanzasPorInasistencia: data?.tardanzas_por_inasistencia ?? 3,
  };
};

// Calcula las estadísticas de asistencia de un alumno
// teniendo en cuenta la regla de tardanzas configurada
// Recibe el array de asistencias del alumno y la configuración
export const calcularEstadisticas = (asistenciasAlumno, config) => {
  const presentes = asistenciasAlumno.filter((a) =>
    a.estado === 'presente' || (!a.estado && a.presente)
  ).length;

  const tardes = asistenciasAlumno.filter((a) => a.estado === 'tarde').length;

  const ausentesReales = asistenciasAlumno.filter((a) =>
    a.estado === 'ausente' || (!a.estado && !a.presente)
  ).length;

  // Calculamos cuántas inasistencias equivalen las tardanzas
  // Math.floor redondea hacia abajo: 5 tardanzas con regla de 3 = 1 inasistencia
  const inasistenciasPorTardes = Math.floor(tardes / config.tardanzasPorInasistencia);

  // Tardanzas que todavía no suman una inasistencia completa
  const tardesRestantes = tardes % config.tardanzasPorInasistencia;

  // Total de inasistencias = ausentes reales + las que generaron las tardanzas
  const inasistenciasTotal = ausentesReales + inasistenciasPorTardes;

  const total = asistenciasAlumno.length;

  // Para el porcentaje, los presentes y tardanzas restantes cuentan como asistencia
  const porcentaje = total > 0
    ? Math.round(((presentes + tardesRestantes) / total) * 100)
    : null;

  return {
    presentes,
    tardes,
    tardesRestantes,
    ausentesReales,
    inasistenciasPorTardes,
    inasistenciasTotal,
    porcentaje,
  };
};