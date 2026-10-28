import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Intervention, InterventionType, InterventionStatus, StudentRisk } from '../types';

interface InterventionsManagerViewProps {
  interventions: Intervention[];
  students: StudentRisk[];
  onSelectStudent: (student: StudentRisk) => void;
  onDeleteIntervention: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: InterventionStatus) => void;
  onExportPdf: () => void;
}

export const InterventionsManagerView: React.FC<InterventionsManagerViewProps> = ({
  interventions,
  students,
  onSelectStudent,
  onDeleteIntervention,
  onUpdateStatus,
  onExportPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [courseFilter, setCourseFilter] = useState<string>('TODOS');

  // Courses list
  const courses = useMemo(() => {
    const set = new Set<string>();
    interventions.forEach((i) => set.add(i.course));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  }, [interventions]);

  // Filtered interventions
  const filteredInterventions = useMemo(() => {
    return interventions.filter((i) => {
      if (typeFilter !== 'TODOS' && i.type !== typeFilter) return false;
      if (statusFilter !== 'TODOS' && i.status !== statusFilter) return false;
      if (courseFilter !== 'TODOS' && i.course !== courseFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = i.studentName.toLowerCase().includes(q);
        const matchResp = i.responsible.toLowerCase().includes(q);
        const matchDesc = i.description.toLowerCase().includes(q);
        const matchCourse = i.course.toLowerCase().includes(q);
        if (!matchName && !matchResp && !matchDesc && !matchCourse) return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [interventions, typeFilter, statusFilter, courseFilter, searchQuery]);

  // Quick stats
  const stats = useMemo(() => {
    const total = interventions.length;
    const completed = interventions.filter((i) => i.status === 'COMPLETADA').length;
    const inProgress = interventions.filter((i) => i.status === 'EN_CURSO').length;
    const interviews = interventions.filter((i) => i.type === 'ENTREVISTA_APODERADO').length;
    const reinforcement = interventions.filter((i) => i.type === 'REFORZAMIENTO_PEDAGOGICO').length;
    return { total, completed, inProgress, interviews, reinforcement };
  }, [interventions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Gestión Institucional de Intervenciones Pedagógicas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro y seguimiento de entrevistas con apoderados, reforzamientos, acuerdos y compromisos asumidos
          </p>
        </div>

        <button
          onClick={onExportPdf}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          Descargar Informe Ejecutivo PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Intervenciones
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {stats.total}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registradas en el sistema
          </p>
        </div>

        <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Completadas
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-800">
            {stats.completed}
          </div>
          <p className="text-xs text-emerald-700 mt-0.5">
            Entrevistas y actas cerradas
          </p>
        </div>

        <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            En Curso / Reforzamiento
          </span>
          <div className="mt-2 text-2xl font-black text-blue-800">
            {stats.inProgress}
          </div>
          <p className="text-xs text-blue-700 mt-0.5">
            Planes activos con seguimiento
          </p>
        </div>

        <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 shadow-2xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Entrevistas a Apoderados
          </span>
          <div className="mt-2 text-2xl font-black text-amber-800">
            {stats.interviews}
          </div>
          <p className="text-xs text-amber-700 mt-0.5">
            Citaciones formales registradas
          </p>
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
              placeholder="Buscar por estudiante, docente responsable o detalle..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="TODOS">Tipo: Todas las intervenciones</option>
              <option value="ENTREVISTA_APODERADO">Entrevista con Apoderado</option>
              <option value="REFORZAMIENTO_PEDAGOGICO">Reforzamiento Pedagógico</option>
              <option value="TUTORIA_PARES">Tutoría entre Pares</option>
              <option value="ADECUACION_CURRICULAR">Adecuación Curricular</option>
              <option value="DERIVACION_PSICOSOCIAL">Derivación a Dupla Psicosocial</option>
              <option value="COMPROMISO_ASISTENCIA">Compromiso de Asistencia</option>
              <option value="MONITOREO_UTP">Monitoreo UTP</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="TODOS">Estado: Todos</option>
              <option value="COMPLETADA">Completada</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="NO_ASISTE">No Asiste Apoderado</option>
            </select>
          </div>

          {/* Course Filter */}
          <div className="md:col-span-2">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="TODOS">Curso: Todos</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interventions List */}
      <div className="space-y-3">
        {filteredInterventions.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No se encontraron intervenciones con los filtros aplicados
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando la búsqueda o restableciendo los filtros de tipo y estado.
            </p>
          </div>
        ) : (
          filteredInterventions.map((item) => {
            const studentRef = students.find((s) => s.id === item.studentId);

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 
                        onClick={() => studentRef && onSelectStudent(studentRef)}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                      >
                        {item.studentName}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {item.course}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.date}
                      </span>
                      <span>•</span>
                      <span>
                        Responsable: <strong className="text-slate-700">{item.responsible}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => onUpdateStatus(item.id, e.target.value as InterventionStatus)}
                      className={`text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer ${
                        item.status === 'COMPLETADA'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : item.status === 'EN_CURSO'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <option value="COMPLETADA">Completada</option>
                      <option value="EN_CURSO">En Curso</option>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="NO_ASISTE">No Asiste</option>
                    </select>

                    {studentRef && (
                      <button
                        onClick={() => onSelectStudent(studentRef)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar esta intervención?')) {
                          onDeleteIntervention(item.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Observaciones Detalladas:
                  </span>
                  <p className="text-xs text-slate-800 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Commitments */}
                {item.agreements && (
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                      Compromisos y Acuerdos:
                    </span>
                    <p className="text-xs text-slate-800 mt-1 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 leading-relaxed">
                      {item.agreements}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
