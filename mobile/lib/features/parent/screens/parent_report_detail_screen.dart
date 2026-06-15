import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../widgets/performance_bar_chart.dart';
import '../widgets/activity_line_chart.dart';

class ParentReportDetailScreen extends StatelessWidget {
  final Map<String, dynamic> report;
  final String childName;

  const ParentReportDetailScreen({
    super.key,
    required this.report,
    required this.childName,
  });

  @override
  Widget build(BuildContext context) {
    final summary = report['summary'] ?? {};
    final progress = summary['overallProgress'] ?? 0;
    final timeSpent = summary['totalTimeSpent'] ?? 0;
    final sessions = summary['sessionsCompleted'] ?? 0;
    final strong = (summary['strongAreas'] as List? ?? []).join(', ');
    final weak = (summary['areasForImprovement'] as List? ?? []).join(', ');
    
    final createdDate = DateTime.tryParse(report['createdAt'] ?? '');
    final dateStr = createdDate != null ? DateFormat('MMMM d, y').format(createdDate) : 'Unknown Date';

    final subjectPerformance = report['subjectPerformance'] as List? ?? [];
    final recentActivity = report['recentActivity'] as List? ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('$childName\'s Progress Report', style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primaryGreen,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Generated on $dateStr', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            
            // Key Stats Grid
            Row(
              children: [
                Expanded(child: _buildReportStatCard('Overall Score', '$progress%', AppColors.primaryGreen)),
                const SizedBox(width: 12),
                Expanded(child: _buildReportStatCard('Practice Time', '$timeSpent min', AppColors.accentGolden)),
                const SizedBox(width: 12),
                Expanded(child: _buildReportStatCard('Sessions', '$sessions done', Colors.blue)),
              ],
            ),
            const SizedBox(height: 24),

            // Performance Bar Chart
            const Text('Subject Performance', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen)),
            const SizedBox(height: 16),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: PerformanceBarChart(subjectPerformance: subjectPerformance),
              ),
            ),
            const SizedBox(height: 24),

            // Activity Line Chart
            const Text('Revision Consistency', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen)),
            const SizedBox(height: 16),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: ActivityLineChart(recentActivity: recentActivity),
              ),
            ),
            const SizedBox(height: 24),

            const Text('Academic Areas Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen)),
            const SizedBox(height: 16),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              child: Column(
                children: [
                  if (strong.isNotEmpty)
                    ListTile(
                      leading: const Icon(Icons.check_circle, color: Colors.green),
                      title: const Text('Strong Subjects', style: TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(strong),
                    ),
                  if (strong.isNotEmpty && weak.isNotEmpty)
                    const Divider(height: 1),
                  if (weak.isNotEmpty)
                    ListTile(
                      leading: const Icon(Icons.warning, color: Colors.amber),
                      title: const Text('Focus Required', style: TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(weak),
                    ),
                  if (strong.isEmpty && weak.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16.0),
                      child: Text('Not enough study data yet to outline specific strong or weak strands.', style: TextStyle(color: Colors.grey)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text('Recommendations', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryGreen)),
            const SizedBox(height: 16),
            ...(report['recommendations'] as List? ?? []).map((rec) {
              final priority = rec['priority'] ?? 'medium';
              final pColor = priority == 'high' ? Colors.red : (priority == 'medium' ? Colors.orange : Colors.green);
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: pColor.withValues(alpha: 0.1), shape: BoxShape.circle),
                    child: Icon(Icons.lightbulb_outline, color: pColor),
                  ),
                  title: Text(rec['title'] ?? 'Recommendation', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(rec['description'] ?? ''),
                ),
              );
            }),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildReportStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
