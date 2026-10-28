import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentRisk, Intervention, StudentUTPNote } from '../types';
import { AnalyticsService } from './analyticsService';

export const PdfService = {
  /**
   * Generates Executive Monthly UTP Report (PDF)
   */
  generateMonthlyUTPReport(
    students: StudentRisk[],
    interventions: Intervention[],
    monthYear: string = 'Octubre 2026',
    schoolName: string = 'Colegio Salesiano de Concepción'
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const stats = AnalyticsService.getDashboardStats(students);
    const courseSummaries = AnalyticsService.getCourseSummaries(students);
    const topSubjects = AnalyticsService.getMostFailedSubjects(students).slice(0, 8);
    const criticalStudents = AnalyticsService.getEarlyWarningStudents(students).slice(0, 15);

    // Header branding
    doc.setFillColor(15, 44, 89); // Deep Navy
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(schoolName.toUpperCase(), 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('UNIDAD TÉCNICO PEDAGÓGICA (UTP) - MONITOREO DE ALERTA TEMPRANA', 14, 17);
    doc.text(`PERÍODO: ${monthYear.toUpperCase()} | NORMATIVA: DECRETO 67 / 2018`, 14, 22);

    // Date printed right aligned
    doc.setFontSize(8);
    doc.text(`Fecha emisión: ${new Date().toLocaleDateString('es-CL')}`, 196, 22, { align: 'right' });

    let currentY = 33;

    // Title
    doc.setTextColor(20, 30, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('INFORME EJECUTIVO MENSUAL: RIESGO DE REPITENCIA Y ACOMPAÑAMIENTO', 14, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 105);
    doc.text(
      'Análisis preventivo conforme a la normativa escolar chilena para salvaguardar trayectorias educativas y evitar deserción.',
      14,
      currentY
    );

    currentY += 6;

    // KPI Summary boxes (Row of 4 metrics)
    const boxW = 43;
    const boxH = 17;
    const boxMargin = 3.5;
    const startX = 14;

    const kpis = [
      { label: 'ALUMNOS EN RIESGO', value: `${stats.totalStudents}`, sub: `en ${stats.totalCourses} cursos`, color: [241, 245, 249], textCol: [30, 41, 59] },
      { label: 'CASOS CRÍTICOS', value: `${stats.criticalCount}`, sub: `${Math.round((stats.criticalCount / (stats.totalStudents || 1)) * 100)}% del total`, color: [254, 242, 242], textCol: [185, 28, 28] },
      { label: 'DOBLE RIESGO (Dec. 67)', value: `${stats.doubleRiskCount}`, sub: 'Asistencia + Notas', color: [255, 247, 237], textCol: [194, 65, 12] },
      { label: 'INTERVENCIONES', value: `${interventions.length}`, sub: `${stats.coveragePercentage}% cobertura`, color: [238, 242, 255], textCol: [67, 56, 202] },
    ];

    kpis.forEach((kpi, idx) => {
      const x = startX + idx * (boxW + boxMargin);
      doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.roundedRect(x, currentY, boxW, boxH, 2, 2, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label, x + 3, currentY + 4.5);

      doc.setFontSize(13);
      doc.setTextColor(kpi.textCol[0], kpi.textCol[1], kpi.textCol[2]);
      doc.text(kpi.value, x + 3, currentY + 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.sub, x + 3, currentY + 15);
    });

    currentY += boxH + 8;

    // Table 1: Consolidated by Course
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 30, 55);
    doc.text('1. Consolidado de Riesgo por Curso', 14, currentY);

    const courseTableData = courseSummaries.map(c => [
      c.course,
      c.modality,
      String(c.total),
      String(c.critical),
      String(c.attendanceAlerts),
      String(c.academicAlerts),
      String(c.doubleRisk),
      `${c.avgAttendance}%`,
      String(c.interventionsLogged),
    ]);

    autoTable(doc, {
      startY: currentY + 2.5,
      head: [['Curso', 'Tipo', 'Total', 'Crítico', 'Asist <85%', 'Notas <4.0', 'Doble Riesgo', 'Asist. Prom.', 'Interv.']],
      body: courseTableData,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 44, 89],
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 32 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15, fontStyle: 'bold' },
        3: { cellWidth: 16, textColor: [185, 28, 28], fontStyle: 'bold' },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22, textColor: [194, 65, 12], fontStyle: 'bold' },
        7: { cellWidth: 20 },
        8: { cellWidth: 16, fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    let finalY = (doc as any).lastAutoTable.finalY + 8;

    // Check if we need page break
    if (finalY > 210) {
      doc.addPage();
      finalY = 20;
    }

    // Table 2: Top Deficient Subjects
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 30, 55);
    doc.text('2. Asignaturas con Mayor Reprobación Escolar', 14, finalY);

    const subjectTableData = topSubjects.map((s, i) => [
      `#${i + 1}`,
      s.subject,
      String(s.totalFailures),
      `${s.percentageOfTotal}%`,
      s.averageGrade.toFixed(1),
      s.coursesAffected.slice(0, 3).map(c => `${c.course} (${c.count})`).join(', ')
    ]);

    autoTable(doc, {
      startY: finalY + 2.5,
      head: [['#', 'Asignatura', 'Nº Reprobaciones', '% del Total', 'Nota Roja Prom.', 'Cursos con Mayor Concentración']],
      body: subjectTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 110],
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 46 },
        2: { halign: 'center', cellWidth: 26, fontStyle: 'bold', textColor: [185, 28, 28] },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 24 },
        5: { cellWidth: 56 },
      },
      margin: { left: 14, right: 14 },
    });

    finalY = (doc as any).lastAutoTable.finalY + 8;

    // Check page break for Critical Students
    if (finalY > 200) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 30, 55);
    doc.text('3. Nómina de Casos Críticos Prioritarios (Acción Inmediata)', 14, finalY);

    const critData = criticalStudents.map(s => [
      s.name,
      s.course,
      `${s.attendance}%`,
      s.generalAverage.toFixed(1),
      s.deficientSubjects.map(sub => `${sub.name} (${sub.grade})`).join('; ') || 'Ninguna',
      s.interventionCount > 0 ? `${s.interventionCount} reg.` : 'SIN INTERV.',
    ]);

    autoTable(doc, {
      startY: finalY + 2.5,
      head: [['Estudiante', 'Curso', 'Asistencia', 'Promedio', 'Asignaturas Insuficientes', 'Intervenciones']],
      body: critData,
      theme: 'striped',
      headStyles: {
        fillColor: [153, 27, 27], // Dark red
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 6.8,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        1: { cellWidth: 26 },
        2: { halign: 'center', cellWidth: 18, fontStyle: 'bold', textColor: [185, 28, 28] },
        3: { halign: 'center', cellWidth: 16 },
        4: { cellWidth: 54 },
        5: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    finalY = (doc as any).lastAutoTable.finalY + 16;

    // Ensure signatures have room
    if (finalY > 245) {
      doc.addPage();
      finalY = 35;
    }

    // Formal Signatures
    const sigW = 50;
    const sigY = finalY + 10;
    
    doc.setDrawColor(150, 150, 150);
    doc.line(20, sigY, 20 + sigW, sigY);
    doc.line(80, sigY, 80 + sigW, sigY);
    doc.line(140, sigY, 140 + sigW, sigY);

    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.setFont('helvetica', 'bold');
    doc.text('JEFE / JEFA DE UTP', 45, sigY + 5, { align: 'center' });
    doc.text('DIRECCIÓN ACADÉMICA', 105, sigY + 5, { align: 'center' });
    doc.text('CONVIVENCIA ESCOLAR', 165, sigY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(schoolName, 45, sigY + 9, { align: 'center' });
    doc.text(schoolName, 105, sigY + 9, { align: 'center' });
    doc.text(schoolName, 165, sigY + 9, { align: 'center' });

    // Download PDF
    doc.save(`Informe_Mensual_UTP_${monthYear.replace(/\s+/g, '_')}_Riesgo_Repitencia.pdf`);
  },

  /**
   * Generates Course Report for Teachers Council (PDF)
   */
  generateCourseReport(
    courseName: string,
    students: StudentRisk[],
    interventions: Intervention[],
    schoolName: string = 'Colegio Salesiano de Concepción'
  ): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const courseStudents = students.filter(s => s.course === courseName);
    const courseInterventions = interventions.filter(i => i.course === courseName);

    // Header bar
    doc.setFillColor(15, 44, 89);
    doc.rect(0, 0, 297, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(schoolName.toUpperCase(), 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`CONSEJO DE PROFESORES: INFORME DE RIESGO DE REPITENCIA Y ASISTENCIA - CURSO: ${courseName}`, 14, 16);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 283, 16, { align: 'right' });

    let currentY = 28;

    // Course summary metrics
    const critCount = courseStudents.filter(s => s.riskLevel === 'CRITICO').length;
    const attCount = courseStudents.filter(s => s.attendance < 85).length;
    const acadCount = courseStudents.filter(s => s.deficientSubjects.length > 0).length;
    const doubleCount = courseStudents.filter(s => s.attendance < 85 && s.deficientSubjects.length > 0).length;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 30, 55);
    doc.text(`Resumen del Curso: ${courseName}`, 14, currentY);

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 70, 85);
    doc.text(
      `Total alumnos en nómina de riesgo: ${courseStudents.length} | Críticos: ${critCount} | Asistencia < 85%: ${attCount} | Con notas insuficientes: ${acadCount} | Doble Riesgo (Decreto 67): ${doubleCount} | Intervenciones registradas: ${courseInterventions.length}`,
      14,
      currentY
    );

    currentY += 4;

    const tableRows = courseStudents.map((s, idx) => {
      const studentInts = courseInterventions.filter(i => i.studentId === s.id);
      const lastInt = studentInts.length > 0
        ? `${studentInts[0].date} (${studentInts[0].responsible}): ${studentInts[0].agreements || studentInts[0].description.slice(0, 50)}`
        : 'Sin registro aún';

      return [
        String(idx + 1),
        s.name,
        s.riskLevel,
        `${s.attendance}%`,
        s.generalAverage.toFixed(1),
        s.deficientSubjects.map(sub => `${sub.name}: ${sub.grade}`).join(', ') || 'Sin notas rojas',
        s.rawAlert,
        lastInt,
      ];
    });

    autoTable(doc, {
      startY: currentY + 2,
      head: [['#', 'Nombre Estudiante', 'Nivel Riesgo', 'Asist.', 'Prom.', 'Asignaturas Insuficientes', 'Alerta Origen', 'Última Intervención / Acuerdos']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [24, 52, 99],
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 16 },
        5: { cellWidth: 62 },
        6: { halign: 'center', cellWidth: 26 },
        7: { cellWidth: 65 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const val = data.cell.raw;
          if (val === 'CRITICO') {
            data.cell.styles.textColor = [185, 28, 28];
          } else if (val === 'ALTO') {
            data.cell.styles.textColor = [194, 65, 12];
          }
        }
        if (data.section === 'body' && data.column.index === 3) {
          const val = parseFloat(String(data.cell.raw));
          if (!isNaN(val) && val < 85) {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    let endY = (doc as any).lastAutoTable.finalY + 16;
    if (endY > 175) {
      doc.addPage();
      endY = 25;
    }

    // Signatures
    const sigW = 60;
    doc.setDrawColor(140, 140, 140);
    doc.line(30, endY + 10, 30 + sigW, endY + 10);
    doc.line(120, endY + 10, 120 + sigW, endY + 10);
    doc.line(210, endY + 10, 210 + sigW, endY + 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`PROFESOR/A JEFE (${courseName})`, 60, endY + 15, { align: 'center' });
    doc.text('JEFE/A UNIDAD TÉCNICA PEDAGÓGICA', 150, endY + 15, { align: 'center' });
    doc.text('DIRECCIÓN / CONSEJO ESCOLAR', 240, endY + 15, { align: 'center' });

    doc.save(`Reporte_Consejo_${courseName.replace(/\s+/g, '_')}_Riesgo_Repitencia.pdf`);
  },

  /**
   * Generates Individual Student Dossier (PDF)
   */
  generateStudentDossier(
    student: StudentRisk,
    interventions: Intervention[],
    utpNote?: StudentUTPNote,
    schoolName: string = 'Colegio Salesiano de Concepción'
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const studentInts = interventions.filter(i => i.studentId === student.id);

    // Header
    doc.setFillColor(15, 44, 89);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(schoolName.toUpperCase(), 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('FICHA OFICIAL DE ACOMPAÑAMIENTO PEDAGÓGICO INDIVIDUAL (DECRETO 67/2018)', 14, 17);
    doc.text(`EXPEDIENTE DE MONITOREO DE ALERTA TEMPRANA | EMISIÓN: ${new Date().toLocaleDateString('es-CL')}`, 14, 22);

    let currentY = 34;

    // Student identification card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(student.name, 19, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Curso: ${student.course} (${student.modality === 'TP' ? 'Técnico Profesional' : student.modality === 'HC' ? 'Humanista Científico' : 'Enseñanza Básica'})`, 19, currentY + 15);
    doc.text(`Asistencia Actual: ${student.attendance}% (Mínimo legal: 85%)`, 19, currentY + 21);
    doc.text(`Promedio General: ${student.generalAverage.toFixed(1)}`, 19, currentY + 27);

    // Risk badge on top right of box
    const badgeColor = student.riskLevel === 'CRITICO' ? [254, 242, 242] : student.riskLevel === 'ALTO' ? [255, 247, 237] : [240, 253, 244];
    const badgeTextColor = student.riskLevel === 'CRITICO' ? [185, 28, 28] : student.riskLevel === 'ALTO' ? [194, 65, 12] : [21, 128, 61];

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(140, currentY + 6, 50, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(badgeTextColor[0], badgeTextColor[1], badgeTextColor[2]);
    doc.text('NIVEL DE RIESGO', 165, currentY + 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(student.riskLevel, 165, currentY + 18, { align: 'center' });

    currentY += 38;

    // Diagnostic summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Diagnóstico de Riesgo y Situación Reglamentaria (Decreto 67)', 14, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const reasonsText = student.riskReasons.length > 0
      ? student.riskReasons.map(r => `• ${r}`).join('\n')
      : '• Alumno en monitoreo preventivo por la Unidad Técnico Pedagógica.';
    
    doc.text(reasonsText, 16, currentY + 3);
    currentY += (student.riskReasons.length * 4.5) + 6;

    // Subjects table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Asignaturas con Calificación Insuficiente (< 4.0)', 14, currentY);

    if (student.deficientSubjects.length > 0) {
      const subjRows = student.deficientSubjects.map((s, idx) => [
        String(idx + 1),
        s.name,
        s.grade.toFixed(1),
        'Requiere plan de nivelación y reforzamiento urgente'
      ]);

      autoTable(doc, {
        startY: currentY + 2.5,
        head: [['#', 'Asignatura', 'Nota', 'Medida Pedagógica Exigida']],
        body: subjRows,
        theme: 'striped',
        headStyles: {
          fillColor: [185, 28, 28],
          textColor: 255,
          fontSize: 7.5,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { fontStyle: 'bold', cellWidth: 60 },
          2: { halign: 'center', fontStyle: 'bold', cellWidth: 20, textColor: [185, 28, 28] },
          3: { cellWidth: 92 },
        },
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      currentY += 4;
      doc.setFont('helvetica', 'italic');
      doc.text('El estudiante no registra asignaturas con notas rojas. Su riesgo radica exclusivamente en inasistencias (<85%).', 16, currentY + 2);
      currentY += 10;
    }

    // Interventions History
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Bitácora de Intervenciones y Compromisos Pedagógicos', 14, currentY);

    if (studentInts.length > 0) {
      const intRows = studentInts.map(i => [
        i.date,
        i.type.replace(/_/g, ' '),
        i.responsible,
        i.description,
        i.agreements || 'Sin compromisos registrados',
        i.status,
      ]);

      autoTable(doc, {
        startY: currentY + 2.5,
        head: [['Fecha', 'Tipo', 'Responsable', 'Observación / Detalle', 'Compromisos Asumidos', 'Estado']],
        body: intRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 44, 89],
          textColor: 255,
          fontSize: 7,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 6.8,
        },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 30, fontStyle: 'bold' },
          2: { cellWidth: 25 },
          3: { cellWidth: 50 },
          4: { cellWidth: 42 },
          5: { cellWidth: 17, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      currentY += 4;
      doc.setFont('helvetica', 'italic');
      doc.text('No se han registrado intervenciones formales en sistema aún. Se sugiere agendar citación con apoderado.', 16, currentY + 2);
      currentY += 12;
    }

    if (utpNote?.observations) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Observaciones Internas de UTP:', 14, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(utpNote.observations, 16, currentY);
      currentY += 10;
    }

    // Signatures block
    if (currentY > 235) {
      doc.addPage();
      currentY = 35;
    }

    const sigW = 40;
    const sigY = currentY + 16;
    doc.setDrawColor(150, 150, 150);
    doc.line(16, sigY, 16 + sigW, sigY);
    doc.line(64, sigY, 64 + sigW, sigY);
    doc.line(112, sigY, 112 + sigW, sigY);
    doc.line(158, sigY, 158 + sigW, sigY);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('FIRMA ALUMNO/A', 36, sigY + 4, { align: 'center' });
    doc.text('FIRMA APODERADO/A', 84, sigY + 4, { align: 'center' });
    doc.text('PROFESOR/A JEFE', 132, sigY + 4, { align: 'center' });
    doc.text('JEFE/A DE UTP', 178, sigY + 4, { align: 'center' });

    doc.save(`Ficha_Acompanamiento_${student.name.replace(/\s+/g, '_')}.pdf`);
  }
};
