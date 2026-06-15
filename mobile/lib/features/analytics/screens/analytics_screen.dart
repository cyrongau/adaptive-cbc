import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _statsData;
  List<dynamic> _weakAreas = [];
  List<dynamic> _insights = [];
  List<dynamic> _recentActivities = [];

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final statsResponse = await _apiClient.dio.get(AppConstants.stats);
      final weakResponse = await _apiClient.dio.get(AppConstants.weakAreas);
      final insightsResponse = await _apiClient.dio.get(AppConstants.insights);
      final dashboardResponse = await _apiClient.dio.get(AppConstants.dashboard);

      if (mounted) {
        setState(() {
          _statsData = statsResponse.statusCode == 200 ? statsResponse.data : null;
          _weakAreas = weakResponse.statusCode == 200 ? (weakResponse.data as List? ?? []) : [];
          _insights = insightsResponse.statusCode == 200 ? (insightsResponse.data as List? ?? []) : [];
          _recentActivities = dashboardResponse.statusCode == 200 
              ? (dashboardResponse.data['recentActivities'] as List? ?? []) 
              : [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load analytics data. Swipe down to refresh.';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Learning Analytics'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAnalytics,
        color: AppColors.primary,
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              )
            : _errorMessage != null
                ? SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Container(
                      height: MediaQuery.of(context).size.height * 0.7,
                      alignment: Alignment.center,
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.bar_chart_rounded, size: 64, color: AppColors.onSurfaceVariant.withOpacity(0.3)),
                          const SizedBox(height: 16),
                          Text(
                            _errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.onSurfaceVariant),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: _fetchAnalytics,
                            child: const Text('Try Again'),
                          ),
                        ],
                      ),
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSummaryCards(),
                        const SizedBox(height: 24),
                        _buildChartSection(theme),
                        const SizedBox(height: 24),
                        _buildWeakAreasSection(theme),
                        const SizedBox(height: 24),
                        _buildInsightsSection(theme),
                        const SizedBox(height: 80), // bottom nav buffer
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildSummaryCards() {
    final successRate = _statsData?['successRate'] ?? 0.0;
    final totalSessions = _statsData?['totalSessions'] ?? 0;
    final totalTime = _statsData?['totalTimeMinutes'] ?? 0;
    final avgScore = _statsData?['averageScore'] ?? 0.0;

    return Row(
      children: [
        Expanded(
          child: _buildMetricMiniCard(
            title: 'Overall Success',
            value: '${successRate.toStringAsFixed(1)}%',
            subtitle: 'Avg: ${avgScore.toStringAsFixed(1)}%',
            color: AppColors.primary,
            icon: Icons.emoji_events_outlined,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricMiniCard(
            title: 'Total Efforts',
            value: '$totalSessions Sessions',
            subtitle: '$totalTime mins study',
            color: AppColors.accent,
            icon: Icons.auto_stories_outlined,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricMiniCard({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required IconData icon,
  }) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.surfaceContainer),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }

  Widget _buildChartSection(ThemeData theme) {
    // Collect last 6 sessions or show default
    List<FlSpot> spots = [];
    if (_recentActivities.isEmpty) {
      spots = [
        const FlSpot(0, 50),
        const FlSpot(1, 60),
        const FlSpot(2, 55),
        const FlSpot(3, 75),
        const FlSpot(4, 85),
      ];
    } else {
      // Sort activities oldest to newest for chronological plotting
      final sortedActs = List.from(_recentActivities.reversed.toList());
      for (int i = 0; i < sortedActs.length; i++) {
        final double score = (sortedActs[i]['score'] ?? 0).toDouble();
        spots.add(FlSpot(i.toDouble(), score));
      }
    }

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.surfaceContainer),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Performance Trend',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'Your scores from recent practice sessions',
              style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 32,
                        interval: 20,
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  minX: 0,
                  maxX: (spots.length - 1).toDouble(),
                  minY: 0,
                  maxY: 100,
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: AppColors.primary,
                      barWidth: 4,
                      isStrokeCapRound: true,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppColors.primary.withOpacity(0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWeakAreasSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Concepts to Improve',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (_weakAreas.isEmpty)
          Card(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: AppColors.surfaceContainer),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: Colors.green, size: 32),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Outstanding job! No weak strands identified (All scores above 70%).',
                      style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _weakAreas.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final item = _weakAreas[index];
              final String subject = item['subjectId'] ?? 'General';
              final String topic = item['topicId'] ?? 'Topic Strand';
              final double rate = (item['successRate'] ?? 0).toDouble();

              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: AppColors.surfaceContainer),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              topic,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              subject,
                              style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                      Text(
                        '${rate.toStringAsFixed(0)}% Success',
                        style: const TextStyle(
                          color: AppColors.error,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildInsightsSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Learning Recommendations',
          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (_insights.isEmpty)
          Card(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: AppColors.surfaceContainer),
            ),
            child: const Padding(
              padding: EdgeInsets.all(20.0),
              child: Row(
                children: [
                  Icon(Icons.lightbulb_outline_rounded, color: AppColors.accent, size: 28),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Complete more exercises to unlock personalized learning recommendations.',
                      style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _insights.length,
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final ins = _insights[index];
              final String type = ins['type'] ?? 'info';
              final String content = ins['insightText'] ?? 'Recommendation details';

              return Card(
                elevation: 0,
                color: Colors.amber.shade50.withOpacity(0.6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.amber.shade100),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.lightbulb_rounded, color: AppColors.accent, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          content,
                          style: const TextStyle(fontSize: 13, color: Colors.black87),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}
