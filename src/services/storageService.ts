import { StudentRisk, Intervention, StudentUTPNote } from '../types';
import { parseRiskCSV } from '../utils/parser';
import { INITIAL_CSV_DATA } from '../data/rawInitialCsv';

const STORAGE_KEYS = {
  STUDENTS: 'sigeutp_students_data',
  INTERVENTIONS: 'sigeutp_interventions_data',
  NOTES: 'sigeutp_notes_data',
};

const SEED_INTERVENTIONS: Intervention[] = [
  {
    id: 'int-1',
    studentId: 'cepeda_munoz_maximiliano_ignacio_1_medio_a_tp',
    studentName: 'Cepeda Muñoz Maximiliano Ignacio',
    course: '1º Medio A TP',
    date: '2026-10-14',
    type: 'ENTREVISTA_APODERADO',
    responsible: 'Profesor Jefe / UTP',
    description: 'Reunión con la madre para analizar baja asistencia (50%) y notas deficientes en Lenguaje (3.6), Matemática (3.6) y Música (2.1). Manifiestan problemas de traslado y salud en el primer trimestre.',
    agreements: 'Apoderado se compromete a justificar inasistencias médicas y supervisar horario de estudio vespertino. Alumno asistirá a reforzamiento de Matemática los martes.',
    status: 'COMPLETADA',
    nextCheckDate: '2026-11-05',
    createdAt: '2026-10-14T10:30:00Z',
  },
  {
    id: 'int-2',
    studentId: 'rebolledo_sepulveda_abner_andres_1_medio_a_tp',
    studentName: 'Rebolledo Sepúlveda Abner Andrés',
    course: '1º Medio A TP',
    date: '2026-10-18',
    type: 'REFORZAMIENTO_PEDAGOGICO',
    responsible: 'Departamento de Ciencias y Matemáticas',
    description: 'Inclusión en plan intensivo de nivelación para Matemática (nota 2.5) y Lengua (nota 2.6). Se entrega dossier de guías prioritarias.',
    agreements: 'Entrega de portafolio de nivelación el 30 de octubre. Monitoreo semanal con jefa de UTP.',
    status: 'EN_CURSO',
    nextCheckDate: '2026-10-30',
    createdAt: '2026-10-18T14:15:00Z',
  },
  {
    id: 'int-3',
    studentId: 'fritz_mundaca_renato_stephan_1_medio_c_tp',
    studentName: 'Fritz Mundaca Renato Stephan',
    course: '1º Medio C TP',
    date: '2026-10-21',
    type: 'DERIVACION_PSICOSOCIAL',
    responsible: 'Dupla Psicosocial / Convivencia Escolar',
    description: 'Asistencia crítica (41%) y 4 asignaturas con notas rojas. Derivación formal a dupla para visita domiciliaria o contacto de redes de apoyo.',
    agreements: 'Contactar a red familiar y generar plan de reincorporación gradual a la jornada escolar completa.',
    status: 'EN_CURSO',
    nextCheckDate: '2026-11-02',
    createdAt: '2026-10-21T09:00:00Z',
  },
  {
    id: 'int-4',
    studentId: 'cartes_inostroza_nicolas_francisco_2_medio_a_tp',
    studentName: 'Cartes Inostroza Nicolás Francisco',
    course: '2º Medio A TP',
    date: '2026-10-22',
    type: 'COMPROMISO_ASISTENCIA',
    responsible: 'Profesor Jefe',
    description: 'Firma de acta de compromiso por asistencia de 47% y 5 asignaturas reprobadas. Notificación formal de riesgo de repitencia bajo Decreto 67.',
    agreements: 'Asistencia diaria obligatoria sin nuevas inasistencias injustificadas. Tutoría entre pares en Historia y Lenguaje.',
    status: 'EN_CURSO',
    nextCheckDate: '2026-11-10',
    createdAt: '2026-10-22T11:45:00Z',
  },
  {
    id: 'int-5',
    studentId: 'villalobos_vergara_tomas_valentin_1_basico_a',
    studentName: 'Villalobos Vergara Tomas Valentin',
    course: '1º Básico A',
    date: '2026-10-23',
    type: 'DERIVACION_PSICOSOCIAL',
    responsible: 'Profesor Jefe / Dupla Psicosocial',
    description: 'Estudiante de 1º Básico en alerta crítica por 43% de asistencia y 5 asignaturas reprobadas (Lenguaje 2.7, Inglés 3.7, Matemática 3.9, Historia 3.6, Tecnología 3.7). Se coordina entrevista urgente con apoderado.',
    agreements: 'Plan de nivelación en lectura y cálculo inicial. Compromiso de asistencia regular y evaluación fonoaudiológica.',
    status: 'EN_CURSO',
    nextCheckDate: '2026-11-06',
    createdAt: '2026-10-23T08:30:00Z',
  },
  {
    id: 'int-6',
    studentId: 'altamirano_mejias_javier_esteban_8_basico_c',
    studentName: 'Altamirano Mejias Javier Esteban',
    course: '8º Básico C',
    date: '2026-10-24',
    type: 'REFORZAMIENTO_PEDAGOGICO',
    responsible: 'Docente de Matemática / UTP',
    description: 'Estudiante de 8º Básico con 6 asignaturas en riesgo de repitencia previa al egreso de enseñanza básica. Se genera plan de rescate académico.',
    agreements: 'Asistencia obligatoria a talleres de nivelación de Matemática (nota 2.5) y Lenguaje (nota 2.9). Entrega de portafolio el 14 de noviembre.',
    status: 'EN_CURSO',
    nextCheckDate: '2026-11-14',
    createdAt: '2026-10-24T11:00:00Z',
  }
];

