import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  TrendingDown, 
  BarChart3, 
  AlertCircle, 
  CheckCircle2, 
  School,
  GraduationCap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StudentRisk } from '../types';
import { AnalyticsService } from '../services/analyticsService';

interface SubjectsAnalyticsViewProps {
  students: StudentRisk[];
  onSelectCourse: (course: string) => void;
}

export const SubjectsAnalyticsView: React.FC<SubjectsAnalyticsViewProps> = ({
  students,
  onSelectCourse,
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter students if course filter is set
  const filteredStudents = useMemo(() => {
    if (selectedCourseFilter === 'TODOS') return students;
    return students.filter((s) => s.course === selectedCourseFilter);
  }, [students, selectedCourseFilter]);

  const allSubjectsStats = useMemo(() => {
    return AnalyticsService.getMostFailedSubjects(filteredStudents);
  }, [filteredStudents]);

  const displayedSubjects = useMemo(() => {
    if (!searchTerm.trim()) return allSubjectsStats;
    const q = searchTerm.toLowerCase().trim();
    return allSubjectsStats.filter((s) => s.subject.toLowerCase().includes(q));
  }, [allSubjectsStats, searchTerm]);

  // Unique courses for filter
  const uniqueCourses = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      set.add(s.course);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [students]);

  const totalReprobations = useMemo(() => {
    return allSubjectsStats.reduce((sum, s) => sum + s.totalFailures, 0);
  }, [allSubjectsStats]);

  const topSubject = allSubjectsStats[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Title Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Análisis y Ranking de Asignaturas más Reprobadas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detección de áreas críticas curriculares para focalizar planes de reforzamiento, adecuaciones y acompañamiento docente
          </p>
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filtrar por Curso:</span>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="TODOS">Todo el Colegio (Consolidado)</option>
            {uniqueCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Reprobaciones
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totalReprobations}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calificaciones inferiores a 4.0
          </p>
        </div>

        <div className="bg-red-50/70 rounded-xl p-4 border border-red-200 shadow-2xs">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
            Asignatura con Mayor Dificultad
          </span>
          <div className="mt-2 text-xl font-black text-red-700 truncate">
            {topSubject ? topSubject.subject : 'N/A'}
          </div>
          <p className="text-xs text-red-600 mt-0.5">
            {topSubject ? `${topSubject.totalFailures} alumnos reprobados (${topSubject.percentageOfTotal}%)` : '-'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Asignaturas Monitoreadas
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {allSubjectsStats.length}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Con al menos 1 nota roja
          </p>
        </div>

        <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            Promedio de Notas Rojas
          </span>
          <div className="mt-2 text-2xl font-black text-blue-800">
            {topSubject ? topSubject.averageGrade.toFixed(1) : '-'}
          </div>
          <p className="text-xs text-blue-700 mt-0.5">
            En la materia con mayor reprobación
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar asignatura específica (ej. Matemática, Lenguaje, Tecnología)..."
          className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Main Subjects Ranking Grid */}
      <div className="space-y-4">
        {displayedSubjects.map((item, idx) => {
          const isTop3 = idx < 3;
          const maxFailures = allSubjectsStats[0]?.totalFailures || 1;
          const barPercentage = Math.round((item.totalFailures / maxFailures) * 100);

          return (
            <div
              key={item.subject}
              className={`rounded-xl p-5 border transition ${
                isTop3
                  ? 'bg-gradient-to-r from-red-50/40 via-white to-white border-red-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 ${
                    idx === 0
                      ? 'bg-red-600 text-white shadow-xs'
                      : idx === 1
                      ? 'bg-amber-600 text-white shadow-xs'
                      : idx === 2
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    #{idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {item.subject}
                      </h3>
                      {isTop3 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wider">
                          Prioridad Curricular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Representa el <strong className="text-slate-700">{item.percentageOfTotal}%</strong> de todas las reprobaciones del colegio
                    </p>
                  </div>
                </div>

                {/* Quantitative indicators */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Reprobados</span>
                    <div className="text-xl font-black text-red-600">
                      {item.totalFailures} alumnos
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">Nota Promedio</span>
                    <div className="text-base font-bold text-slate-800">
                      {item.averageGrade.toFixed(1)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">Nota Mínima</span>
                    <div className="text-base font-bold text-red-700">
                      {item.minGrade.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar of relative severity */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${barPercentage}%` }}
                />
              </div>

              {/* Course breakdown pills */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Cursos con alumnos reprobando {item.subject}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.coursesAffected.map((c) => (
                    <button
                      key={c.course}
                      onClick={() => onSelectCourse(c.course)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{c.course}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-700">
                        {c.count} {c.count === 1 ? 'alumno' : 'alumnos'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested Pedagogical Orientation for UTP */}
              <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Orientación Pedagógica UTP: </strong>
                  {item.subject.toLowerCase().includes('matemática')
                    ? 'Programar reunión con departamento de matemática para revisar instrumentos de evaluación, ponderaciones de trabajos prácticos e implementar guías de refuerzo antes del cierre de semestre.'
                    : item.subject.toLowerCase().includes('lengua')
                    ? 'Monitorear comprensión lectora y producción escrita. Disponer lecturas guiadas y adecuaciones de tiempo para evaluaciones sumativas.'
                    : item.subject.toLowerCase().includes('música') || item.subject.toLowerCase().includes('artes')
                    ? 'Coordinar entrega de trabajos prácticos pendientes o bitácoras de proceso no presentadas por inasistencias.'
                    : 'Articular con el docente del ramo para generar evaluaciones recuperativas y portafolios de nivelación.'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
