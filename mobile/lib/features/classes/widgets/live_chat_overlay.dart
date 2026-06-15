import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart';
import '../../../core/theme/app_colors.dart';

class ChatMessage {
  final String senderName;
  final String senderIdentity;
  final String message;
  final int timestamp;
  final bool isLocal;

  ChatMessage({
    required this.senderName,
    required this.senderIdentity,
    required this.message,
    required this.timestamp,
    required this.isLocal,
  });
}

class LiveChatOverlay extends StatefulWidget {
  final Room room;
  final VoidCallback onClose;

  const LiveChatOverlay({
    super.key,
    required this.room,
    required this.onClose,
  });

  @override
  State<LiveChatOverlay> createState() => _LiveChatOverlayState();
}

class _LiveChatOverlayState extends State<LiveChatOverlay> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  EventsListener<RoomEvent>? _listener;

  @override
  void initState() {
    super.initState();
    _setupListener();
  }

  void _setupListener() {
    _listener = widget.room.createListener();
    _listener?.on<DataReceivedEvent>((event) {
      if (event.topic == 'chat') {
        _handleIncomingMessage(event);
      }
    });
  }

  void _handleIncomingMessage(DataReceivedEvent event) {
    try {
      final String payloadStr = utf8.decode(event.data);
      // Try to parse as JSON (LiveKit React components format)
      String messageText = '';
      int timestamp = DateTime.now().millisecondsSinceEpoch;
      
      try {
        final decoded = jsonDecode(payloadStr);
        messageText = decoded['message'] ?? payloadStr;
        timestamp = decoded['timestamp'] ?? timestamp;
      } catch (_) {
        // Fallback to raw string if not JSON
        messageText = payloadStr;
      }

      final senderName = event.participant?.name ?? event.participant?.identity ?? 'Unknown';
      final senderIdentity = event.participant?.identity ?? 'unknown';

      setState(() {
        _messages.add(ChatMessage(
          senderName: senderName,
          senderIdentity: senderIdentity,
          message: messageText,
          timestamp: timestamp,
          isLocal: false,
        ));
      });
      _scrollToBottom();
    } catch (e) {
      print('Failed to decode chat message: $e');
    }
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final payload = jsonEncode({
      'message': text,
      'timestamp': timestamp,
    });

    try {
      await widget.room.localParticipant?.publishData(
        utf8.encode(payload),
        reliable: true,
        topic: 'chat',
      );

      setState(() {
        _messages.add(ChatMessage(
          senderName: widget.room.localParticipant?.name ?? 'Me',
          senderIdentity: widget.room.localParticipant?.identity ?? 'me',
          message: text,
          timestamp: timestamp,
          isLocal: true,
        ));
      });
      _scrollToBottom();
    } catch (e) {
      print('Failed to send message: $e');
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _listener?.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: Colors.white,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: AppColors.surfaceContainer,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Live Chat',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: widget.onClose,
                  splashRadius: 24,
                ),
              ],
            ),
          ),
          
          // Messages
          Expanded(
            child: _messages.isEmpty
                ? const Center(
                    child: Text(
                      'No messages yet. Say hi!',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      return _buildMessageBubble(msg);
                    },
                  ),
          ),

          // Input
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 8,
              bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: AppColors.surfaceContainer.withOpacity(0.5),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: AppColors.primary,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white, size: 20),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: msg.isLocal ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 4, left: 4, right: 4),
            child: Text(
              msg.isLocal ? 'Me' : msg.senderName,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: msg.isLocal ? AppColors.primary : AppColors.surfaceContainer,
              borderRadius: BorderRadius.circular(16).copyWith(
                bottomRight: msg.isLocal ? const Radius.circular(4) : const Radius.circular(16),
                bottomLeft: !msg.isLocal ? const Radius.circular(4) : const Radius.circular(16),
              ),
            ),
            child: Text(
              msg.message,
              style: TextStyle(
                color: msg.isLocal ? Colors.white : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
