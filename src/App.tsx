import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CourseView } from './components/CourseView';
import { SubjectsAnalyticsView } from './components/SubjectsAnalyticsView';
import { InterventionsManagerView } from './components/InterventionsManagerView';
import { UploadExcelModal } from './components/UploadExcelModal';
import { StudentModal } from './components/StudentModal';
import { StudentRisk, Intervention, StudentUTPNote, InterventionStatus } from './types';
import { StorageService } from './services/storageService';
import { PdfService } from './services/pdfService';
import { AnalyticsService } from './services/analyticsService';

export default function App() {
  const [students, setStudents] = useState<StudentRisk[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [utpNotes, setUtpNotes] = useState<Record<string, StudentUTPNote>>({});
  
  // Navigation & selection
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'subjects' | 'interventions' | 'upload'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<string>('TODOS');
  const [selectedStudent, setSelectedStudent] = useState<StudentRisk | null>(null);
  const [riskFilterType, setRiskFilterType] = useState<'todos' | 'doble' | 'asistencia' | 'desempeno' | 'criticos'>('todos');

  // Load data on mount
  useEffect(() => {
    const loadedStudents = StorageService.getStudents();
    const loadedInterventions = StorageService.getInterventions();
    const loadedNotes = StorageService.getNotes();

    setStudents(loadedStudents);
    setInterventions(loadedInterventions);
    setUtpNotes(loadedNotes);
  }, []);

  // Handlers for interventions
  const handleSaveIntervention = (intervention: Intervention) => {
    const updatedInts = StorageService.saveIntervention(intervention);
    setInterventions(updatedInts);

    // Refresh students
    const refreshedStudents = StorageService.getStudents();
    setStudents(refreshedStudents);

    // Update selected student reference if open
    if (selectedStudent && selectedStudent.id === intervention.studentId) {
      const updatedSelected = refreshedStudents.find(s => s.id === selectedStudent.id);
      if (updatedSelected) {
        setSelectedStudent(updatedSelected);
      }
    }
  };

  const handleDeleteIntervention = (id: string) => {
    const updatedInts = StorageService.deleteIntervention(id);
    setInterventions(updatedInts);

    // Refresh students
    const refreshedStudents = StorageService.getStudents();
    setStudents(refreshedStudents);

    if (selectedStudent) {
      const updatedSelected = refreshedStudents.find(s => s.id === selectedStudent.id);
      if (updatedSelected) {
        setSelectedStudent(updatedSelected);
      }
    }
  };

  const handleUpdateInterventionStatus = (id: string, newStatus: InterventionStatus) => {
    const target = interventions.find(i => i.id === id);
    if (target) {
      const updated: Intervention = { ...target, status: newStatus };
      handleSaveIntervention(updated);
    }
  };

  const handleSaveUtpNote = (note: StudentUTPNote) => {
    StorageService.saveNote(note);
    setUtpNotes(StorageService.getNotes());
  };

  // Data update handlers
  const handleDataLoaded = (newStudents: StudentRisk[], mode: 'replace' | 'merge' = 'replace') => {
    let finalStudents = newStudents;
    if (mode === 'merge') {
      const existing = StorageService.getStudents();
      const map = new Map<string, StudentRisk>();
      existing.forEach(s => map.set(s.id, s));
      newStudents.forEach(s => map.set(s.id, s));
      finalStudents = Array.from(map.values());
    }
    StorageService.saveStudents(finalStudents);
    setStudents(StorageService.getStudents());
    setSelectedCourse('TODOS');
    setActiveTab('dashboard');
  };

  const handleRestoreOfficialData = () => {
    const restored = StorageService.restoreOfficialData();
    setStudents(restored);
  };

  // PDF Export Handlers
  const handleExportMonthlyPdf = () => {
    PdfService.generateMonthlyUTPReport(students, interventions, 'Octubre 2026', 'Colegio Salesiano de Concepción');
  };

  const handleExportCoursePdf = (course: string) => {
    PdfService.generateCourseReport(course, students, interventions, 'Colegio Salesiano de Concepción');
  };

  const handleExportStudentPdf = (student: StudentRisk) => {
    const note = utpNotes[student.id];
    PdfService.generateStudentDossier(student, interventions, note, 'Colegio Salesiano de Concepción');
  };

  // Filter shortcuts from Dashboard
  const handleFilterCourse = (course: string) => {
    setSelectedCourse(course);
    setRiskFilterType('todos');
    setActiveTab('courses');
  };

  const handleFilterRiskType = (type: 'todos' | 'doble' | 'asistencia' | 'desempeno' | 'criticos') => {
    setRiskFilterType(type);
    setSelectedCourse('TODOS');
    setActiveTab('courses');
  };

  const stats = AnalyticsService.getDashboardStats(students);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Institutional Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportMonthlyPdf={handleExportMonthlyPdf}
        totalStudents={students.length}
        criticalCount={stats.criticalCount}
        courseCount={stats.totalCourses}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            interventions={interventions}
            onSelectStudent={(student) => setSelectedStudent(student)}
            onFilterCourse={handleFilterCourse}
            onFilterRiskType={handleFilterRiskType}
            onExportPdf={handleExportMonthlyPdf}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'courses' && (
          <CourseView
            students={students}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
            onSelectStudent={(student) => setSelectedStudent(student)}
            onExportCoursePdf={handleExportCoursePdf}
            onExportStudentPdf={handleExportStudentPdf}
            initialRiskFilter={riskFilterType}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsAnalyticsView
            students={students}
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setActiveTab('courses');
            }}
          />
        )}

        {activeTab === 'interventions' && (
          <InterventionsManagerView
            interventions={interventions}
            students={students}
            onSelectStudent={(student) => setSelectedStudent(student)}
            onDeleteIntervention={handleDeleteIntervention}
            onUpdateStatus={handleUpdateInterventionStatus}
            onExportPdf={handleExportMonthlyPdf}
          />
        )}

        {activeTab === 'upload' && (
          <UploadExcelModal
            onDataLoaded={handleDataLoaded}
            onRestoreOfficialData={handleRestoreOfficialData}
            currentCount={students.length}
          />
        )}
      </main>

      {/* Student Detail & Intervention Modal */}
      <StudentModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        interventions={interventions}
        onSaveIntervention={handleSaveIntervention}
        onDeleteIntervention={handleDeleteIntervention}
        onExportStudentPdf={handleExportStudentPdf}
        utpNote={selectedStudent ? utpNotes[selectedStudent.id] : undefined}
        onSaveUtpNote={handleSaveUtpNote}
      />

      {/* Institutional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-300">
              SigeUTP • Sistema de Monitoreo de Alerta Temprana y Riesgo de Repitencia
            </p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Conforme a los estándares del Decreto 67 / 2018 del Ministerio de Educación de Chile (Mineduc).
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Colegio Salesiano de Concepción • Unidad Técnico Pedagógica
          </div>
        </div>
      </footer>
    </div>
  );
}
