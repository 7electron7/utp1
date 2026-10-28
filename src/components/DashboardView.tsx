import React from 'react';
import { 
  AlertTriangle, 
  UserX, 
  BookAlert, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  TrendingDown, 
  Clock, 
  Calendar,
  Sparkles,
  School,
  FileDown
} from 'lucide-react';
import { StudentRisk, Intervention } from '../types';
import { AnalyticsService } from '../services/analyticsService';

interface DashboardViewProps {
  students: StudentRisk[];
  interventions: Intervention[];
  onSelectStudent: (student: StudentRisk) => void;
  onFilterCourse: (course: string) => void;
  onFilterRiskType: (filter: 'todos' | 'doble' | 'asistencia' | 'desempeno' | 'criticos') => void;
  onExportPdf: () => void;
  onNavigateTab: (tab: 'courses' | 'subjects' | 'interventions') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  interventions,
  onSelectStudent,
  onFilterCourse,
  onFilterRiskType,
  onExportPdf,
  onNavigateTab,
}) => {
  const stats = AnalyticsService.getDashboardStats(students);
  const topSubjects = AnalyticsService.getMostFailedSubjects(students).slice(0, 5);
  const courseSummaries = AnalyticsService.getCourseSummaries(students);
  const earlyWarningStudents = AnalyticsService.getEarlyWarningStudents(students).slice(0, 6);

  const basicaStudents = students.filter(s => s.cycle === 'BÁSICA');
  const mediaStudents = students.filter(s => s.cycle === 'MEDIA');

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <School className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Unidad Técnico Pedagógica • Monitoreo Integral (Básica y Media)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Análisis y Gestión de Riesgo de Repitencia
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Plataforma para la detección precoz de estudiantes con inasistencia crítica y reprobación de asignaturas según el <strong className="text-white">Decreto 67/2018</strong>. Integración unificada de <strong className="text-blue-300">Enseñanza Básica (1º a 8º)</strong> y <strong className="text-indigo-300">Enseñanza Media (1º a 4º HC/TP)</strong>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onExportPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Descargar Informe Ejecutivo PDF
            </button>
            <button
              onClick={() => onNavigateTab('courses')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Ver Nómina de Cursos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cycle Quick Switch & Distribution Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div 
          onClick={() => onNavigateTab('courses')}
          className="bg-white rounded-xl p-4 border border-blue-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              EB
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                Enseñanza Básica (1º a 8º Básico)
              </h4>
              <p className="text-xs text-slate-500">
                {basicaStudents.length} alumnos monitoreados • {basicaStudents.filter(s => s.riskLevel === 'CRITICO').length} casos críticos
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
            Ver Básica &rarr;
          </span>
        </div>

        <div 
          onClick={() => onNavigateTab('courses')}
          className="bg-white rounded-xl p-4 border border-indigo-200/80 shadow-2xs hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              EM
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                Enseñanza Media (1º a 4º Medio HC/TP)
              </h4>
              <p className="text-xs text-slate-500">
                {mediaStudents.length} alumnos monitoreados • {mediaStudents.filter(s => s.riskLevel === 'CRITICO').length} casos críticos
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
            Ver Media &rarr;
          </span>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total students in risk */}
        <div 
          onClick={() => {
            onFilterRiskType('todos');
            onNavigateTab('courses');
          }}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alumnos Monitoreados
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalStudents}</span>
            <span className="text-xs text-slate-500">en {stats.totalCourses} cursos</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <span>Prom. Asistencia:</span>
            <strong className="text-slate-700">{stats.averageSchoolAttendance}%</strong>
          </p>
        </div>

        {/* Critical risk */}
        <div 
          onClick={() => {
            onFilterRiskType('criticos');
            onNavigateTab('courses');
          }}
          className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Casos Críticos
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-700">{stats.criticalCount}</span>
            <span className="text-xs text-red-600 font-medium">
              ({Math.round((stats.criticalCount / (stats.totalStudents || 1)) * 100)}%)
            </span>
          </div>
          <p className="mt-1 text-xs text-red-600/90 font-medium">
            Prioridad 1 para Consejo Escolar
          </p>
        </div>

        {/* Double Risk (Attendance + Grades) */}
        <div 
          onClick={() => {
            onFilterRiskType('doble');
            onNavigateTab('courses');
          }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Doble Riesgo (Dec. 67)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-800">{stats.doubleRiskCount}</span>
            <span className="text-xs text-amber-700 font-medium">alumnos</span>
          </div>
          <p className="mt-1 text-xs text-amber-700 font-medium">
            Inasistencia &lt; 85% + Notas rojas
          </p>
        </div>

        {/* Deficient subjects alert */}
        <div 
          onClick={() => {
            onFilterRiskType('desempeno');
            onNavigateTab('courses');
          }}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Riesgo Académico
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100">
              <BookAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-700">
              {stats.academicOnlyCount + stats.doubleRiskCount}
            </span>
            <span className="text-xs text-slate-500">con &ge;1 reprobación</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {stats.threeOrMoreFailures} alumnos con 3+ asignaturas
          </p>
        </div>

        {/* Pedagogical Interventions Coverage */}
        <div 
          onClick={() => onNavigateTab('interventions')}
          className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cobertura Pedagógica
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{stats.coveragePercentage}%</span>
            <span className="text-xs text-slate-500">atendidos</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {interventions.length} intervenciones registradas
          </p>
        </div>
      </div>

      {/* Two Column Layout: Risk Breakdown & Early Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Breakdown by Decreto 67 Risk Factors (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Decreto 67 Risk Matrix */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Resumen de Riesgo según Decreto 67 / 2018
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reglamento de Evaluación y Promoción: Criterios legales de asistencia (85%) y logro académico
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('courses')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Factor 1: Solo Asistencia */}
              <div 
                onClick={() => {
                  onFilterRiskType('asistencia');
                  onNavigateTab('courses');
                }}
                className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-blue-800">
                  <span className="text-xs font-bold uppercase tracking-wide">Solo Asistencia</span>
                  <span className="text-2xl font-black">{stats.attendanceOnlyCount}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${Math.round((stats.attendanceOnlyCount / (stats.totalStudents || 1)) * 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-blue-900 leading-snug">
                  Asistencia &lt; 85% pero con calificaciones aprobadas (sin notas rojas). Requiere citación y justificación médica.
                </p>
                <span className="mt-3 inline-block text-[11px] font-semibold text-blue-700">
                  Filtrar {stats.attendanceOnlyCount} alumnos &rarr;
                </span>
              </div>

              {/* Factor 2: Solo Calificaciones */}
              <div 
                onClick={() => {
                  onFilterRiskType('desempeno');
                  onNavigateTab('courses');
                }}
                className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-indigo-900">
                  <span className="text-xs font-bold uppercase tracking-wide">Solo Calificaciones</span>
                  <span className="text-2xl font-black">{stats.academicOnlyCount}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-indigo-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full" 
                    style={{ width: `${Math.round((stats.academicOnlyCount / (stats.totalStudents || 1)) * 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-indigo-900 leading-snug">
                  Asistencia &ge; 85%, pero presentan 1 o más asignaturas deficientes (&lt; 4.0). Requiere plan de reforzamiento.
                </p>
                <span className="mt-3 inline-block text-[11px] font-semibold text-indigo-700">
                  Filtrar {stats.academicOnlyCount} alumnos &rarr;
                </span>
              </div>

              {/* Factor 3: Doble Riesgo (Crítico) */}
              <div 
                onClick={() => {
                  onFilterRiskType('doble');
                  onNavigateTab('courses');
                }}
                className="p-4 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-50 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-red-900">
                  <span className="text-xs font-bold uppercase tracking-wide">Doble Riesgo</span>
                  <span className="text-2xl font-black">{stats.doubleRiskCount}</span>
                </div>
                <div className="mt-2 h-1.5 w-full bg-red-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-600 rounded-full" 
                    style={{ width: `${Math.round((stats.doubleRiskCount / (stats.totalStudents || 1)) * 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-red-900 leading-snug">
                  Incumplimiento simultáneo: Asistencia &lt; 85% Y ramos rojos. Causal de no promoción directa sin acuerdo fundado UTP.
                </p>
                <span className="mt-3 inline-block text-[11px] font-semibold text-red-700">
                  Filtrar {stats.doubleRiskCount} alumnos &rarr;
                </span>
              </div>
            </div>
          </div>

          {/* Card: Top 5 Asignaturas más Reprobadas */}
          <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Asignaturas con Mayor Reprobación Institucional
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribución de calificaciones insuficientes en el colegio
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('subjects')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Ver ranking completo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 mt-2">
              {topSubjects.map((item, idx) => (
                <div key={item.subject} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{item.subject}</h4>
                      <p className="text-xs text-slate-500">
                        Afecta a {item.coursesAffected.length} cursos • Cursos críticos: {item.coursesAffected.slice(0, 2).map(c => c.course).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-0 flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        {item.totalFailures} reprobaciones
                      </div>
                      <div className="text-xs text-slate-500">
                        Nota roja prom: <strong className="text-slate-700">{item.averageGrade.toFixed(1)}</strong>
                      </div>
                    </div>
                    <div className="w-20 hidden md:block">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.min(100, item.percentageOfTotal * 2.5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Early Warnings & Priority Actions */}
        <div className="space-y-6">
          {/* Early Warning Alert Box */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Centro de Alerta Temprana
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                Acción Inmediata
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Estudiantes con indicadores extremos (&lt;60% asistencia o 3+ asignaturas insuficientes):
            </p>

            <div className="mt-3 space-y-2.5">
              {earlyWarningStudents.map((st) => (
                <div
                  key={st.id}
                  onClick={() => onSelectStudent(st)}
                  className="p-3 rounded-lg border border-red-100 bg-red-50/40 hover:bg-red-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 hover:text-blue-600">
                        {st.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {st.course} • Promedio: <strong className="text-slate-700">{st.generalAverage.toFixed(1)}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        st.attendance < 60 ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                      }`}>
                        {st.attendance}% asist.
                      </span>
                    </div>
                  </div>

                  {st.deficientSubjects.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {st.deficientSubjects.slice(0, 3).map((sub, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-red-200 text-red-700 font-medium">
                          {sub.name.slice(0, 16)}: {sub.grade}
                        </span>
                      ))}
                      {st.deficientSubjects.length > 3 && (
                        <span className="text-[10px] px-1 py-0.5 text-slate-500">
                          +{st.deficientSubjects.length - 3} más
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-red-100/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {st.interventionCount > 0 ? (
                        <span className="text-emerald-700 font-medium">✓ {st.interventionCount} intervención(es)</span>
                      ) : (
                        <span className="text-red-600 font-semibold">⚠ Sin intervención</span>
                      )}
                    </span>
                    <span className="text-blue-600 font-medium hover:underline">
                      Ver Ficha &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Course List preview */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Cursos con Mayor Riesgo de Repitencia
            </h3>
            <div className="space-y-2">
              {courseSummaries.slice(0, 5).map(c => (
                <div
                  key={c.course}
                  onClick={() => {
                    onFilterCourse(c.course);
                    onNavigateTab('courses');
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 transition cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800">{c.course}</span>
                    <p className="text-[11px] text-slate-500">
                      {c.total} en riesgo • {c.critical} críticos
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {c.avgAttendance}% asist.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
