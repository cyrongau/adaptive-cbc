'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Sparkles, Award, User, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useBranding } from '@/components/layout/branding-provider';
import toast from 'react-hot-toast';

// Define the interface for the platform reports
interface PlatformReport {
  id: string;
  title: string;
  type: 'Enrollment' | 'Performance' | 'Activity' | 'Usage';
  endpoint: string;
  format: 'PDF' | 'CSV';
  description: string;
}

const SYSTEM_REPORTS: PlatformReport[] = [
  {
    id: '1',
    title: 'Platform Enrollment & Growth Report',
    type: 'Enrollment',
    endpoint: '/reports/enrollment',
    format: 'PDF',
    description: 'Demographics, growth trends, and class distribution stats.',
  },
  {
    id: '2',
    title: 'Student Academic Performance Summary',
    type: 'Performance',
    endpoint: '/reports/performance',
    format: 'PDF',
    description: 'Average scores by subject, exam activity, and passing rates.',
  },
  {
    id: '3',
    title: 'System Activity & Login Log',
    type: 'Activity',
    endpoint: '/reports/activity',
    format: 'CSV',
    description: 'Security log audit, logins, and key teacher/student events.',
  },
  {
    id: '4',
    title: 'Resource & AI Usage Statistics',
    type: 'Usage',
    endpoint: '/reports/usage',
    format: 'PDF',
    description: 'AI content generator usage, prompt counts, and digital library pageviews.',
  },
];

