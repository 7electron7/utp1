import { StudentRisk, SubjectFailureStat } from '../types';

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  preventiveCount: number;
  attendanceOnlyCount: number;
  academicOnlyCount: number;
  doubleRiskCount: number;
  attendanceCriticalUnder75: number;
  attendanceWarning75to84: number;
  threeOrMoreFailures: number;
  withInterventionsCount: number;
  withoutInterventionsCount: number;
  coveragePercentage: number;
  averageSchoolAttendance: number;
  averageSchoolGeneralGrade: number;
}

export interface CourseSummary {
  course: string;
  level: string;
  modality: 'TP' | 'HC';
  total: number;
  critical: number;
  high: number;
  medium: number;
  preventive: number;
  doubleRisk: number;
  attendanceAlerts: number;
  academicAlerts: number;
  interventionsLogged: number;
  avgAttendance: number;
  avgGrade: number;
}

export const AnalyticsService = {
  /**
   * Computes comprehensive dashboard statistics
   */
  getDashboardStats(students: StudentRisk[]): DashboardStats {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        totalCourses: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        preventiveCount: 0,
        attendanceOnlyCount: 0,
        academicOnlyCount: 0,
        doubleRiskCount: 0,
        attendanceCriticalUnder75: 0,
        attendanceWarning75to84: 0,
        threeOrMoreFailures: 0,
        withInterventionsCount: 0,
        withoutInterventionsCount: 0,
        coveragePercentage: 0,
        averageSchoolAttendance: 0,
        averageSchoolGeneralGrade: 0,
      };
    }

    const coursesSet = new Set(students.map(s => s.course));
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let preventiveCount = 0;

    let attendanceOnlyCount = 0;
    let academicOnlyCount = 0;
    let doubleRiskCount = 0;

    let attendanceCriticalUnder75 = 0;
    let attendanceWarning75to84 = 0;
    let threeOrMoreFailures = 0;

    let withInterventionsCount = 0;
    let totalAttendanceSum = 0;
    let totalGradeSum = 0;
    let validGradeCount = 0;

    for (const st of students) {
      // Risk Level
      if (st.riskLevel === 'CRITICO') criticalCount++;
      else if (st.riskLevel === 'ALTO') highCount++;
      else if (st.riskLevel === 'MEDIO') mediumCount++;
      else preventiveCount++;

      // Alert Type categorization
      const hasAttendanceRisk = st.attendance < 85;
      const hasAcademicRisk = st.deficientSubjects.length > 0;

      if (hasAttendanceRisk && hasAcademicRisk) {
        doubleRiskCount++;
      } else if (hasAttendanceRisk) {
        attendanceOnlyCount++;
      } else if (hasAcademicRisk) {
        academicOnlyCount++;
      }

      // Early Warning breakdown
      if (st.attendance < 75) {
        attendanceCriticalUnder75++;
      } else if (st.attendance < 85) {
        attendanceWarning75to84++;
      }

      if (st.deficientSubjects.length >= 3) {
        threeOrMoreFailures++;
      }

      if (st.interventionCount > 0) {
        withInterventionsCount++;
      }

      totalAttendanceSum += st.attendance;
      if (st.generalAverage > 0) {
        totalGradeSum += st.generalAverage;
        validGradeCount++;
      }
    }

    const totalStudents = students.length;
    const withoutInterventionsCount = totalStudents - withInterventionsCount;
    const coveragePercentage = totalStudents > 0 ? Math.round((withInterventionsCount / totalStudents) * 100) : 0;
    const averageSchoolAttendance = totalStudents > 0 ? Math.round(totalAttendanceSum / totalStudents) : 0;
    const averageSchoolGeneralGrade = validGradeCount > 0 ? Math.round((totalGradeSum / validGradeCount) * 10) / 10 : 0;

    return {
      totalStudents,
      totalCourses: coursesSet.size,
      criticalCount,
      highCount,
      mediumCount,
      preventiveCount,
      attendanceOnlyCount,
      academicOnlyCount,
      doubleRiskCount,
      attendanceCriticalUnder75,
      attendanceWarning75to84,
      threeOrMoreFailures,
      withInterventionsCount,
      withoutInterventionsCount,
      coveragePercentage,
      averageSchoolAttendance,
      averageSchoolGeneralGrade,
    };
  },

  /**
   * Calculates rankings of most failed subjects
   */
  getMostFailedSubjects(students: StudentRisk[]): SubjectFailureStat[] {
    const subjectMap = new Map<
      string,
      {
        totalFailures: number;
        grades: number[];
        courses: Map<string, number>;
      }
    >();

    let totalIndividualFailures = 0;

    for (const st of students) {
      for (const subj of st.deficientSubjects) {
        totalIndividualFailures++;
        const normName = subj.name.trim();
        if (!subjectMap.has(normName)) {
          subjectMap.set(normName, {
            totalFailures: 0,
            grades: [],
            courses: new Map(),
          });
        }
        const entry = subjectMap.get(normName)!;
        entry.totalFailures++;
        if (subj.grade > 0) {
          entry.grades.push(subj.grade);
        }
        entry.courses.set(st.course, (entry.courses.get(st.course) || 0) + 1);
      }
    }

    const result: SubjectFailureStat[] = [];

    subjectMap.forEach((data, subject) => {
      const avgGrade = data.grades.length > 0
        ? Math.round((data.grades.reduce((a, b) => a + b, 0) / data.grades.length) * 10) / 10
        : 0;
      const minGrade = data.grades.length > 0 ? Math.min(...data.grades) : 0;

      const coursesAffected = Array.from(data.courses.entries())
        .map(([course, count]) => ({ course, count }))
        .sort((a, b) => b.count - a.count);

      const percentageOfTotal = totalIndividualFailures > 0
        ? Math.round((data.totalFailures / totalIndividualFailures) * 100)
        : 0;

      result.push({
        subject,
        totalFailures: data.totalFailures,
        averageGrade: avgGrade,
        minGrade,
        coursesAffected,
        percentageOfTotal,
      });
    });

    return result.sort((a, b) => b.totalFailures - a.totalFailures);
  },

  /**
   * Summarizes students by Course
   */
  getCourseSummaries(students: StudentRisk[]): CourseSummary[] {
    const courseMap = new Map<string, StudentRisk[]>();

    for (const st of students) {
      if (!courseMap.has(st.course)) {
        courseMap.set(st.course, []);
      }
      courseMap.get(st.course)!.push(st);
    }

    const summaries: CourseSummary[] = [];

    courseMap.forEach((courseStudents, course) => {
      let critical = 0;
      let high = 0;
      let medium = 0;
      let preventive = 0;
      let doubleRisk = 0;
      let attendanceAlerts = 0;
      let academicAlerts = 0;
      let interventionsLogged = 0;
      let totalAtt = 0;
      let totalGrade = 0;
      let gradeCount = 0;

      for (const s of courseStudents) {
        if (s.riskLevel === 'CRITICO') critical++;
        else if (s.riskLevel === 'ALTO') high++;
        else if (s.riskLevel === 'MEDIO') medium++;
        else preventive++;

        const attRisk = s.attendance < 85;
        const acadRisk = s.deficientSubjects.length > 0;
        if (attRisk && acadRisk) doubleRisk++;
        if (attRisk) attendanceAlerts++;
        if (acadRisk) academicAlerts++;

        interventionsLogged += s.interventionCount;
        totalAtt += s.attendance;
        if (s.generalAverage > 0) {
          totalGrade += s.generalAverage;
          gradeCount++;
        }
      }

      const total = courseStudents.length;
      summaries.push({
        course,
        level: courseStudents[0]?.level || '',
        modality: courseStudents[0]?.modality || 'HC',
        total,
        critical,
        high,
        medium,
        preventive,
        doubleRisk,
        attendanceAlerts,
        academicAlerts,
        interventionsLogged,
        avgAttendance: total > 0 ? Math.round(totalAtt / total) : 0,
        avgGrade: gradeCount > 0 ? Math.round((totalGrade / gradeCount) * 10) / 10 : 0,
      });
    });

    // Natural sort: 1º Medio before 2º Medio, A before B, HC before TP, etc.
    return summaries.sort((a, b) => a.course.localeCompare(b.course, 'es', { numeric: true }));
  },

  /**
   * Retrieves high-priority early warning students (critical cases)
   */
  getEarlyWarningStudents(students: StudentRisk[]): StudentRisk[] {
    return students
      .filter(s => s.riskLevel === 'CRITICO' || s.attendance < 70 || s.deficientSubjects.length >= 3)
      .sort((a, b) => {
        // Sort by risk priority: critical first, then lowest attendance, then most failed subjects
        if (a.riskLevel === 'CRITICO' && b.riskLevel !== 'CRITICO') return -1;
        if (b.riskLevel === 'CRITICO' && a.riskLevel !== 'CRITICO') return 1;
        if (a.attendance !== b.attendance) return a.attendance - b.attendance;
        return b.deficientSubjects.length - a.deficientSubjects.length;
      });
  }
};
