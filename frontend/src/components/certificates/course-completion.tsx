import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface CourseCompletionProps {
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  institutionName: string;
  instructorName: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    platformName: string;
  };
}

export function CourseCompletionCertificate({
  studentName,
  courseTitle,
  certificateNumber,
  issuedAt,
  institutionName,
  instructorName,
  branding,
}: CourseCompletionProps) {
  const primary = branding.primaryColor || '#006a34';
  const secondary = branding.secondaryColor || '#455f88';

  const styles = StyleSheet.create({
    page: {
      padding: 35,
      backgroundColor: '#fcfdfd',
      fontFamily: 'Helvetica',
      color: '#1e293b',
    },
    borderOuter: {
      borderWidth: 6,
      borderColor: primary,
      height: '100%',
      width: '100%',
      padding: 3,
      borderRadius: 4,
    },
    borderInner: {
      borderWidth: 1.5,
      borderColor: secondary,
      height: '100%',
      width: '100%',
      padding: 40,
      position: 'relative',
      alignItems: 'center',
    },
    decorativeCornerLT: {
      position: 'absolute',
      top: 10,
      left: 10,
      width: 20,
      height: 20,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderColor: primary,
    },
    decorativeCornerRT: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderColor: primary,
    },
    decorativeCornerLB: {
      position: 'absolute',
      bottom: 10,
      left: 10,
      width: 20,
      height: 20,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderColor: primary,
    },
    decorativeCornerRB: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 20,
      height: 20,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderColor: primary,
    },
    headerText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: secondary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 15,
    },
    mainTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: primary,
      textTransform: 'uppercase',
      letterSpacing: 3,
      marginBottom: 25,
      textAlign: 'center',
    },
    certifyText: {
      fontSize: 11,
      fontStyle: 'italic',
      color: '#64748b',
      marginBottom: 15,
    },
    studentName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#0f172a',
      borderBottomWidth: 1.5,
      borderBottomColor: secondary,
      paddingBottom: 5,
      width: '70%',
      textAlign: 'center',
      marginBottom: 20,
    },
    fulfillmentText: {
      fontSize: 10,
      color: '#475569',
      width: '80%',
      textAlign: 'center',
      lineHeight: 1.6,
      marginBottom: 20,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: primary,
      textAlign: 'center',
      marginBottom: 35,
    },
    signaturesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 'auto',
      paddingHorizontal: 20,
    },
    signatureBlock: {
      alignItems: 'center',
      width: '28%',
    },
    signatureLine: {
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: '#94a3b8',
      marginBottom: 5,
      height: 25,
    },
    signatureLabel: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#475569',
    },
    signatureSub: {
      fontSize: 8,
      color: '#64748b',
      marginTop: 2,
      textAlign: 'center',
    },
    qrBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
      height: 60,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      padding: 4,
      borderRadius: 4,
      backgroundColor: '#f8fafc',
    },
    qrText: {
      fontSize: 6,
      color: '#94a3b8',
      textAlign: 'center',
      marginTop: 2,
    },
    qrGraphic: {
      width: 40,
      height: 40,
      borderWidth: 2,
      borderColor: '#1e293b',
      borderStyle: 'dashed',
    },
    certMeta: {
      position: 'absolute',
      bottom: 15,
      fontSize: 8,
      color: '#94a3b8',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
    },
  });

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.borderOuter}>
          <View style={styles.borderInner}>
            {/* Corners decoration */}
            <View style={styles.decorativeCornerLT} />
            <View style={styles.decorativeCornerRT} />
            <View style={styles.decorativeCornerLB} />
            <View style={styles.decorativeCornerRB} />

            {/* Header Platform / Institution info */}
            <Text style={styles.headerText}>{institutionName || branding.platformName}</Text>
            
            {/* Title */}
            <Text style={styles.mainTitle}>Certificate of Completion</Text>
            
            <Text style={styles.certifyText}>This is proudly presented to</Text>
            
            {/* Student Name */}
            <Text style={styles.studentName}>{studentName}</Text>
            
            {/* Fulfillment text */}
            <Text style={styles.fulfillmentText}>
              for successfully completing all curriculum standards and assessment tasks associated with the course
            </Text>
            
            {/* Course Title */}
            <Text style={styles.courseTitle}>{courseTitle}</Text>

            {/* Signatures and QR Verification Block */}
            <View style={styles.signaturesContainer}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>{instructorName || 'Course Instructor'}</Text>
                <Text style={styles.signatureSub}>Lead Facilitator</Text>
              </View>

              <View style={styles.qrBlock}>
                <View style={styles.qrGraphic} />
                <Text style={styles.qrText}>VERIFIED CBC</Text>
              </View>

              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>School Principal</Text>
                <Text style={styles.signatureSub}>{institutionName || branding.platformName} Admin</Text>
              </View>
            </View>

            {/* Metadata Footer */}
            <View style={styles.certMeta}>
              <Text>Certificate ID: {certificateNumber}</Text>
              <Text>Date Issued: {issuedAt}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
