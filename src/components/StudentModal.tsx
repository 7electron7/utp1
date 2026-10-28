import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileDown, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ShieldAlert, 
  BookOpen, 
  FileText,
  Save,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StudentRisk, Intervention, InterventionType, InterventionStatus, StudentUTPNote } from '../types';

interface StudentModalProps {
  student: StudentRisk | null;
  isOpen: boolean;
  onClose: () => void;
  interventions: Intervention[];
  onSaveIntervention: (intervention: Intervention) => void;
  onDeleteIntervention: (id: string) => void;
  onExportStudentPdf: (student: StudentRisk) => void;
  utpNote?: StudentUTPNote;
  onSaveUtpNote: (note: StudentUTPNote) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  student,
  isOpen,
  onClose,
  interventions,
  onSaveIntervention,
  onDeleteIntervention,
  onExportStudentPdf,
  utpNote,
  onSaveUtpNote,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'new' | 'utp'>('history');

  // Form states for new intervention
  const [type, setType] = useState<InterventionType>('ENTREVISTA_APODERADO');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [responsible, setResponsible] = useState<string>('Profesor Jefe');
  const [description, setDescription] = useState<string>('');
  const [agreements, setAgreements] = useState<string>('');
  const [status, setStatus] = useState<InterventionStatus>('COMPLETADA');
  const [nextCheckDate, setNextCheckDate] = useState<string>('');

  // UTP Note states
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [noteStatusTag, setNoteStatusTag] = useState<'SIN_INTERVENCION' | 'EN_ACOMPANAMIENTO' | 'EN_ALERTA_MAXIMA' | 'SUPERADO'>('EN_ACOMPANAMIENTO');

  useEffect(() => {
    if (utpNote) {
      setInternalNotes(utpNote.observations || '');
      setNoteStatusTag(utpNote.statusTag || 'EN_ACOMPANAMIENTO');
    } else {
      setInternalNotes('');
      setNoteStatusTag('EN_ACOMPANAMIENTO');
    }
  }, [utpNote, student]);

  if (!isOpen || !student) return null;

  const studentInterventions = interventions.filter((i) => i.studentId === student.id);

