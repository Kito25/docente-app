// calcularAsistencia.js — Utilidades para calcular asistencia
// Centralizar este cálculo en un solo lugar garantiza que
// el PDF y el historial siempre muestren los mismos números.
// Si en el futuro cambia la lógica, solo se modifica acá.


import { supabase } from './supabase';

export const obtenerConfiguracion = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from('configuracion')
    .select('*')
    .eq('docente_id', user.id)
    .single();

  return {
    tardanzasPorInasistencia: data?.tardanzas_por_inasistencia ?? 3,
    umbralInasistencias: data?.umbral_inasistencias ?? 5,
  };
};

export const calcularEstadisticas = (asistenciasAlumno, config) => {
  const presentes = asistenciasAlumno.filter((a) =>
    a.estado === 'presente' || (!a.estado && a.presente)
  ).length;

  const tardes = asistenciasAlumno.filter((a) => a.estado === 'tarde').length;

  const ausentesReales = asistenciasAlumno.filter((a) =>
    a.estado === 'ausente' || (!a.estado && !a.presente)
  ).length;

  const inasistenciasPorTardes = Math.floor(tardes / config.tardanzasPorInasistencia);
  const tardesRestantes = tardes % config.tardanzasPorInasistencia;
  const inasistenciasTotal = ausentesReales + inasistenciasPorTardes;

  const total = asistenciasAlumno.length;
  const porcentaje = total > 0
    ? Math.round(((presentes + tardesRestantes) / total) * 100)
    : null;

  // Verificamos si el alumno superó el umbral de alerta
  const enAlerta = inasistenciasTotal >= config.umbralInasistencias;

  return {
    presentes,
    tardes,
    tardesRestantes,
    ausentesReales,
    inasistenciasPorTardes,
    inasistenciasTotal,
    porcentaje,
    enAlerta,
  };
};