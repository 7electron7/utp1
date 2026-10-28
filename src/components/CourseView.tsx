import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileDown, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  FileText, 
  ChevronRight,
  BookOpen,
  ArrowUpDown,
  UserCheck,
  UserMinus,
  Sparkles
} from 'lucide-react';
import { StudentRisk, RiskLevel } from '../types';
import { sortChileanCourses } from '../services/analyticsService';

interface CourseViewProps {
  students: StudentRisk[];
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  onSelectStudent: (student: StudentRisk) => void;
  onExportCoursePdf: (course: string) => void;
  onExportStudentPdf: (student: StudentRisk) => void;
  initialRiskFilter?: 'todos' | 'doble' | 'asistencia' | 'desempeno' | 'criticos';
}

export const CourseView: React.FC<CourseViewProps> = ({
  students,
  selectedCourse,
  setSelectedCourse,
  onSelectStudent,
  onExportCoursePdf,
  onExportStudentPdf,
  initialRiskFilter = 'todos',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'TODOS' | 'BÁSICA' | 'MEDIA'>('TODOS');
  const [levelFilter, setLevelFilter] = useState<string>('TODOS');
  const [riskFilter, setRiskFilter] = useState<string>(
    initialRiskFilter === 'criticos' ? 'CRITICO' : 'TODOS'
  );
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>(
    initialRiskFilter === 'doble'
      ? 'DOBLE'
      : initialRiskFilter === 'asistencia'
      ? 'ASISTENCIA'
      : initialRiskFilter === 'desempeno'
      ? 'NOTAS'
      : 'TODOS'
  );
  const [interventionFilter, setInterventionFilter] = useState<'TODOS' | 'CON' | 'SIN'>('TODOS');
  const [sortBy, setSortBy] = useState<'attendance' | 'grade' | 'subjects' | 'name'>('attendance');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Available unique courses with student count, sorted naturally
  const courseList = useMemo(() => {
    const map = new Map<string, { count: number; cycle: 'BÁSICA' | 'MEDIA' }>();
    for (const s of students) {
      const existing = map.get(s.course);
      if (existing) {
        existing.count++;
      } else {
        map.set(s.course, { count: 1, cycle: s.cycle });
      }
    }
    return Array.from(map.entries())
      .map(([course, data]) => ({ course, count: data.count, cycle: data.cycle }))
      .sort((a, b) => sortChileanCourses(a.course, b.course));
  }, [students]);

  // Filtered course list by cycle
  const visibleCourseList = useMemo(() => {
    if (cycleFilter === 'TODOS') return courseList;
    return courseList.filter(c => c.cycle === cycleFilter);
  }, [courseList, cycleFilter]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Cycle match
      if (cycleFilter !== 'TODOS' && s.cycle !== cycleFilter) {
        return false;
      }

      // Course match
      if (selectedCourse !== 'TODOS' && s.course !== selectedCourse) {
        return false;
      }

      // Level match
      if (levelFilter !== 'TODOS') {
        if (levelFilter === 'TP' && s.modality !== 'TP') return false;
        if (levelFilter === 'HC' && s.modality !== 'HC') return false;
        if (levelFilter === 'BÁSICA' && s.cycle !== 'BÁSICA') return false;
        if ((levelFilter.includes('Básico') || levelFilter.includes('Medio')) && s.level !== levelFilter) return false;
      }

      // Risk level match
      if (riskFilter !== 'TODOS' && s.riskLevel !== riskFilter) {
        return false;
      }

      // Alert type match
      if (alertTypeFilter !== 'TODOS') {
        const attRisk = s.attendance < 85;
        const noteRisk = s.deficientSubjects.length > 0;
        if (alertTypeFilter === 'DOBLE' && !(attRisk && noteRisk)) return false;
        if (alertTypeFilter === 'ASISTENCIA' && !(attRisk && !noteRisk)) return false;
        if (alertTypeFilter === 'NOTAS' && !(noteRisk && !attRisk)) return false;
      }

      // Intervention filter
      if (interventionFilter === 'CON' && s.interventionCount === 0) return false;
      if (interventionFilter === 'SIN' && s.interventionCount > 0) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCourse = s.course.toLowerCase().includes(q);
        const matchesSubject = s.deficientSubjects.some((sub) => sub.name.toLowerCase().includes(q));
        if (!matchesName && !matchesCourse && !matchesSubject) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'attendance') {
        comparison = a.attendance - b.attendance;
      } else if (sortBy === 'grade') {
        comparison = a.generalAverage - b.generalAverage;
      } else if (sortBy === 'subjects') {
        comparison = b.deficientSubjects.length - a.deficientSubjects.length;
      } else {
        comparison = a.name.localeCompare(b.name);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [
    students,
    selectedCourse,
    levelFilter,
    riskFilter,
    alertTypeFilter,
    interventionFilter,
    searchQuery,
    sortBy,
    sortAsc,
  ]);

  // Statistics for current filtered view
  const currentViewStats = useMemo(() => {
    const total = filteredStudents.length;
    const critical = filteredStudents.filter((s) => s.riskLevel === 'CRITICO').length;
    const lowAtt = filteredStudents.filter((s) => s.attendance < 85).length;
    const failedNotes = filteredStudents.filter((s) => s.deficientSubjects.length > 0).length;
    const withIntervention = filteredStudents.filter((s) => s.interventionCount > 0).length;
    return { total, critical, lowAtt, failedNotes, withIntervention };
  }, [filteredStudents]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Course Selector Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Monitoreo y Gestión por Curso
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona el curso para revisar la nómina de estudiantes en riesgo, registrar observaciones e intervenir
            </p>
          </div>

          {selectedCourse !== 'TODOS' && (
            <button
              onClick={() => onExportCoursePdf(selectedCourse)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <FileDown className="w-4 h-4" />
              Descargar Informe del Curso en PDF
            </button>
          )}
        </div>

        {/* Cycle shortcuts */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <span className="text-slate-400 font-semibold text-xs mr-1">Ciclo:</span>
          <button
            onClick={() => {
              setCycleFilter('TODOS');
              setLevelFilter('TODOS');
              setSelectedCourse('TODOS');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              cycleFilter === 'TODOS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todo el Colegio</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/30 text-current">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => {
              setCycleFilter('BÁSICA');
              setLevelFilter('TODOS');
              setSelectedCourse('TODOS');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              cycleFilter === 'BÁSICA'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span>Enseñanza Básica (1º - 8º)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/60 text-blue-900 font-bold">
              {students.filter(s => s.cycle === 'BÁSICA').length}
            </span>
          </button>

          <button
            onClick={() => {
              setCycleFilter('MEDIA');
              setLevelFilter('TODOS');
              setSelectedCourse('TODOS');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              cycleFilter === 'MEDIA'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <span>Enseñanza Media (1º - 4º)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-200/60 text-indigo-900 font-bold">
              {students.filter(s => s.cycle === 'MEDIA').length}
            </span>
          </button>
        </div>

        {/* Level shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Nivel:</span>
          {(cycleFilter === 'BÁSICA'
            ? ['TODOS', '1º Básico', '2º Básico', '3º Básico', '4º Básico', '5º Básico', '6º Básico', '7º Básico', '8º Básico']
            : cycleFilter === 'MEDIA'
            ? ['TODOS', '1º Medio', '2º Medio', '3º Medio', '4º Medio', 'TP', 'HC']
            : ['TODOS', 'BÁSICA', '1º Básico', '8º Básico', '1º Medio', '4º Medio', 'TP', 'HC']
          ).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap ${
                levelFilter === lvl
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl === 'TODOS'
                ? 'Todos los Niveles'
                : lvl === 'BÁSICA'
                ? 'Toda la Básica'
                : lvl === 'TP'
                ? 'Solo Técnico Prof.'
                : lvl === 'HC'
                ? 'Solo Humanista'
                : lvl}
            </button>
          ))}
        </div>

        {/* Horizontal course pill buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCourse('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCourse === 'TODOS'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>{cycleFilter === 'BÁSICA' ? 'Todos de Básica' : cycleFilter === 'MEDIA' ? 'Todos de Media' : 'Todos los Cursos'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCourse === 'TODOS' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {filteredStudents.length}
            </span>
          </button>

          {visibleCourseList.map(({ course, count }) => {
            const isSelected = selectedCourse === course;
            return (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{course}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por estudiante, curso o materia..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="md:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-700"
            >
              <option value="TODOS">Nivel de Riesgo: Todos</option>
              <option value="CRITICO">Riesgo Crítico</option>
              <option value="ALTO">Riesgo Alto</option>
              <option value="MEDIO">Riesgo Medio</option>
              <option value="PREVENTIVO">Riesgo Preventivo</option>
            </select>
          </div>

          {/* Alert Type Filter (Decreto 67) */}
          <div className="md:col-span-3">
            <select
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-700"
            >
              <option value="TODOS">Criterio: Asistencia y Notas</option>
              <option value="DOBLE">Doble Riesgo (Asistencia + Notas)</option>
              <option value="ASISTENCIA">Solo Inasistencia (&lt; 85%)</option>
              <option value="NOTAS">Solo Notas Deficientes (&lt; 4.0)</option>
            </select>
          </div>

          {/* Intervention Filter */}
          <div className="md:col-span-2">
            <select
              value={interventionFilter}
              onChange={(e) => setInterventionFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 text-slate-700"
            >
              <option value="TODOS">Intervención: Todos</option>
              <option value="CON">Con Intervención</option>
              <option value="SIN">Sin Intervención</option>
            </select>
          </div>
        </div>

        {/* View Statistics Sub-bar */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span>
              Mostrando: <strong className="text-slate-900">{filteredStudents.length}</strong> alumnos
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-red-600 font-medium">
              {currentViewStats.critical} críticos
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-blue-700">
              {currentViewStats.withIntervention} con seguimiento ({Math.round((currentViewStats.withIntervention / (currentViewStats.total || 1)) * 100)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Ordenar por:</span>
            <button
              onClick={() => {
                if (sortBy === 'attendance') setSortAsc(!sortAsc);
                else { setSortBy('attendance'); setSortAsc(true); }
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                sortBy === 'attendance' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Asistencia
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (sortBy === 'grade') setSortAsc(!sortAsc);
                else { setSortBy('grade'); setSortAsc(true); }
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                sortBy === 'grade' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Promedio
              <ArrowUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (sortBy === 'subjects') setSortAsc(!sortAsc);
                else { setSortBy('subjects'); setSortAsc(false); }
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
                sortBy === 'subjects' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ramos Rojos
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">
              No se encontraron alumnos con los filtros seleccionados
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Prueba cambiando el curso seleccionado o restableciendo los filtros de búsqueda y nivel de riesgo.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCourse('TODOS');
                setRiskFilter('TODOS');
                setAlertTypeFilter('TODOS');
                setInterventionFilter('TODOS');
                setLevelFilter('TODOS');
              }}
              className="mt-4 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-3">Curso</th>
                  <th className="py-3 px-3 text-center">Asistencia</th>
                  <th className="py-3 px-3 text-center">Promedio</th>
                  <th className="py-3 px-4">Asignaturas Deficientes (Notas)</th>
                  <th className="py-3 px-3 text-center">Nivel Riesgo</th>
                  <th className="py-3 px-3 text-center">Intervención</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredStudents.map((student) => {
                  const hasCritAtt = student.attendance < 75;
                  const hasLowAtt = student.attendance < 85;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* Name & Origin Alert */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div 
                          onClick={() => onSelectStudent(student)}
                          className="cursor-pointer hover:text-blue-600 font-semibold"
                        >
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          Alerta SIGE: {student.rawAlert}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{student.course}</span>
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {student.modality}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-extrabold text-xs px-2 py-0.5 rounded ${
                              hasCritAtt
                                ? 'bg-red-100 text-red-700 font-black'
                                : hasLowAtt
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {student.attendance}%
                          </span>
                          <div className="w-14 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                hasCritAtt
                                  ? 'bg-red-500'
                                  : hasLowAtt
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, student.attendance)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* General Average */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            student.generalAverage < 4.0
                              ? 'bg-red-600 text-white font-extrabold'
                              : student.generalAverage < 4.5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {student.generalAverage > 0 ? student.generalAverage.toFixed(1) : '-'}
                        </span>
                      </td>

                      {/* Deficient Subjects */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {student.deficientSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {student.deficientSubjects.map((sub, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 border border-red-200/80 text-red-700"
                                title={`${sub.name} con nota ${sub.grade}`}
                              >
                                <span>{sub.name}</span>
                                <strong className="font-extrabold text-red-800">
                                  {sub.grade.toFixed(1)}
                                </strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Sin notas rojas (solo inasistencias)
                          </span>
                        )}
                      </td>

                      {/* Risk Level Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            student.riskLevel === 'CRITICO'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : student.riskLevel === 'ALTO'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : student.riskLevel === 'MEDIO'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {student.riskLevel}
                        </span>
                      </td>

                      {/* Interventions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {student.interventionCount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              {student.interventionCount} registrada(s)
                            </span>
                            {student.lastInterventionDate && (
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {student.lastInterventionDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Sin registro
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => onSelectStudent(student)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                          title="Abrir ficha pedagógica y registrar intervención"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Intervenir</span>
                        </button>

                        <button
                          onClick={() => onExportStudentPdf(student)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                          title="Descargar Ficha PDF para apoderado/expediente"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="sr-only">PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
