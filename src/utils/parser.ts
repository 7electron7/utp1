import * as XLSX from 'xlsx';
import { StudentRisk, DeficientSubject, RiskLevel } from '../types';

/**
 * Parses Chilean decimal numbers (e.g., "3,6" or 3.6 or "4.8" or 2)
 */
export function parseGrade(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.round(val * 10) / 10;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 10) / 10;
}

/**
 * Parses attendance percentage (e.g. 83, "83", "83%")
 */
export function parseAttendance(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.round(val);
  const clean = String(val).replace('%', '').trim().replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Determines educational risk level based on Decreto 67 / 2018 (Chile)
 */
export function computeRiskLevel(
  attendance: number,
  average: number,
  failedSubjects: DeficientSubject[]
): { riskLevel: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  const countFailed = failedSubjects.length;

  const lowAttendance = attendance < 85;
  const criticalAttendance = attendance < 75;
  const severeAttendance = attendance < 55;

  if (severeAttendance) {
    reasons.push(`Asistencia extremadamente baja (${attendance}%), muy inferior al 85% reglamentario.`);
  } else if (criticalAttendance) {
    reasons.push(`Asistencia crítica (${attendance}%): Inasistencia acumulada pone en riesgo la promoción.`);
  } else if (lowAttendance) {
    reasons.push(`Asistencia insuficiente (${attendance}%): Inferior al mínimo de 85% para promoción directa.`);
  }

  // Academic criteria (Decreto 67 Art. 10 y 11)
  if (countFailed >= 3) {
    reasons.push(`Acumula ${countFailed} asignaturas reprobadas (${failedSubjects.map(s => `${s.name}: ${s.grade}`).join(', ')}).`);
  } else if (countFailed === 2) {
    if (average < 5.0) {
      reasons.push(`2 asignaturas reprobadas y promedio general (${average}) inferior a 5.0 (Art. 11 Dec. 67).`);
    } else {
      reasons.push(`2 asignaturas reprobadas (${failedSubjects.map(s => `${s.name}: ${s.grade}`).join(', ')}).`);
    }
  } else if (countFailed === 1) {
    if (average < 4.5) {
      reasons.push(`1 asignatura reprobada y promedio general (${average}) inferior a 4.5 (Art. 11 Dec. 67).`);
    } else {
      reasons.push(`1 asignatura reprobada (${failedSubjects[0].name} con nota ${failedSubjects[0].grade}).`);
    }
  }

  if (average < 4.5 && average > 0) {
    reasons.push(`Promedio general en zona de riesgo (${average}).`);
  }

  let riskLevel: RiskLevel = 'PREVENTIVO';

  if (
    severeAttendance ||
    (criticalAttendance && countFailed >= 1) ||
    (countFailed >= 3 && average < 4.5) ||
    (countFailed >= 4) ||
    (lowAttendance && countFailed >= 2 && average < 5.0)
  ) {
    riskLevel = 'CRITICO';
  } else if (
    criticalAttendance ||
    (lowAttendance && countFailed >= 1) ||
    (countFailed >= 2 && average < 5.0) ||
    (countFailed === 1 && average < 4.5) ||
    countFailed >= 2
  ) {
    riskLevel = 'ALTO';
  } else if (lowAttendance || countFailed === 1) {
    riskLevel = 'MEDIO';
  } else {
    riskLevel = 'PREVENTIVO';
  }

  return { riskLevel, reasons };
}

/**
 * Extracts Course Level, Cycle (Básica vs Media) and Modality (TP vs HC vs Básica)
 */
export function extractCourseDetails(course: string): {
  level: string;
  cycle: 'BÁSICA' | 'MEDIA';
  modality: 'TP' | 'HC' | 'Básica';
} {
  const norm = course.trim();
  const isBasica = norm.toLowerCase().includes('básico') || norm.toLowerCase().includes('basico');
  
  if (isBasica) {
    let level = '1º Básico';
    for (let i = 8; i >= 1; i--) {
      if (norm.includes(`${i}º`) || norm.includes(`${i}°`)) {
        level = `${i}º Básico`;
        break;
      }
    }
    return { level, cycle: 'BÁSICA', modality: 'Básica' };
  } else {
    let level = '1º Medio';
    for (let i = 4; i >= 1; i--) {
      if (norm.includes(`${i}º`) || norm.includes(`${i}°`)) {
        level = `${i}º Medio`;
        break;
      }
    }
    const modality: 'TP' | 'HC' = norm.toUpperCase().includes('TP') ? 'TP' : 'HC';
    return { level, cycle: 'MEDIA', modality };
  }
}

/**
 * Generates consistent student ID
 */
export function generateStudentId(name: string, course: string): string {
  return `${name.trim().toLowerCase()}_${course.trim().toLowerCase()}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');
}

/**
 * Parses raw CSV content where subsequent rows for the same student have empty student/course cells
 */
export function parseRiskCSV(csvContent: string): StudentRisk[] {
  // Normalize line endings
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const studentsMap = new Map<string, StudentRisk>();
  let currentStudent: StudentRisk | null = null;

  // Simple CSV line parser respecting quotes
  function parseCSVLine(text: string): string[] {
    const p: string[] = [];
    let insideQuotes = false;
    let token = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        p.push(token.trim());
        token = '';
      } else {
        token += char;
      }
    }
    p.push(token.trim());
    return p;
  }

  // Find header index
  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  const estIdx = header.findIndex(h => h.includes('estudiante') || h.includes('alumno'));
  const curIdx = header.findIndex(h => h.includes('curso'));
  const asigIdx = header.findIndex(h => h.includes('asignatura') || h.includes('insuficiente'));
  const notaIdx = header.findIndex(h => h.includes('nota'));
  const asistIdx = header.findIndex(h => h.includes('asistencia'));
  const promIdx = header.findIndex(h => h.includes('promedio'));
  const alertIdx = header.findIndex(h => h.includes('alerta'));

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const studentName = (row[estIdx !== -1 ? estIdx : 0] || '').trim();
    const course = (row[curIdx !== -1 ? curIdx : 1] || '').trim();
    const subjectRaw = (row[asigIdx !== -1 ? asigIdx : 2] || '').trim();
    const gradeRaw = row[notaIdx !== -1 ? notaIdx : 3] || '';
    const attendanceRaw = row[asistIdx !== -1 ? asistIdx : 4] || '';
    const avgRaw = row[promIdx !== -1 ? promIdx : 5] || '';
    const alertRaw = (row[alertIdx !== -1 ? alertIdx : 6] || '').trim();

    if (studentName) {
      const id = generateStudentId(studentName, course);
      const { level, cycle, modality } = extractCourseDetails(course);
      const attendance = parseAttendance(attendanceRaw);
      const generalAverage = parseGrade(avgRaw);

      const deficientSubjects: DeficientSubject[] = [];
      if (subjectRaw && subjectRaw !== '-') {
        const grade = parseGrade(gradeRaw);
        deficientSubjects.push({ name: subjectRaw, grade });
      }

      const { riskLevel, reasons } = computeRiskLevel(attendance, generalAverage, deficientSubjects);

      currentStudent = {
        id,
        name: studentName,
        course: course || 'Sin Curso',
        cycle,
        level,
        modality,
        attendance,
        generalAverage,
        rawAlert: alertRaw || (deficientSubjects.length > 0 && attendance < 85 ? 'Asistencia; Desempeño' : attendance < 85 ? 'Asistencia' : 'Desempeño'),
        deficientSubjects,
        riskLevel,
        riskReasons: reasons,
        interventionCount: 0,
        statusTag: 'SIN_INTERVENCION',
      };

      studentsMap.set(id, currentStudent);
    } else if (currentStudent && subjectRaw && subjectRaw !== '-') {
      // Continuation of previous student's subjects
      const grade = parseGrade(gradeRaw);
      currentStudent.deficientSubjects.push({ name: subjectRaw, grade });

      // Recompute risk level with updated subjects
      const { riskLevel, reasons } = computeRiskLevel(
        currentStudent.attendance,
        currentStudent.generalAverage,
        currentStudent.deficientSubjects
      );
      currentStudent.riskLevel = riskLevel;
      currentStudent.riskReasons = reasons;
    }
  }

  return Array.from(studentsMap.values());
}

/**
 * Parses XLSX / XLS / CSV from ArrayBuffer or File
 */
export async function parseExcelFile(file: File): Promise<StudentRisk[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert worksheet to CSV string and parse
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  return parseRiskCSV(csvContent);
}