export const StorageService = {
  /**
   * Loads or initializes students list
   */
  getStudents(): StudentRisk[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (stored) {
        const parsed = JSON.parse(stored) as StudentRisk[];
        // Check if stored data already includes both Básica and Media
        const hasBasica = parsed.some(
          s => s.course.toLowerCase().includes('básico') || s.course.toLowerCase().includes('basico') || s.cycle === 'BÁSICA'
        );
        const hasMedia = parsed.some(
          s => s.course.toLowerCase().includes('medio') || s.cycle === 'MEDIA'
        );
        if (hasBasica && hasMedia && parsed.length > 200) {
          return this.syncWithInterventions(parsed);
        }
      }
    } catch (e) {
      console.error('Error reading students from storage', e);
    }
    const initial = parseRiskCSV(INITIAL_CSV_DATA);
    this.saveStudents(initial);
    return this.syncWithInterventions(initial);
  },

  /**
   * Saves students to localStorage
   */
  saveStudents(students: StudentRisk[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Error saving students to storage', e);
    }
  },

  /**
   * Restores initial default data
   */
  restoreOfficialData(): StudentRisk[] {
    const initial = parseRiskCSV(INITIAL_CSV_DATA);
    this.saveStudents(initial);
    return this.syncWithInterventions(initial);
  },

  /**
   * Loads all interventions
   */
  getInterventions(): Intervention[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
      if (stored) {
        return JSON.parse(stored) as Intervention[];
      }
    } catch (e) {
      console.error('Error reading interventions', e);
    }
    // Set seed interventions
    this.saveInterventions(SEED_INTERVENTIONS);
    return SEED_INTERVENTIONS;
  },

  /**
   * Saves interventions list
   */
  saveInterventions(interventions: Intervention[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    } catch (e) {
      console.error('Error saving interventions', e);
    }
  },

  /**
   * Adds or updates an intervention
   */
  saveIntervention(intervention: Intervention): Intervention[] {
    const all = this.getInterventions();
    const index = all.findIndex(i => i.id === intervention.id);
    let updated: Intervention[];
    if (index >= 0) {
      updated = [...all];
      updated[index] = intervention;
    } else {
      updated = [intervention, ...all];
    }
    this.saveInterventions(updated);

    // Update student intervention count & last date
    const students = this.getStudents();
    const studentIdx = students.findIndex(s => s.id === intervention.studentId);
    if (studentIdx >= 0) {
      const studentInts = updated.filter(i => i.studentId === intervention.studentId);
      students[studentIdx].interventionCount = studentInts.length;
      students[studentIdx].lastInterventionDate = intervention.date;
      if (students[studentIdx].statusTag === 'SIN_INTERVENCION') {
        students[studentIdx].statusTag = 'EN_ACOMPANAMIENTO';
      }
      this.saveStudents(students);
    }

    return updated;
  },

  /**
   * Deletes an intervention
   */
  deleteIntervention(id: string): Intervention[] {
    const all = this.getInterventions();
    const toRemove = all.find(i => i.id === id);
    const updated = all.filter(i => i.id !== id);
    this.saveInterventions(updated);

    if (toRemove) {
      const students = this.getStudents();
      const studentIdx = students.findIndex(s => s.id === toRemove.studentId);
      if (studentIdx >= 0) {
        const studentInts = updated.filter(i => i.studentId === toRemove.studentId);
        students[studentIdx].interventionCount = studentInts.length;
        students[studentIdx].lastInterventionDate = studentInts.length > 0 ? studentInts[0].date : undefined;
        if (studentInts.length === 0) {
          students[studentIdx].statusTag = 'SIN_INTERVENCION';
        }
        this.saveStudents(students);
      }
    }

    return updated;
  },

  /**
   * Syncs student list with current interventions
   */
  syncWithInterventions(students: StudentRisk[]): StudentRisk[] {
    const interventions = this.getInterventions();
    return students.map(st => {
      const studentInts = interventions.filter(i => i.studentId === st.id);
      const lastDate = studentInts.length > 0
        ? [...studentInts].sort((a, b) => b.date.localeCompare(a.date))[0].date
        : undefined;

      return {
        ...st,
        interventionCount: studentInts.length,
        lastInterventionDate: lastDate,
        statusTag: studentInts.length > 0
          ? (st.statusTag === 'SIN_INTERVENCION' ? 'EN_ACOMPANAMIENTO' : st.statusTag)
          : (st.statusTag || 'SIN_INTERVENCION')
      };
    });
  },

  /**
   * Gets UTP notes
   */
  getNotes(): Record<string, StudentUTPNote> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading notes', e);
    }
    return {};
  },

  /**
   * Saves UTP note
   */
  saveNote(note: StudentUTPNote): void {
    const all = this.getNotes();
    all[note.studentId] = note;
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(all));
    } catch (e) {
      console.error('Error saving note', e);
    }
  }
};