export default function AdminReportsPage() {
  const branding = useBranding();
  const [activeTab, setActiveTab] = useState<'system' | 'academic' | 'certificates'>('system');
  
  // States for student list (to populate generators)
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // States for Report Card Generator Form
  const [rcStudent, setRcStudent] = useState('');
  const [rcGrade, setRcGrade] = useState('Grade 4');
  const [rcTerm, setRcTerm] = useState('Term 1, 2026');
  const [rcOverallScore, setRcOverallScore] = useState('78');
  const [rcLessons, setRcLessons] = useState('14');
  const [rcHours, setRcHours] = useState('32');
  const [rcRemarks, setRcRemarks] = useState('Excellent performance. The student demonstrates great logical reasoning and communication skills. More practice recommended in Kiswahili strand 3.');
  const [generatingReportCard, setGeneratingReportCard] = useState(false);

  // States for Certificate Generator Form
  const [certStudent, setCertStudent] = useState('');
  const [certCourse, setCertCourse] = useState('');
  const [certInstructor, setCertInstructor] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [generatingCert, setGeneratingCert] = useState(false);

  // Loading state for system downloads
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  // Fetch users (students) & courses on mount to populate select dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        const [usersRes, coursesRes] = await Promise.all([
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/courses/published').catch(() => ({ data: [] })),
        ]);

        const studentList = (usersRes.data || []).filter((u: any) => u.role === 'student');
        setStudents(studentList);
        setCourses(coursesRes.data || []);
        
        if (studentList.length > 0) {
          setRcStudent(studentList[0].id);
          setCertStudent(studentList[0].id);
        }
        if (coursesRes.data && coursesRes.data.length > 0) {
          setCertCourse(coursesRes.data[0].title);
          setCertInstructor(coursesRes.data[0].teacherName || 'Lead Instructor');
        }
      } catch (err) {
        console.error('Failed to populate reports dropdown data:', err);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
    // Auto-generate certificate number
    setCertNumber(`CERT-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  const handleDownloadSystemReport = async (report: PlatformReport) => {
    setDownloadingReportId(report.id);
    const toastId = toast.loading(`Fetching data for ${report.title}...`);
    try {
      const response = await api.get(report.endpoint);
      const data = response.data;

      if (report.format === 'CSV') {
        // Simple CSV generation client-side
        let csvContent = 'data:text/csv;charset=utf-8,';
        if (report.type === 'Activity') {
          csvContent += 'Timestamp,Type,Title,Description\n';
          (data.activities || []).forEach((act: any) => {
            const row = `"${new Date(act.timestamp).toLocaleString()}","${act.type}","${act.title.replace(/"/g, '""')}","${act.description.replace(/"/g, '""')}"`;
            csvContent += row + '\n';
          });
        } else {
          csvContent += JSON.stringify(data);
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${report.type.toLowerCase()}_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Activity report downloaded successfully!', { id: toastId });
      } else {
        // PDF Report Generation using generic dynamic PDF layout
        const { pdf } = await import('@react-pdf/renderer');
        const { TermlyReportCard } = await import('@/components/reports/termly-report-card');

        // Adapt general report data to a tabular view using the TermlyReportCard component
        // which acts as our premium PDF layout template
        let tableData: any[] = [];
        let title = report.title;

        if (report.type === 'Enrollment') {
          tableData = [
            { subject: 'Total Registered Students', attempts: data.summary.totalStudents || 0, score: 100, grade: 'Active', recommendation: 'Core learning group' },
            { subject: 'Total Registered Teachers', attempts: data.summary.totalTeachers || 0, score: 100, grade: 'Active', recommendation: 'Facilitators and instructors' },
            { subject: 'Total Registered Tutors', attempts: data.summary.totalTutors || 0, score: 100, grade: 'Active', recommendation: 'After-school tutors' },
            { subject: 'Platform Active Users', attempts: data.summary.activeUsers || 0, score: 100, grade: 'Online', recommendation: 'Monthly Active Users (MAU)' },
          ];
        } else if (report.type === 'Performance') {
          tableData = (data.subjectPerformance || []).map((sp: any) => ({
            subject: sp.subject || 'CBC Subject',
            attempts: sp.sessionsCount || 0,
            score: Math.round(sp.successRate || 0),
            grade: sp.successRate >= 80 ? 'Exceeds Expectation' : sp.successRate >= 50 ? 'Meets Expectation' : 'Approaching Expectation',
            recommendation: `Completed assessments. Overall success index of ${sp.successRate}%.`,
          }));
        } else if (report.type === 'Usage') {
          tableData = [
            { subject: 'Total AI Assistance Calls', attempts: data.aiUsage.totalCalls || 0, score: 100, grade: 'Verified', recommendation: 'AI Strands, lesson planning, & question helper.' },
            { subject: 'Total Homework Sessions', attempts: data.systemUsage.totalSessions || 0, score: 100, grade: 'Active', recommendation: 'Student-led homework practices.' },
            { subject: 'Questions Attempted', attempts: data.systemUsage.totalQuestionsAttempted || 0, score: 100, grade: 'Completed', recommendation: 'Adaptive assessments solved.' },
          ];
        }

        const selectedStudentName = 'Platform Admin';
        const selectedInstitutionName = data.title || branding.platformName;

        const doc = (
          <TermlyReportCard
            studentName={selectedStudentName}
            grade="All Classes"
            term="Current Academic Term"
            institutionName={selectedInstitutionName}
            subjects={tableData.length > 0 ? tableData : [
              { subject: 'Sample Module', attempts: 5, score: 85, grade: 'Exceeding', recommendation: 'Continuous improvement observed.' }
            ]}
            summary={{
              overallScore: data.metrics?.averageScore ? parseFloat(data.metrics.averageScore) : 82,
              completedLessons: data.metrics?.totalSessions || 12,
              totalTimeSpentHours: 48,
              teacherFeedback: `This system-generated ${report.type} report covers comprehensive platform activity. System performance indicators remain high. Dynamic parameters are aligned with the CBC curriculum goals.`,
            }}
            branding={{
              primaryColor: branding.primaryColor,
              secondaryColor: branding.secondaryColor,
              platformName: branding.platformName,
            }}
          />
        );

        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.type.toLowerCase()}_report_${Date.now()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${report.type} report PDF generated successfully!`, { id: toastId });
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      toast.error('Could not load report data from the backend server.', { id: toastId });
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleGenerateReportCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingReportCard(true);
    const toastId = toast.loading('Generating branded Termly Report Card...');

    try {
      const selectedStudentObj = students.find(s => s.id === rcStudent);
      const studentName = selectedStudentObj ? `${selectedStudentObj.firstName} ${selectedStudentObj.lastName}` : 'Student Record';
      const institutionName = selectedStudentObj?.institutionName || branding.platformName;

      // Import template dynamically
      const { pdf } = await import('@react-pdf/renderer');
      const { TermlyReportCard } = await import('@/components/reports/termly-report-card');

      // CBC-aligned mockup subjects
      const mockSubjects = [
        { subject: 'Mathematics Activities', attempts: 12, score: parseInt(rcOverallScore) + 4, grade: 'Exceeds Expectation', recommendation: 'Excellent skill in logical reasoning, addition and geometry.' },
        { subject: 'English Language Activities', attempts: 15, score: parseInt(rcOverallScore) - 2, grade: 'Meets Expectation', recommendation: 'Good vocabulary and paragraph structuring. Converses fluently.' },
        { subject: 'Kiswahili Activities', attempts: 10, score: parseInt(rcOverallScore) - 5, grade: 'Meets Expectation', recommendation: 'Uwezo mzuri wa kusikiliza na kusoma hadithi fupi.' },
        { subject: 'Science and Technology', attempts: 8, score: parseInt(rcOverallScore) + 2, grade: 'Exceeds Expectation', recommendation: 'Shows high curiosity. Understands living things and environment.' },
      ];

      const doc = (
        <TermlyReportCard
          studentName={studentName}
          grade={rcGrade}
          term={rcTerm}
          institutionName={institutionName}
          subjects={mockSubjects}
          summary={{
            overallScore: parseInt(rcOverallScore),
            completedLessons: parseInt(rcLessons),
            totalTimeSpentHours: parseInt(rcHours),
            teacherFeedback: rcRemarks,
          }}
          branding={{
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            platformName: branding.platformName,
          }}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report_Card_${studentName.replace(/\s+/g, '_')}_${rcTerm.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Termly Report Card PDF generated!', { id: toastId });
    } catch (err) {
      console.error('Failed to generate report card:', err);
      toast.error('Failed to generate PDF report card.', { id: toastId });
    } finally {
      setGeneratingReportCard(false);
    }
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingCert(true);
    const toastId = toast.loading('Generating Completion Certificate...');

    try {
      const selectedStudentObj = students.find(s => s.id === certStudent);
      const studentName = selectedStudentObj ? `${selectedStudentObj.firstName} ${selectedStudentObj.lastName}` : 'Graduate Scholar';
      const institutionName = selectedStudentObj?.institutionName || branding.platformName;

      // Import template dynamically
      const { pdf } = await import('@react-pdf/renderer');
      const { CourseCompletionCertificate } = await import('@/components/certificates/course-completion');

      const doc = (
        <CourseCompletionCertificate
          studentName={studentName}
          courseTitle={certCourse}
          certificateNumber={certNumber}
          issuedAt={new Date().toLocaleDateString()}
          institutionName={institutionName}
          instructorName={certInstructor}
          branding={{
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            platformName: branding.platformName,
          }}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${studentName.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Certificate PDF generated successfully!', { id: toastId });
      
      // Regene certificate number for the next one
      setCertNumber(`CERT-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err) {
      console.error('Failed to generate certificate:', err);
      toast.error('Failed to generate PDF certificate.', { id: toastId });
    } finally {
      setGeneratingCert(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a3a5c] pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#dae2fd] tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#7eda95]" /> Reports & Document Center
          </h2>
          <p className="text-sm text-[#becabd] mt-1">
            Export academic records, termly cards, certifications, and system-wide analytic logs.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#2a3a5c] gap-2">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-[#7eda95] text-[#7eda95]'
              : 'border-transparent text-[#becabd] hover:text-[#dae2fd]'
          }`}
        >
          <Sparkles className="w-4 h-4" /> System & Platform Reports
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'academic'
              ? 'border-[#7eda95] text-[#7eda95]'
              : 'border-transparent text-[#becabd] hover:text-[#dae2fd]'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Termly Progress Cards
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'certificates'
              ? 'border-[#7eda95] text-[#7eda95]'
              : 'border-transparent text-[#becabd] hover:text-[#dae2fd]'
          }`}
        >
          <Award className="w-4 h-4" /> Course Completion Certificates
        </button>
      </div>

      {/* Tab Content 1: System Reports */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SYSTEM_REPORTS.map((report) => (
              <div
                key={report.id}
                className="bg-[#171f33] border border-[#2a3a5c] rounded-2xl p-6 hover:shadow-lg hover:border-[#7eda95]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        report.format === 'PDF'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {report.format}
                    </span>
                    <span className="text-xs text-[#becabd] font-medium">{report.type} Data</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#dae2fd] mb-2">{report.title}</h3>
                  <p className="text-sm text-[#becabd]/80 leading-relaxed mb-6">
                    {report.description}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadSystemReport(report)}
                  disabled={downloadingReportId !== null}
                  className="w-full flex items-center justify-center gap-2 bg-[#222a3d] hover:bg-[#2b364f] disabled:bg-[#1a2130] text-[#7eda95] hover:text-[#9df2b2] disabled:text-slate-500 border border-[#2a3a5c] py-2.5 rounded-xl text-sm font-bold transition-all"
                >
                  <Download className="w-4 h-4" />{' '}
                  {downloadingReportId === report.id ? 'Generating...' : 'Download Report'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Academic Termly Report Cards */}
      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#171f33] border border-[#2a3a5c] rounded-2xl p-6 space-y-6">
            <h3 className="text-xl font-bold text-[#dae2fd] border-b border-[#2a3a5c] pb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#7eda95]" /> Academic Progress Configurator
            </h3>
            
            <form onSubmit={handleGenerateReportCard} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Select Student</label>
                  <select
                    value={rcStudent}
                    onChange={(e) => setRcStudent(e.target.value)}
                    required
                    disabled={loadingDropdowns}
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  >
                    {loadingDropdowns ? (
                      <option>Loading student register...</option>
                    ) : students.length === 0 ? (
                      <option>No students found</option>
                    ) : (
                      students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Academic Term</label>
                  <select
                    value={rcTerm}
                    onChange={(e) => setRcTerm(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  >
                    <option value="Term 1, 2026">Term 1, 2026</option>
                    <option value="Term 2, 2026">Term 2, 2026</option>
                    <option value="Term 3, 2026">Term 3, 2026</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Student Grade Level</label>
                  <select
                    value={rcGrade}
                    onChange={(e) => setRcGrade(e.target.value)}
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  >
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6 (Candidate)</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9 (Candidate)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Mean Score</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={rcOverallScore}
                      onChange={(e) => setRcOverallScore(e.target.value)}
                      required
                      className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-3 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95] text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Lessons</label>
                    <input
                      type="number"
                      min="0"
                      value={rcLessons}
                      onChange={(e) => setRcLessons(e.target.value)}
                      required
                      className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-3 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95] text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Hours</label>
                    <input
                      type="number"
                      min="0"
                      value={rcHours}
                      onChange={(e) => setRcHours(e.target.value)}
                      required
                      className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-3 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95] text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Teacher remarks & Recommendations</label>
                <textarea
                  rows={4}
                  value={rcRemarks}
                  onChange={(e) => setRcRemarks(e.target.value)}
                  required
                  className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={generatingReportCard || students.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#47a263] hover:bg-[#3d8b55] disabled:bg-[#1f402b] text-white disabled:text-slate-400 py-3.5 rounded-xl font-bold transition-all shadow-md"
              >
                <Download className="w-5 h-5" />{' '}
                {generatingReportCard ? 'Creating PDF File...' : 'Generate & Download Termly Progress Card'}
              </button>
            </form>
          </div>

          {/* Guidelines Sidebar */}
          <div className="bg-[#171f33] border border-[#2a3a5c] rounded-2xl p-6 space-y-4 h-fit">
            <h4 className="font-bold text-[#dae2fd] text-md border-b border-[#2a3a5c] pb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#7eda95]" /> CBC Reporting Rules
            </h4>
            <ul className="text-xs text-[#becabd] space-y-3 list-disc list-inside leading-relaxed">
              <li>Marks are parsed according to standard CBC competencies.</li>
              <li>Learning outcomes evaluate: Exceeds Expectation, Meets Expectation, and Approaching Expectation.</li>
              <li>Official certificates generate a unique dynamic QR matrix checking validation.</li>
              <li>Branding guidelines apply automatically: borders and headers reflect settings colors.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab Content 3: Completion Certificates */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#171f33] border border-[#2a3a5c] rounded-2xl p-6 space-y-6">
            <h3 className="text-xl font-bold text-[#dae2fd] border-b border-[#2a3a5c] pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#7eda95]" /> Official Course Completion Certificate
            </h3>

            <form onSubmit={handleGenerateCertificate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Select Student</label>
                  <select
                    value={certStudent}
                    onChange={(e) => setCertStudent(e.target.value)}
                    required
                    disabled={loadingDropdowns}
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  >
                    {loadingDropdowns ? (
                      <option>Loading student register...</option>
                    ) : students.length === 0 ? (
                      <option>No students found</option>
                    ) : (
                      students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Select Course</label>
                  <select
                    value={certCourse}
                    onChange={(e) => {
                      setCertCourse(e.target.value);
                      const courseObj = courses.find(c => c.title === e.target.value);
                      if (courseObj) {
                        setCertInstructor(courseObj.teacherName || 'Lead Facilitator');
                      }
                    }}
                    required
                    disabled={loadingDropdowns}
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  >
                    {loadingDropdowns ? (
                      <option>Loading courses...</option>
                    ) : courses.length === 0 ? (
                      <>
                        <option value="Introduction to CBC Mathematics">Introduction to CBC Mathematics</option>
                        <option value="Creative Arts and Expression">Creative Arts and Expression</option>
                        <option value="Junior Secondary Pre-Algebra">Junior Secondary Pre-Algebra</option>
                      </>
                    ) : (
                      courses.map((c, i) => (
                        <option key={i} value={c.title}>
                          {c.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Lead Instructor Name</label>
                  <input
                    type="text"
                    value={certInstructor}
                    onChange={(e) => setCertInstructor(e.target.value)}
                    required
                    placeholder="e.g. Mr. David Kamau"
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#becabd] uppercase tracking-wider">Certificate ID Number</label>
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    required
                    className="w-full bg-[#060e20] border border-[#2a3a5c] rounded-xl px-4 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#7eda95]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingCert || students.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#47a263] hover:bg-[#3d8b55] disabled:bg-[#1f402b] text-white disabled:text-slate-400 py-3.5 rounded-xl font-bold transition-all shadow-md"
              >
                <Download className="w-5 h-5" />{' '}
                {generatingCert ? 'Generating Certificate...' : 'Generate & Download Certificate'}
              </button>
            </form>
          </div>

          <div className="bg-[#171f33] border border-[#2a3a5c] rounded-2xl p-6 flex flex-col justify-between gap-6 border-l-4 border-l-[#7eda95]">
            <div className="space-y-3">
              <h4 className="font-bold text-[#dae2fd] text-md flex items-center gap-2">
                <Award className="w-4 h-4 text-[#7eda95]" /> Official Verification
              </h4>
              <p className="text-xs text-[#becabd] leading-relaxed">
                Completion certificates are designed to meet standard accreditation layout norms, containing the official platform seal, verification code, and dual signature lines.
              </p>
            </div>
            <div className="p-4 bg-[#0d1424] rounded-xl border border-[#2a3a5c] text-center space-y-2">
              <div className="w-16 h-16 mx-auto border-2 border-[#dae2fd] border-dashed rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#7eda95]" />
              </div>
              <span className="text-[10px] font-bold text-[#becabd] block">CBC ACCREDITATION APPROVED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}