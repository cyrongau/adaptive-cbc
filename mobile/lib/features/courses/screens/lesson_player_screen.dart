import 'package:flutter/material.dart';
import 'package:better_player/better_player.dart';
import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';

class LessonPlayerScreen extends StatefulWidget {
  final Map<String, dynamic> lesson;

  const LessonPlayerScreen({super.key, required this.lesson});

  @override
  State<LessonPlayerScreen> createState() => _LessonPlayerScreenState();
}

class _LessonPlayerScreenState extends State<LessonPlayerScreen> {
  BetterPlayerController? _betterPlayerController;
  late String _contentType;

  @override
  void initState() {
    super.initState();
    _contentType = widget.lesson['content_type'] ?? widget.lesson['contentType'] ?? 'video';
    
    if (_contentType == 'video') {
      _setupVideoPlayer();
    }
  }

  void _setupVideoPlayer() {
    final String? videoUrl = widget.lesson['video_url'] ?? widget.lesson['videoUrl'];
    
    if (videoUrl != null && videoUrl.isNotEmpty) {
      final String fullUrl = videoUrl.startsWith('http') ? videoUrl : '${AppConstants.baseHttpUrl}$videoUrl';
      
      BetterPlayerDataSource betterPlayerDataSource = BetterPlayerDataSource(
        BetterPlayerDataSourceType.network,
        fullUrl,
      );

      _betterPlayerController = BetterPlayerController(
        const BetterPlayerConfiguration(
          aspectRatio: 16 / 9,
          fit: BoxFit.contain,
          autoPlay: true,
          looping: false,
          controlsConfiguration: BetterPlayerControlsConfiguration(
            enableFullscreen: true,
            enablePlaybackSpeed: true,
            enableSkips: true,
          ),
        ),
        betterPlayerDataSource: betterPlayerDataSource,
      );
    }
  }

  @override
  void dispose() {
    _betterPlayerController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final String title = widget.lesson['title'] ?? 'Lesson';
    final String? articleBody = widget.lesson['article_body'] ?? widget.lesson['articleBody'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 1,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_contentType == 'video') ...[
              if (_betterPlayerController != null)
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: BetterPlayer(
                    controller: _betterPlayerController!,
                  ),
                )
              else
                Container(
                  height: 220,
                  width: double.infinity,
                  color: Colors.black,
                  child: const Center(
                    child: Text(
                      'No video URL provided for this lesson.',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
            ],
            
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (articleBody != null && articleBody.isNotEmpty) ...[
                    const Text(
                      'Lesson Notes',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      articleBody,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.onSurfaceVariant.withOpacity(0.9),
                        height: 1.5,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
