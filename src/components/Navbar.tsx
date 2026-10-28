import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Upload, 
  FileDown, 
  GraduationCap, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'courses' | 'subjects' | 'interventions' | 'upload';
  setActiveTab: (tab: 'dashboard' | 'courses' | 'subjects' | 'interventions' | 'upload') => void;
  onExportMonthlyPdf: () => void;
  totalStudents: number;
  criticalCount: number;
  courseCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onExportMonthlyPdf,
  totalStudents,
  criticalCount,
  courseCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top institution bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-inner">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  SigeUTP
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-400/30">
                  Decreto 67
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Colegio Salesiano de Concepción • Unidad Técnico Pedagógica
              </p>
            </div>
          </div>

          {/* Quick Stats Badges & PDF Action */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-xs">
              <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700/80 text-slate-300">
                <span className="text-slate-400 mr-1">Cursos:</span>
                <strong className="text-white">{courseCount}</strong>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700/80 text-slate-300">
                <span className="text-slate-400 mr-1">En Riesgo:</span>
                <strong className="text-amber-400">{totalStudents}</strong>
              </div>
              {criticalCount > 0 && (
                <div className="px-2.5 py-1 rounded bg-red-950/60 border border-red-700/60 text-red-300 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Críticos: {criticalCount}</span>
                </div>
              )}
            </div>

            <button
              onClick={onExportMonthlyPdf}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
              title="Descargar Informe Mensual UTP en formato PDF"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Reporte Mensual UTP</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Panel General</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Monitoreo por Curso</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Asignaturas más Reprobadas</span>
          </button>

          <button
            onClick={() => setActiveTab('interventions')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'interventions'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Intervenciones Pedagógicas</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Cargar Excel / Datos</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
