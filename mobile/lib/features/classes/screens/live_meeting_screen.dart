import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';
import '../widgets/live_chat_overlay.dart';

class LiveMeetingScreen extends StatefulWidget {
  final String roomId;
  final String roomName;
  final String hostName;

  const LiveMeetingScreen({
    super.key,
    required this.roomId,
    required this.roomName,
    required this.hostName,
  });

  @override
  State<LiveMeetingScreen> createState() => _LiveMeetingScreenState();
}

class _LiveMeetingScreenState extends State<LiveMeetingScreen> {
  late Room _room;
  final ApiClient _apiClient = ApiClient();
  bool _isConnecting = true;
  bool _isServerOffline = false;
  String _statusMessage = 'Requesting camera & microphone permissions...';

  // LiveKit Participants
  Participant? _localParticipant;
  List<Participant> _remoteParticipants = [];

  // State
  bool _isMicMuted = false;
  bool _isCameraOff = false;
  bool _showChat = false;
  bool _hasUnreadMessages = false;
  EventsListener<RoomEvent>? _roomListener;

  @override
  void initState() {
    super.initState();
    _room = Room();
    _connectToRoom();
  }

  @override
  void dispose() {
    _roomListener?.dispose();
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

  Future<void> _connectToRoom() async {
    // 1. Request permissions
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
          _statusMessage = 'Camera and Microphone permissions are required to join the live session.';
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _statusMessage = 'Connecting to LiveKit server...';
      });
    }

    try {
      final response = await _apiClient.dio.post(
        AppConstants.liveToken,
        data: {'roomName': widget.roomId},
      );

      final data = response.data;
      final serverUrl = data['serverUrl'] as String;
      final token = data['token'] as String;

      _room.addListener(_onRoomDidUpdate);
      await _room.connect(serverUrl, token);

      _roomListener = _room.createListener();
      _roomListener?.on<DataReceivedEvent>((event) {
        if (event.topic == 'chat' && !_showChat) {
          if (mounted) {
            setState(() {
              _hasUnreadMessages = true;
            });
          }
        }
      });

      if (mounted) {
        setState(() {
          _isConnecting = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _isServerOffline = true;
          _statusMessage = 'Failed to connect to the live session or server is offline.';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Video Area or Placeholder
            Positioned.fill(
              child: _buildVideoArea(),
            ),

            // Top Bar
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () {
                        _room.disconnect();
                        context.pop();
                      },
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.roomName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Host: ${widget.hostName}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.circle, color: Colors.white, size: 10),
                          SizedBox(width: 4),
                          Text('LIVE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Controls
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.8),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildControlButton(
                      icon: _isMicMuted ? Icons.mic_off : Icons.mic,
                      label: 'Mute',
                      isActive: !_isMicMuted,
                      onTap: _toggleMic,
                    ),
                    _buildControlButton(
                      icon: _isCameraOff ? Icons.videocam_off : Icons.videocam,
                      label: 'Video',
                      isActive: !_isCameraOff,
                      onTap: _toggleCamera,
                    ),
                    _buildControlButton(
                      icon: Icons.chat_bubble_outline,
                      label: 'Chat',
                      isActive: _showChat,
                      hasBadge: _hasUnreadMessages,
                      onTap: () {
                        setState(() {
                          _showChat = !_showChat;
                          if (_showChat) _hasUnreadMessages = false;
                        });
                      },
                    ),
                    _buildControlButton(
                      icon: Icons.call_end,
                      label: 'Leave',
                      isActive: false,
                      isDestructive: true,
                      onTap: () {
                        _room.disconnect();
                        context.pop();
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Chat Overlay
            Offstage(
              offstage: !_showChat,
              child: Align(
                alignment: Alignment.bottomCenter,
                child: SizedBox(
                  height: MediaQuery.of(context).size.height * 0.7,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    child: LiveChatOverlay(
                      room: _room,
                      onClose: () {
                        setState(() {
                          _showChat = false;
                        });
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoArea() {
    if (_isConnecting) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Colors.white),
            const SizedBox(height: 24),
            Text(
              _statusMessage,
              style: const TextStyle(color: Colors.white70, fontSize: 16),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (_isServerOffline) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cast_connected, color: Colors.white38, size: 64),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                _statusMessage,
                style: const TextStyle(color: Colors.white70, fontSize: 16),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      );
    }

    // Real LiveKit Video Grid implementation
    if (_remoteParticipants.isEmpty) {
      return const Center(
        child: Text(
          'Connected. Waiting for host to join...',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    final host = _remoteParticipants.first;
    final videoTracks = host.videoTrackPublications;
    
    if (videoTracks.isEmpty) {
      return const Center(
        child: Text(
          'Host has disabled video.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    // Prioritize screen share over camera
    RemoteTrackPublication? primaryTrack;
    RemoteTrackPublication? secondaryTrack;

    for (var pub in videoTracks) {
      if (pub.source == TrackSource.screenShareVideo) {
        primaryTrack = pub;
      } else if (pub.source == TrackSource.camera) {
        secondaryTrack = pub;
      }
    }

    if (primaryTrack == null && secondaryTrack != null) {
      primaryTrack = secondaryTrack;
      secondaryTrack = null;
    }

    return Stack(
      children: [
        if (primaryTrack != null && primaryTrack.track != null)
          Positioned.fill(
            child: VideoTrackRenderer(primaryTrack.track as VideoTrack),
          ),
        
        if (secondaryTrack != null && secondaryTrack.track != null)
          Positioned(
            right: 16,
            bottom: 120, // above the controls
            width: 100,
            height: 150,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white24),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: VideoTrackRenderer(secondaryTrack.track as VideoTrack),
              ),
            ),
          ),
        if (_localParticipant != null && _localParticipant!.videoTrackPublications.isNotEmpty)
          Positioned(
            right: 16,
            bottom: 120, // above the controls
            width: 100,
            height: 150,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white24),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: VideoTrackRenderer(
                  _localParticipant!.videoTrackPublications.first.track as VideoTrack,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required bool isActive,
    bool isDestructive = false,
    bool hasBadge = false,
    required VoidCallback onTap,
  }) {
    final Color bgColor = isDestructive 
        ? Colors.red 
        : (isActive ? Colors.white24 : Colors.white10);
    
    final Color iconColor = isDestructive 
        ? Colors.white 
        : (isActive ? Colors.white : Colors.white54);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 28),
              ),
              if (hasBadge)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.black, width: 2),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }
}
