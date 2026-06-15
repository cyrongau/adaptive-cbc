import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/chat_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class ChatDetailScreen extends StatefulWidget {
  final String conversationId;
  final String recipientName;
  final String recipientRole;

  const ChatDetailScreen({
    super.key,
    required this.conversationId,
    this.recipientName = 'Chat',
    this.recipientRole = '',
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _typingTimer;
  bool _isTypingLocal = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final chatProvider = Provider.of<ChatProvider>(context, listen: false);
      chatProvider.joinConversation(widget.conversationId);
    });
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 60,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _onTextChanged(String text) {
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    if (!_isTypingLocal && text.isNotEmpty) {
      _isTypingLocal = true;
      chatProvider.sendTyping(true);
    }

    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      if (_isTypingLocal) {
        _isTypingLocal = false;
        chatProvider.sendTyping(false);
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    _messageController.clear();
    _isTypingLocal = false;
    
    await chatProvider.sendMessage(text);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = Provider.of<ChatProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUserId = authProvider.currentUser?['id']?.toString() ?? '';

    // Scroll to bottom when new messages arrive
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (chatProvider.activeMessages.isNotEmpty && !chatProvider.isLoadingMessages) {
        _scrollToBottom();
      }
    });

    // Resolve details for App Bar
    String appTitle = widget.recipientName;
    String statusText = widget.recipientRole.isNotEmpty ? widget.recipientRole : 'Offline';
    bool isOnline = false;

    final conv = chatProvider.conversations.firstWhere(
      (c) => c['id'] == widget.conversationId,
      orElse: () => null,
    );

    if (conv != null) {
      String displayTitle = conv['title'] ?? '';
      final participants = conv['participants'] as List? ?? [];
      final otherParticipants = participants.where((p) => p['id'].toString() != currentUserId).toList();

      if (displayTitle.isEmpty && otherParticipants.isNotEmpty) {
        final other = otherParticipants.first;
        displayTitle = '${other['firstName'] ?? ''} ${other['lastName'] ?? ''}'.trim();
        if (displayTitle.isEmpty) {
          displayTitle = other['email'] ?? 'Chat';
        }
        
        isOnline = otherParticipants.any((p) => chatProvider.onlineUserIds.contains(p['id'].toString()));
        statusText = isOnline ? 'Online' : 'Offline';
      } else if (displayTitle.isEmpty) {
        displayTitle = 'Group Chat';
        statusText = '${participants.length} members';
      }
      appTitle = displayTitle;
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.accentGolden,
              radius: 18,
              child: Text(
                appTitle.isNotEmpty ? appTitle[0].toUpperCase() : 'C',
                style: const TextStyle(
                  color: AppColors.primaryGreen,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appTitle,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    statusText,
                    style: TextStyle(
                      fontSize: 11,
                      color: isOnline ? Colors.greenAccent : Colors.white70,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.primaryGreen,
      ),
      body: Container(
        decoration: BoxDecoration(
          color: Colors.grey[100],
        ),
        child: Column(
          children: [
            // Messages List
            Expanded(
              child: chatProvider.isLoadingMessages && chatProvider.activeMessages.isEmpty
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                      ),
                    )
                  : chatProvider.activeMessages.isEmpty
                      ? _buildWelcomeState(appTitle)
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: chatProvider.activeMessages.length,
                          itemBuilder: (context, index) {
                            final msg = chatProvider.activeMessages[index];
                            final isMe = msg['senderId']?.toString() == currentUserId;
                            return _buildMessageBubble(msg, isMe);
                          },
                        ),
            ),

            // Typing Indicator
            if (chatProvider.typingUsers.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${chatProvider.typingUsers.values.join(", ")} typing...',
                      style: const TextStyle(
                        fontStyle: FontStyle.italic,
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),

            // Bottom Input Section
            _buildInputSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeState(String title) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.accentGolden.withOpacity(0.2),
              child: const Icon(
                Icons.chat,
                size: 40,
                color: AppColors.accentGolden,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Chat with $title',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Say hello! Messages are secure, confidential, and synchronized in real-time.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(dynamic msg, bool isMe) {
    final sender = msg['sender'];
    final senderName = sender != null
        ? '${sender['firstName'] ?? ''} ${sender['lastName'] ?? ''}'.trim()
        : 'User';
    final text = msg['message'] ?? '';
    final attachmentUrl = msg['attachmentUrl'];
    final readAt = msg['readAt'];

    String timeStr = '';
    final created = DateTime.tryParse(msg['createdAt'] ?? '');
    if (created != null) {
      timeStr = DateFormat('jm').format(created);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Name for other user in group
          if (!isMe)
            Padding(
              padding: const EdgeInsets.only(left: 4.0, bottom: 2.0),
              child: Text(
                senderName,
                style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
            ),
          Row(
            mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!isMe) ...[
                CircleAvatar(
                  radius: 12,
                  backgroundColor: AppColors.primaryGreen.withOpacity(0.2),
                  child: Text(
                    senderName.isNotEmpty ? senderName[0].toUpperCase() : '?',
                    style: const TextStyle(color: AppColors.primaryGreen, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isMe ? AppColors.primaryGreen : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                      bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (attachmentUrl != null && attachmentUrl.toString().isNotEmpty) ...[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            attachmentUrl.toString(),
                            height: 180,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              color: Colors.grey[200],
                              padding: const EdgeInsets.all(12),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.file_present, color: Colors.red),
                                  SizedBox(width: 8),
                                  Text('Attachment error', style: TextStyle(fontSize: 12)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                      ],
                      Text(
                        text,
                        style: TextStyle(
                          color: isMe ? Colors.white : Colors.black87,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (isMe) ...[
                const SizedBox(width: 6),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Icon(
                      readAt != null ? Icons.done_all : Icons.done,
                      size: 14,
                      color: readAt != null ? Colors.blue : Colors.grey,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      timeStr,
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),
              ] else ...[
                const SizedBox(width: 6),
                Text(
                  timeStr,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInputSection() {
    return Container(
      padding: const EdgeInsets.only(left: 12, right: 12, bottom: 20, top: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                onChanged: _onTextChanged,
                maxLines: null,
                decoration: const InputDecoration(
                  hintText: 'Type your message...',
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: AppColors.primaryGreen,
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white),
              onPressed: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }
}