  const handleSubmitIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Por favor ingrese el detalle u observaciones de la intervención.');
      return;
    }

    const newIntervention: Intervention = {
      id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      course: student.course,
      date,
      type,
      responsible: responsible.trim() || 'Profesor Jefe',
      description: description.trim(),
      agreements: agreements.trim(),
      status,
      nextCheckDate: nextCheckDate || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveIntervention(newIntervention);

    // Reset form
    setDescription('');
    setAgreements('');
    setNextCheckDate('');
    setActiveSubTab('history');
  };

  const handleSaveNote = () => {
    onSaveUtpNote({
      studentId: student.id,
      observations: internalNotes.trim(),
      statusTag: noteStatusTag,
      updatedAt: new Date().toISOString(),
    });
    alert('Observaciones de UTP guardadas correctamente.');
  };

  // Quick fill helper for teachers
  const handleQuickTemplate = (templateType: 'asistencia' | 'reforzamiento' | 'dupla' | 'guias') => {
    if (templateType === 'asistencia') {
      setType('ENTREVISTA_APODERADO');
      setResponsible('Profesor Jefe');
      setDescription(`Entrevista con apoderado por registro de asistencia crítica del ${student.attendance}% (inferior al 85% exigido por Decreto 67). Se revisan justificativos médicos pendientes y motivos de reiteradas ausencias.`);
      setAgreements('Apoderado se compromete a presentar certificados médicos en Inspectoría General y asegurar asistencia regular sin nuevas inasistencias injustificadas.');
      setStatus('COMPLETADA');
    } else if (templateType === 'reforzamiento') {
      setType('REFORZAMIENTO_PEDAGOGICO');
      setResponsible('Docente de Asignatura / UTP');
      const subjectNames = student.deficientSubjects.map(s => `${s.name} (${s.grade})`).join(', ');
      setDescription(`Incorporación al plan de reforzamiento pedagógico y nivelación académica en: ${subjectNames || 'asignaturas prioritarias'}. Se evalúan brechas de aprendizaje inicial.`);
      setAgreements('El estudiante asistirá a los talleres de nivelación en contraturno y presentará portafolio de actividades evaluadas.');
      setStatus('EN_CURSO');
    } else if (templateType === 'dupla') {
      setType('DERIVACION_PSICOSOCIAL');
      setResponsible('Dupla Psicosocial / Orientación');
      setDescription(`Derivación formal al equipo psicosocial por factores socioemocionales o familiares que impactan la asistencia (${student.attendance}%) y el rendimiento escolar.`);
      setAgreements('Entrevista psicosocial con estudiante y apoderado. Coordinación con red externa si aplica.');
      setStatus('EN_CURSO');
    } else if (templateType === 'guias') {
      setType('ADECUACION_CURRICULAR');
      setResponsible('Profesor de Asignatura');
      setDescription('Entrega de material pedagógico diferenciado y guías de autoaprendizaje para recuperación de aprendizajes clave y regularización de notas insuficientes.');
      setAgreements('Fecha de entrega de evaluaciones formativas y retroalimentación en dos semanas.');
      setStatus('EN_CURSO');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              student.riskLevel === 'CRITICO' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  {student.name}
                </h3>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  student.riskLevel === 'CRITICO'
                    ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                    : student.riskLevel === 'ALTO'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                }`}>
                  Riesgo {student.riskLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Curso: <strong className="text-slate-200">{student.course}</strong> ({student.modality === 'TP' ? 'Técnico Profesional' : 'Humanista'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportStudentPdf(student)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Descargar Ficha Oficial en PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Ficha PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[11px]">Asistencia Actual:</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-base font-extrabold ${
                  student.attendance < 75 ? 'text-red-600' : student.attendance < 85 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {student.attendance}%
                </span>
                <span className="text-[10px] text-slate-400">(Mín. 85%)</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 text-[11px]">Promedio General:</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-base font-extrabold ${
                  student.generalAverage < 4.0 ? 'text-red-600' : student.generalAverage < 4.5 ? 'text-amber-600' : 'text-slate-800'
                }`}>
                  {student.generalAverage > 0 ? student.generalAverage.toFixed(1) : '-'}
                </span>
                <span className="text-[10px] text-slate-400">(Aprobación 4.0)</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs sm:col-span-2">
              <span className="text-slate-400 text-[11px]">Asignaturas Insuficientes:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {student.deficientSubjects.length > 0 ? (
                  student.deficientSubjects.map((s, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-semibold">
                      {s.name}: <strong className="font-extrabold text-red-800">{s.grade}</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Sin notas rojas (solo alerta de inasistencia)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Decreto 67 Diagnostic message */}
          <div className="mt-2.5 p-2 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong>Diagnóstico Decreto 67: </strong>
              {student.riskReasons.join(' ')}
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historial de Intervenciones ({studentInterventions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('new')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'new'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Nueva Intervención</span>
          </button>

          <button
            onClick={() => setActiveSubTab('utp')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'utp'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Observaciones Internas UTP</span>
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Interventions History */}
          {activeSubTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Bitácora de Seguimiento y Acciones Pedagógicas
                </h4>
                <button
                  onClick={() => setActiveSubTab('new')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Acción
                </button>
              </div>

              {studentInterventions.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
                  <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Aún no se han registrado intervenciones pedagógicas para este alumno
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    El Decreto 67 exige dejar constancia escrita de las medidas de acompañamiento y entrevistas con el apoderado antes de la deliberación del consejo final de profesores.
                  </p>
                  <button
                    onClick={() => setActiveSubTab('new')}
                    className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                  >
                    Registrar Primera Intervención
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentInterventions.map((intItem) => (
                    <div
                      key={intItem.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800">
                            {intItem.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {intItem.date}
                          </span>
                          <span className="text-xs text-slate-500">
                            Por: <strong className="text-slate-700">{intItem.responsible}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            intItem.status === 'COMPLETADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : intItem.status === 'EN_CURSO'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {intItem.status}
                          </span>
                          <button
                            onClick={() => {
                              if (confirm('¿Desea eliminar este registro de intervención?')) {
                                onDeleteIntervention(intItem.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                            title="Eliminar intervención"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Observations text */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Observación Detallada:
                        </span>
                        <p className="text-xs text-slate-800 mt-0.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {intItem.description}
                        </p>
                      </div>

                      {/* Agreements and commitments */}
                      {intItem.agreements && (
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                            Acuerdos y Compromisos:
                          </span>
                          <p className="text-xs text-slate-800 mt-0.5 leading-relaxed bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                            {intItem.agreements}
                          </p>
                        </div>
                      )}

                      {intItem.nextCheckDate && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Próximo seguimiento agendado: <strong className="text-slate-700">{intItem.nextCheckDate}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: New Intervention Form */}
          {activeSubTab === 'new' && (
            <form onSubmit={handleSubmitIntervention} className="space-y-4">
              {/* Quick Template Buttons */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <span className="text-xs font-bold text-blue-900 block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Plantillas Rápidas para Profesores y UTP:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('asistencia')}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition cursor-pointer"
                  >
                    Citación por Inasistencia (&lt;85%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('reforzamiento')}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition cursor-pointer"
                  >
                    Taller de Nivelación Pedagógica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('dupla')}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition cursor-pointer"
                  >
                    Derivación a Dupla Psicosocial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('guias')}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition cursor-pointer"
                  >
                    Entrega de Guías y Adecuación
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Intervention Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Intervención:
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as InterventionType)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="ENTREVISTA_APODERADO">Entrevista con Apoderado / Citación</option>
                    <option value="REFORZAMIENTO_PEDAGOGICO">Reforzamiento / Nivelación Pedagógica</option>
                    <option value="TUTORIA_PARES">Tutoría entre Pares</option>
                    <option value="ADECUACION_CURRICULAR">Adecuación Curricular / Guías de Apoyo</option>
                    <option value="DERIVACION_PSICOSOCIAL">Derivación a Dupla Psicosocial / PIE</option>
                    <option value="COMPROMISO_ASISTENCIA">Acta de Compromiso de Asistencia</option>
                    <option value="MONITOREO_UTP">Monitoreo de Calificaciones UTP</option>
                    <option value="OTRO">Otra Acción Pedagógica</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de la Intervención:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>

                {/* Responsible Teacher / Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Docente o Profesional Responsable:
                  </label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Ej. Profesor Jefe, Prof. Matemática, UTP"
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones Detalladas y Situación Evaluada:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Detalla los antecedentes revisados con el estudiante y/o apoderado, causas detectadas de inasistencia o dificultades en asignaturas (ej. Matemática, Lenguaje), actitud del estudiante..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white leading-relaxed"
                />
              </div>

              {/* Agreements and Commitments */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acuerdos y Compromisos Asumidos:
                </label>
                <textarea
                  value={agreements}
                  onChange={(e) => setAgreements(e.target.value)}
                  rows={2}
                  placeholder="Compromisos pactados con el apoderado y el estudiante (ej. asistencia a reforzamiento los días martes, entrega de justificativos médicos, revisión semanal de libreta)..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de la Intervención:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InterventionStatus)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="COMPLETADA">Completada (Entrevista/Acción realizada)</option>
                    <option value="EN_CURSO">En Curso (Proceso de reforzamiento)</option>
                    <option value="PENDIENTE">Pendiente (Citación programada)</option>
                    <option value="NO_ASISTE">No Asiste Apoderado (Re-citar)</option>
                  </select>
                </div>

                {/* Next Check Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Próxima Fecha de Revisión / Seguimiento:
                  </label>
                  <input
                    type="date"
                    value={nextCheckDate}
                    onChange={(e) => setNextCheckDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('history')}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Intervención Pedagógica
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: UTP Notes */}
          {activeSubTab === 'utp' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Espacio Reservado para la Unidad Técnico Pedagógica:</strong> Registra diagnósticos colegiados, dictámenes preliminares del comité de evaluación y notas para la deliberación final de promoción según el Art. 11 del Decreto 67.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado General de Acompañamiento:
                </label>
                <select
                  value={noteStatusTag}
                  onChange={(e) => setNoteStatusTag(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="EN_ACOMPANAMIENTO">En Acompañamiento Activo</option>
                  <option value="EN_ALERTA_MAXIMA">En Alerta Máxima (Caso Crítico UTP)</option>
                  <option value="SUPERADO">Riesgo Superado / Mejoría Sostenida</option>
                  <option value="SIN_INTERVENCION">Sin Acompañamiento Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones y Consideraciones Técnicas de UTP:
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={6}
                  placeholder="Anota acuerdos con Dirección, antecedentes presentados en consejos de evaluación, consideraciones de vulnerabilidad, historial previo..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Observaciones UTP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            ID Estudiante: <code className="text-slate-700 font-mono text-[10px]">{student.id}</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
