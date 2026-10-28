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
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentRisk } from '../types';
import { parseExcelFile, parseRiskCSV } from '../utils/parser';

interface UploadExcelModalProps {
  onDataLoaded: (newStudents: StudentRisk[]) => void;
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let parsed: StudentRisk[] = [];
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const text = await file.text();
        parsed = parseRiskCSV(text);
      } else {
        parsed = await parseExcelFile(file);
      }

      if (!parsed || parsed.length === 0) {
        throw new Error('No se detectaron alumnos válidos en el archivo. Verifique el formato de columnas.');
      }

      setParsedPreview(parsed);
      setSuccessMsg(`Archivo procesado con éxito: ${parsed.length} estudiantes detectados.`);
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

  const handleApplyData = () => {
    if (!parsedPreview) return;
    onDataLoaded(parsedPreview);
    setSuccessMsg(`¡Base de datos actualizada con éxito! Ahora se están monitoreando ${parsedPreview.length} estudiantes.`);
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
              Sube el archivo actualizado generado por tu sistema escolar (SIGE, WebClass, Syscol, etc.) para refrescar las alertas de asistencia y calificaciones.
            </p>
          </div>
        </div>

        {/* Current status */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Nómina actualmente cargada en el sistema: <strong className="text-slate-900">{currentCount} estudiantes</strong>
          </span>
          <button
            onClick={() => {
              if (confirm('¿Desea restaurar la base oficial inicial del colegio?')) {
                onRestoreOfficialData();
                setSuccessMsg('Datos oficiales iniciales restablecidos.');
                setParsedPreview(null);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Base Oficial
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
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv, .tsv"
            className="hidden"
          />

          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            Haz clic para seleccionar o arrastra tu archivo Excel / CSV aquí
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Formatos soportados: Microsoft Excel (.xlsx, .xls) o CSV delimitado por comas
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-2xs">
            Seleccionar archivo desde el equipo
          </div>
        </div>

        {/* Action feedback */}
        {loading && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium text-center">
            Procesando y validando estructura del archivo...
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
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
              2. <strong>Curso</strong> (ej. 1º Medio A TP, 2º Medio B)<br />
              3. <strong>Asignaturas insuficientes</strong> (ej. Matemática, Lengua)<br />
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

      {/* Preview Section if a file was parsed */}
      {parsedPreview && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Previsualización de Datos Detectados
              </h3>
              <p className="text-xs text-slate-500">
                Se detectaron {parsedPreview.length} estudiantes distribuidos en {new Set(parsedPreview.map(s => s.course)).size} cursos.
              </p>
            </div>

            <button
              onClick={handleApplyData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              Confirmar y Aplicar Nueva Nómina
            </button>
          </div>

          {/* Sample Table */}
          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-2.5">Estudiante</th>
                  <th className="p-2.5">Curso</th>
                  <th className="p-2.5 text-center">Asistencia</th>
                  <th className="p-2.5 text-center">Promedio</th>
                  <th className="p-2.5">Asignaturas Insuficientes</th>
                  <th className="p-2.5 text-center">Nivel Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedPreview.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-900">{s.name}</td>
                    <td className="p-2.5">{s.course}</td>
                    <td className="p-2.5 text-center font-bold">{s.attendance}%</td>
                    <td className="p-2.5 text-center font-bold">{s.generalAverage.toFixed(1)}</td>
                    <td className="p-2.5 text-slate-600">
                      {s.deficientSubjects.map(sub => `${sub.name} (${sub.grade})`).join(', ') || 'Ninguna'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {s.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedPreview.length > 10 && (
            <p className="text-[11px] text-slate-400 text-center">
              Mostrando los primeros 10 de {parsedPreview.length} estudiantes detectados.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
