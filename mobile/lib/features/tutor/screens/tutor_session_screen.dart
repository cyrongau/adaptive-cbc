import 'dart:async';
import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';

class TutorSessionScreen extends StatefulWidget {
  final String sessionId;
  final String role;

  const TutorSessionScreen({
    super.key,
    required this.sessionId,
    required this.role,
  });

  @override
  State<TutorSessionScreen> createState() => _TutorSessionScreenState();
}

class _TutorSessionScreenState extends State<TutorSessionScreen> {
  late Room _room;
  final ApiClient _apiClient = ApiClient();
  bool _isConnecting = true;
  bool _isServerOffline = false;
  String _statusMessage = 'Requesting permissions...';
  int _elapsedSeconds = 0;
  Timer? _timer;

  Participant? _localParticipant;
  List<Participant> _remoteParticipants = [];
  bool _isMicMuted = false;
  bool _isCameraOff = false;
  bool _showInfo = false;

  @override
  void initState() {
    super.initState();
    _room = Room();
    _connectToRoom();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _room.removeListener(_onRoomDidUpdate);
    _room.disconnect();
    _room.dispose();
    super.dispose();
  }

  void _onRoomDidUpdate() {
    if (!mounted) return;
    setState(() {
      _localParticipant = _room.localParticipant;
      _remoteParticipants = _room.remoteParticipants.values.toList();
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSeconds++);
    });
  }

  String _formatTime(int totalSecs) {
    final h = totalSecs ~/ 3600;
    final m = (totalSecs % 3600) ~/ 60;
    final s = totalSecs % 60;
    if (h > 0) return '${h}h ${m}m ${s}s';
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _connectToRoom() async {
    final permissions = await [
      Permission.camera,
      Permission.microphone,
    ].request();

    if (permissions[Permission.camera] != PermissionStatus.granted ||
        permissions[Permission.microphone] != PermissionStatus.granted) {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _isServerOffline = true;
          _statusMessage = 'Camera and microphone permissions are required.';
        });
      }
      return;
    }

    if (mounted) setState(() => _statusMessage = 'Connecting...');

    try {
      final tokenRes = await _apiClient.dio.get('${AppConstants.tutorSessionToken}/${widget.sessionId}/token');
      final tokenData = tokenRes.data as Map<String, dynamic>;
      final token = tokenData['token'] as String?;

      if (token == null || token.isEmpty) {
        throw Exception('Failed to get session token');
      }

      final serverUrl = AppConstants.liveKitUrl;

      _room.addListener(_onRoomDidUpdate);
      await _room.connect(serverUrl, token).timeout(
        const Duration(seconds: 15),
        onTimeout: () => throw TimeoutException('Connection timed out'),
      );

      await _room.localParticipant?.setCameraEnabled(true);
      await _room.localParticipant?.setMicrophoneEnabled(true);

      _startTimer();

      if (mounted) setState(() => _isConnecting = false);
    } on TimeoutException {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _isServerOffline = true;
          _statusMessage = 'Connection timed out.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _isServerOffline = true;
          _statusMessage = 'Failed to connect: ${e.toString()}';
        });
      }
    }
  }

  void _toggleMic() {
    setState(() {
      _isMicMuted = !_isMicMuted;
      if (!_isServerOffline) {
        _room.localParticipant?.setMicrophoneEnabled(!_isMicMuted);
      }
    });
  }

  void _toggleCamera() {
    setState(() {
      _isCameraOff = !_isCameraOff;
      if (!_isServerOffline) {
        _room.localParticipant?.setCameraEnabled(!_isCameraOff);
      }
    });
  }

  Future<void> _endSession() async {
    try {
      await _apiClient.dio.post('${AppConstants.tutorSessionEnd}/${widget.sessionId}/end', data: {
        'notes': 'Session ended by ${widget.role}',
      });
    } catch (_) {}

    _timer?.cancel();
    await _room.disconnect();
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Video area
            Positioned.fill(child: _buildVideoArea()),

            // Connection / error overlay
            if (_isConnecting || _isServerOffline)
              Positioned.fill(
                child: Container(
                  color: Colors.black87,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_isConnecting) ...[
                          const CircularProgressIndicator(color: Colors.white),
                          const SizedBox(height: 20),
                          Text(_statusMessage, style: const TextStyle(color: Colors.white70, fontSize: 15)),
                        ],
                        if (_isServerOffline) ...[
                          Icon(Icons.wifi_off_rounded, size: 64, color: Colors.grey[500]),
                          const SizedBox(height: 16),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32),
                            child: Text(_statusMessage,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.white70, fontSize: 15)),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () {
                              setState(() {
                                _isConnecting = true;
                                _isServerOffline = false;
                                _statusMessage = 'Reconnecting...';
                              });
                              _connectToRoom();
                            },
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('Retry'),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),

            // Top bar
            if (!_isConnecting)
              Positioned(
                top: 8, left: 16, right: 16,
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: _endSession,
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.timer_rounded, color: Colors.white, size: 16),
                          const SizedBox(width: 6),
                          Text(_formatTime(_elapsedSeconds),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: Icon(Icons.info_outline_rounded, color: _showInfo ? AppColors.primary : Colors.white),
                      onPressed: () => setState(() => _showInfo = !_showInfo),
                    ),
                  ],
                ),
              ),

            // Bottom controls
            if (!_isConnecting)
              Positioned(
                bottom: 32, left: 0, right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _controlButton(
                      _isMicMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                      _toggleMic, _isMicMuted ? Colors.red : Colors.white),
                    const SizedBox(width: 20),
                    _controlButton(
                      _isCameraOff ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                      _toggleCamera, _isCameraOff ? Colors.red : Colors.white),
                    const SizedBox(width: 20),
                    _controlButton(
                      Icons.call_end_rounded, _endSession, Colors.red, large: true),
                  ],
                ),
              ),

            // Info overlay
            if (_showInfo && !_isConnecting)
              Positioned(
                top: 70, left: 16, right: 16,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black87,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Session: ${widget.sessionId.substring(0, 8)}...',
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text('Role: ${widget.role}',
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text('Duration: ${_formatTime(_elapsedSeconds)}',
                        style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _endSession,
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                          child: const Text('End Session', style: TextStyle(color: Colors.white)),
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

  Widget _controlButton(IconData icon, VoidCallback onTap, Color color, {bool large = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: large ? 60 : 52,
        height: large ? 60 : 52,
        decoration: BoxDecoration(
          color: color == Colors.red
              ? Colors.red
              : Colors.white.withValues(alpha: 0.2),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: large ? 28 : 24),
      ),
    );
  }

  Widget _buildVideoArea() {
    if (_isConnecting) return const SizedBox.shrink();

    final remote = _remoteParticipants.isNotEmpty ? _remoteParticipants.first : null;

    if (remote != null) {
      final tracks = remote.videoTrackPublications;
      if (tracks.isNotEmpty) {
        final track = tracks.first.track as VideoTrack?;
        if (track != null) {
          return VideoTrackRenderer(track);
        }
      }
    }

    if (_localParticipant != null) {
      final localTracks = _localParticipant!.videoTrackPublications;
      if (localTracks.isNotEmpty) {
        final track = localTracks.first.track as VideoTrack?;
        if (track != null) {
          return VideoTrackRenderer(track);
        }
      }
    }

    return const Center(
      child: Icon(Icons.videocam_off_rounded, color: Colors.white24, size: 64),
    );
  }
}
