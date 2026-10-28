import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileDown, 
  Info,
  Download,
  Eye,
  ShieldCheck,
  PlusCircle,
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentRisk } from '../types';
import { parseExcelFile, parseRiskCSV } from '../utils/parser';

interface UploadExcelModalProps {
  onDataLoaded: (newStudents: StudentRisk[], mode?: 'replace' | 'merge') => void;
  onRestoreOfficialData: () => void;
  currentCount: number;
}

export const UploadExcelModal: React.FC<UploadExcelModalProps> = ({
  onDataLoaded,
  onRestoreOfficialData,
  currentCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<StudentRisk[] | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);

    try {
      let parsed: StudentRisk[] = [];
      const lower = file.name.toLowerCase();
      
      if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
        const text = await file.text();
        parsed = parseRiskCSV(text);
      } else {
        parsed = await parseExcelFile(file);
      }

      if (!parsed || parsed.length === 0) {
        throw new Error('No se detectaron alumnos válidos en el archivo. Verifique que contenga las columnas de estudiante, curso, asistencia o notas.');
      }

      setParsedPreview(parsed);
      setSuccessMsg(`Archivo "${file.name}" leído correctamente: ${parsed.length} estudiantes detectados.`);
    } catch (err: any) {
      console.error('Error procesando archivo', err);
      setErrorMsg(err.message || 'Error al procesar el archivo. Asegúrese de que sea un archivo Excel (.xlsx, .xls) o CSV válido.');
      setParsedPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input value so re-uploading the same file works
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyData = (mode: 'replace' | 'merge') => {
    if (!parsedPreview) return;
    onDataLoaded(parsedPreview, mode);
    setSuccessMsg(
      mode === 'replace'
        ? `¡Datos actualizados con éxito! Ahora se monitorean ${parsedPreview.length} estudiantes.`
        : `¡Datos anexados con éxito! Los nuevos estudiantes han sido sumados a la nómina.`
    );
    setParsedPreview(null);
  };

  const handleDownloadTemplate = () => {
    const templateCSV = `Estudiante,Curso,Asignaturas insuficientes,Nota,% de Asistencia,Promedio general,Alerta
González Pérez Juan Carlos,1º Medio A TP,Matemática,"3,4",78,"4,8",Asistencia; Desempeño
,,Lengua y Literatura,"3,2",,,
Morales Silva Francisca,1º Medio A TP,-,,80,"5,6",Asistencia
Tapia Castro Matías,1º Medio B TP,Tecnología,"3,8",92,"4,9",Desempeño`;

    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Riesgo_Repitencia_UTP.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Cargar y Actualizar Nómina Escolar (Excel / CSV)
            </h2>
            <p className="text-xs text-slate-500">
              Sube el archivo actualizado generado por tu sistema escolar (SIGE, WebClass, Syscol, NotasNet, etc.) para refrescar las alertas de asistencia y calificaciones.
            </p>
          </div>
        </div>

        {/* Current status */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">
            Nómina actualmente cargada en el sistema: <strong className="text-slate-900">{currentCount} estudiantes</strong>
          </span>
          <button
            onClick={() => {
              if (confirm('¿Desea restaurar la base oficial inicial del colegio (Enseñanza Básica y Media)?')) {
                onRestoreOfficialData();
                setSuccessMsg('Datos oficiales iniciales restablecidos.');
                setParsedPreview(null);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Base Oficial (Básica + Media)
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv, .txt, .tsv"
            className="hidden"
          />

          <Upload className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            Haz clic para seleccionar o arrastra tu archivo Excel / CSV aquí
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Formatos soportados: Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) o texto delimitado (<strong>.csv</strong> con comas o punto y coma)
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-sm transition active:scale-95">
            Seleccionar archivo desde el computador
          </div>
        </div>

        {/* Action feedback */}
        {loading && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold text-center animate-pulse">
            Procesando y validando estructura del archivo...
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && !parsedPreview && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* File Format Guidance */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              Columnas Esperadas en el Archivo:
            </h4>
            <p className="text-[11px] text-slate-500">
              1. <strong>Estudiante</strong> (Nombre completo)<br />
              2. <strong>Curso</strong> (ej. 1º Básico A, 1º Medio A TP, etc.)<br />
              3. <strong>Asignaturas insuficientes</strong> (ej. Matemática, Lenguaje)<br />
              4. <strong>Nota</strong> (ej. 3,6 o 2,9)<br />
              5. <strong>% de Asistencia</strong> (ej. 75 u 80)<br />
              6. <strong>Promedio general</strong> (ej. 4,8)<br />
              7. <strong>Alerta</strong> (Asistencia, Desempeño, o ambas)
            </p>
          </div>

          <div className="flex flex-col justify-end items-start md:items-end">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla de Ejemplo (.CSV)
            </button>
            <span className="text-[10px] text-slate-400 mt-1">
              Úsala como guía de formato para exportar desde tu SIGE escolar.
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Confirmation Action Banner & Preview Section */}
      {parsedPreview && (
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/80 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header of Preview */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Archivo Validado: {fileName || 'Archivo Nuevo'}
                </h3>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Se detectaron <strong className="font-black text-slate-900">{parsedPreview.length} estudiantes</strong> en{' '}
                  <strong className="font-black text-slate-900">{new Set(parsedPreview.map(s => s.course)).size} cursos</strong>.
                </p>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleApplyData('replace')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 cursor-pointer"
                title="Reemplaza la nómina completa con los estudiantes de este archivo"
              >
                <ShieldCheck className="w-4 h-4" />
                Reemplazar toda la nómina ({parsedPreview.length})
              </button>

              <button
                onClick={() => handleApplyData('merge')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white shadow-md transition active:scale-95 cursor-pointer"
                title="Consolida y suma estos estudiantes a los que ya estaban en el sistema"
              >
                <PlusCircle className="w-4 h-4" />
                Sumar a la nómina actual
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              Previsualización de los primeros 10 estudiantes leídos:
            </span>
            <span className="text-[11px] text-slate-400">
              Presiona cualquiera de los botones verdes/azules arriba para confirmar la carga.
            </span>
          </div>

          {/* Sample Table */}
          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3">Estudiante</th>
                  <th className="p-3">Curso</th>
                  <th className="p-3 text-center">Asistencia</th>
                  <th className="p-3 text-center">Promedio</th>
                  <th className="p-3">Asignaturas Insuficientes</th>
                  <th className="p-3 text-center">Nivel Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedPreview.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3">{s.course}</td>
                    <td className="p-3 text-center font-bold text-slate-800">{s.attendance}%</td>
                    <td className="p-3 text-center font-bold text-slate-800">{s.generalAverage.toFixed(1)}</td>
                    <td className="p-3 text-slate-600">
                      {s.deficientSubjects.map(sub => `${sub.name} (${sub.grade})`).join(', ') || 'Ninguna'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.riskLevel === 'CRITICO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {s.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              ¿Deseas aplicar estos datos ahora mismo?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setParsedPreview(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Descartar
              </button>
              <button
                onClick={() => handleApplyData('replace')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer"
              >
                Confirmar y Aplicar
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
