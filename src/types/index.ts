export type RiskLevel = 'CRITICO' | 'ALTO' | 'MEDIO' | 'PREVENTIVO';

export type AlertType = 'Asistencia' | 'Desempeño' | 'Asistencia; Desempeño';

export type InterventionType = 
  | 'ENTREVISTA_APODERADO'
  | 'REFORZAMIENTO_PEDAGOGICO'
  | 'TUTORIA_PARES'
  | 'ADECUACION_CURRICULAR'
  | 'DERIVACION_PSICOSOCIAL'
  | 'COMPROMISO_ASISTENCIA'
  | 'MONITOREO_UTP'
  | 'OTRO';

export type InterventionStatus = 'COMPLETADA' | 'EN_CURSO' | 'PENDIENTE' | 'NO_ASISTE';

export interface DeficientSubject {
  name: string;
  grade: number;
}

export interface StudentRisk {
  id: string;
  name: string;
  course: string;
  cycle: 'BÁSICA' | 'MEDIA';
  level: string; // e.g., "1º Básico", "8º Básico", "1º Medio", "4º Medio"
  modality: 'TP' | 'HC' | 'Básica';
  attendance: number; // e.g. 80
  generalAverage: number; // e.g. 4.8
  rawAlert: AlertType | string;
  deficientSubjects: DeficientSubject[];
  riskLevel: RiskLevel;
  riskReasons: string[];
  lastInterventionDate?: string;
  interventionCount: number;
  statusTag: 'SIN_INTERVENCION' | 'EN_ACOMPANAMIENTO' | 'EN_ALERTA_MAXIMA' | 'SUPERADO';
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  date: string;
  type: InterventionType;
  responsible: string;
  description: string;
  agreements: string;
  status: InterventionStatus;
  nextCheckDate?: string;
  createdAt: string;
}

export interface StudentUTPNote {
  studentId: string;
  observations: string;
  statusTag: 'SIN_INTERVENCION' | 'EN_ACOMPANAMIENTO' | 'EN_ALERTA_MAXIMA' | 'SUPERADO';
  updatedAt: string;
}

export interface SubjectFailureStat {
  subject: string;
  totalFailures: number;
  averageGrade: number;
  minGrade: number;
  coursesAffected: { course: string; count: number }[];
  percentageOfTotal: number;
}
