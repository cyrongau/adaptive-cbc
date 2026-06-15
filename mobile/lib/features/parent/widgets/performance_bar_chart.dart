import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_colors.dart';

class PerformanceBarChart extends StatelessWidget {
  final List<dynamic> subjectPerformance;

  const PerformanceBarChart({super.key, required this.subjectPerformance});

  @override
  Widget build(BuildContext context) {
    if (subjectPerformance.isEmpty) {
      return const Center(child: Text('No subject performance data available.'));
    }

    return AspectRatio(
      aspectRatio: 1.5,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: 100,
          barTouchData: BarTouchData(
            enabled: true,
            touchTooltipData: BarTouchTooltipData(
              tooltipPadding: const EdgeInsets.all(8),
              tooltipMargin: 8,
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                final subject = subjectPerformance[group.x.toInt()]['subjectName'] ?? 'Unknown';
                return BarTooltipItem(
                  '$subject\n${rod.toY.round()}%',
                  const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                );
              },
            ),
          ),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= subjectPerformance.length) {
                    return const SizedBox();
                  }
                  String name = subjectPerformance[index]['subjectName'] ?? '';
                  // Truncate name for better display if it's too long
                  if (name.length > 8) name = '${name.substring(0, 6)}..';
                  return Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      name,
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                getTitlesWidget: (value, meta) {
                  return Text(
                    value.toInt().toString(),
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  );
                },
              ),
            ),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 20,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: Colors.grey.withValues(alpha: 0.2),
                strokeWidth: 1,
              );
            },
          ),
          borderData: FlBorderData(show: false),
          barGroups: subjectPerformance.asMap().entries.map((entry) {
            final index = entry.key;
            final data = entry.value;
            final score = (data['score'] ?? 0).toDouble();
            Color barColor = AppColors.primaryGreen;
            if (score < 50) {
              barColor = Colors.orange;
            } else if (score < 70) {
              barColor = AppColors.accentGolden;
            }

            return BarChartGroupData(
              x: index,
              barRods: [
                BarChartRodData(
                  toY: score,
                  color: barColor,
                  width: 16,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}
