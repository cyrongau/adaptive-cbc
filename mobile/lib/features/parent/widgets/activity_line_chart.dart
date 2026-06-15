import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';

class ActivityLineChart extends StatelessWidget {
  final List<dynamic> recentActivity;

  const ActivityLineChart({super.key, required this.recentActivity});

  @override
  Widget build(BuildContext context) {
    if (recentActivity.isEmpty) {
      return const Center(child: Text('No recent activity data available.'));
    }

    // Sort ascending by date for a left-to-right line chart
    final sortedActivity = List<dynamic>.from(recentActivity);
    sortedActivity.sort((a, b) {
      final dateA = DateTime.tryParse(a['date'] ?? '') ?? DateTime.now();
      final dateB = DateTime.tryParse(b['date'] ?? '') ?? DateTime.now();
      return dateA.compareTo(dateB);
    });

    final spots = sortedActivity.asMap().entries.map((entry) {
      final index = entry.key;
      final score = (entry.value['score'] ?? 0).toDouble();
      return FlSpot(index.toDouble(), score);
    }).toList();

    return AspectRatio(
      aspectRatio: 1.5,
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: true,
            horizontalInterval: 20,
            verticalInterval: 1,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: Colors.grey.withValues(alpha: 0.2),
                strokeWidth: 1,
              );
            },
            getDrawingVerticalLine: (value) {
              return FlLine(
                color: Colors.grey.withValues(alpha: 0.2),
                strokeWidth: 1,
              );
            },
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= sortedActivity.length) {
                    return const SizedBox();
                  }
                  final dateStr = sortedActivity[index]['date'] ?? '';
                  final date = DateTime.tryParse(dateStr);
                  final label = date != null ? DateFormat('MMM d').format(date) : '';
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      label,
                      style: const TextStyle(color: Colors.grey, fontSize: 10),
                    ),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                interval: 20,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toInt().toString(),
                    style: const TextStyle(color: Colors.grey, fontSize: 10),
                  );
                },
                reservedSize: 30,
              ),
            ),
          ),
          borderData: FlBorderData(
            show: true,
            border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          minX: 0,
          maxX: (sortedActivity.length - 1).toDouble() > 0 ? (sortedActivity.length - 1).toDouble() : 1,
          minY: 0,
          maxY: 100,
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: AppColors.primaryGreen,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: true),
              belowBarData: BarAreaData(
                show: true,
                color: AppColors.primaryGreen.withValues(alpha: 0.2),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  final activity = sortedActivity[spot.x.toInt()]['activity'] ?? 'Session';
                  return LineTooltipItem(
                    '$activity\n${spot.y.round()}%',
                    const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  );
                }).toList();
              },
            ),
          ),
        ),
      ),
    );
  }
}
