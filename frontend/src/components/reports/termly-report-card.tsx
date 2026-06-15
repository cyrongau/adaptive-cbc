import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface SubjectProgress {
  subject: string;
  attempts: number;
  score: number;
  grade: string;
  recommendation: string;
}

interface TermlyReportCardProps {
  studentName: string;
  grade: string;
  term: string;
  institutionName: string;
  subjects: SubjectProgress[];
  summary: {
    overallScore: number;
    completedLessons: number;
    totalTimeSpentHours: number;
    teacherFeedback: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    platformName: string;
  };
}

export function TermlyReportCard({
  studentName,
  grade,
  term,
  institutionName,
  subjects,
  summary,
  branding,
}: TermlyReportCardProps) {
  // Safe default colors
  const primary = branding.primaryColor || '#006a34';
  const secondary = branding.secondaryColor || '#455f88';

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#f8fafc',
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#1e293b',
    },
    headerBand: {
      height: 8,
      backgroundColor: primary,
      marginBottom: 20,
      borderRadius: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      paddingBottom: 15,
      marginBottom: 20,
    },
    titleContainer: {
      flexDirection: 'column',
    },
    platformTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: primary,
    },
    reportSubtitle: {
      fontSize: 12,
      color: secondary,
      marginTop: 2,
      letterSpacing: 1,
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      padding: 15,
      marginBottom: 25,
    },
    metaItem: {
      width: '50%',
      marginBottom: 8,
      flexDirection: 'row',
    },
    metaLabel: {
      fontWeight: 'bold',
      color: '#64748b',
      width: 100,
    },
    metaValue: {
      color: '#0f172a',
      fontWeight: 'bold',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: primary,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      paddingBottom: 4,
    },
    summaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 25,
      gap: 12,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 9,
      color: '#64748b',
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: primary,
    },
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 25,
      backgroundColor: '#ffffff',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      padding: 8,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      padding: 8,
      alignItems: 'center',
    },
    colSubject: { width: '25%' },
    colAttempts: { width: '15%', textAlign: 'center' },
    colScore: { width: '15%', textAlign: 'center' },
    colGrade: { width: '15%', textAlign: 'center' },
    colFeedback: { width: '30%' },
    thText: {
      color: '#475569',
      fontWeight: 'bold',
      fontSize: 9,
    },
    tdText: {
      color: '#0f172a',
    },
    feedbackContainer: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 8,
      padding: 15,
      marginBottom: 30,
    },
    feedbackText: {
      lineHeight: 1.5,
      color: '#334155',
    },
    footer: {
      marginTop: 'auto',
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      paddingTop: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 8,
      color: '#94a3b8',
    },
    signatureContainer: {
      alignItems: 'center',
      width: 150,
    },
    signatureLine: {
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: '#94a3b8',
      marginBottom: 4,
      height: 30,
    },
    signatureLabel: {
      fontSize: 8,
      color: '#64748b',
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand} />
        
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.platformTitle}>{branding.platformName}</Text>
            <Text style={styles.reportSubtitle}>Academic Termly Report</Text>
          </View>
          <View>
            <Text style={{ fontSize: 9, color: '#64748b', textAlign: 'right' }}>
              Official Student Record
            </Text>
          </View>
        </View>

        {/* Metadata Details */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Student Name:</Text>
            <Text style={styles.metaValue}>{studentName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Grade / Class:</Text>
            <Text style={styles.metaValue}>{grade}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Reporting Term:</Text>
            <Text style={styles.metaValue}>{term}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Institution:</Text>
            <Text style={styles.metaValue}>{institutionName}</Text>
          </View>
        </View>

        {/* Summary Metric Cards */}
        <Text style={styles.sectionTitle}>Performance Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overall Score</Text>
            <Text style={styles.summaryValue}>{summary.overallScore}%</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completed Lessons</Text>
            <Text style={styles.summaryValue}>{summary.completedLessons}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Practice Time</Text>
            <Text style={styles.summaryValue}>{summary.totalTimeSpentHours}h</Text>
          </View>
        </View>

        {/* Subjects Performance Table */}
        <Text style={styles.sectionTitle}>Subject Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colSubject}>
              <Text style={styles.thText}>Subject</Text>
            </View>
            <View style={styles.colAttempts}>
              <Text style={styles.thText}>Attempts</Text>
            </View>
            <View style={styles.colScore}>
              <Text style={styles.thText}>Avg Score</Text>
            </View>
            <View style={styles.colGrade}>
              <Text style={styles.thText}>Grade</Text>
            </View>
            <View style={styles.colFeedback}>
              <Text style={styles.thText}>CBC Learning Outcome</Text>
            </View>
          </View>

          {subjects.map((sub, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colSubject}>
                <Text style={[styles.tdText, { fontWeight: 'bold' }]}>{sub.subject}</Text>
              </View>
              <View style={styles.colAttempts}>
                <Text style={styles.tdText}>{sub.attempts}</Text>
              </View>
              <View style={styles.colScore}>
                <Text style={[styles.tdText, { color: primary, fontWeight: 'bold' }]}>{sub.score}%</Text>
              </View>
              <View style={styles.colGrade}>
                <Text style={[styles.tdText, { fontWeight: 'bold' }]}>{sub.grade}</Text>
              </View>
              <View style={styles.colFeedback}>
                <Text style={[styles.tdText, { fontSize: 8.5 }]}>{sub.recommendation}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Teacher Remarks / Feedback */}
        <Text style={styles.sectionTitle}>General Remarks & Remarks</Text>
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{summary.teacherFeedback}</Text>
        </View>

        {/* Signatures & Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by {branding.platformName} • Powered by Adaptive Learning CBC Engine.
          </Text>
          
          <View style={styles.signatureContainer}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Class Teacher Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
