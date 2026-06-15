import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ApiClient _apiClient = ApiClient();
  
  final List<Map<String, String>> _messages = [
    {
      'role': 'assistant',
      'content': 'Hello! I am your AI Learning Assistant. How can I help you today? I can explain concepts, help with homework, or guide you through practice questions.'
    }
  ];
  
  bool _isLoading = false;

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    
    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _isLoading = true;
    });

    // Scroll after adding user message
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    try {
      // Map 'assistant' back to what openrouter/model expects if needed, 
      // but usually the backend passes these straight through.
      final payload = _messages.map((m) => {
        'role': m['role'],
        'content': m['content'],
      }).toList();

      final response = await _apiClient.dio.post(
        AppConstants.aiChat,
        data: {'messages': payload},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final reply = response.data['response'] as String?;
        if (reply != null) {
          setState(() {
            _messages.add({'role': 'assistant', 'content': reply});
          });
        } else {
           setState(() {
            _messages.add({'role': 'assistant', 'content': 'I received an empty response. Please try again.'});
          });
        }
      }
    } catch (e) {
      setState(() {
        _messages.add({'role': 'assistant', 'content': 'Sorry, I am having trouble connecting to my servers right now.'});
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Ask AI Tutor', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.onSurface)),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: AppColors.onSurface),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isUser = message['role'] == 'user';
                
                return _buildMessageBubble(message['content']!, isUser);
              },
            ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Row(
                children: [
                  SizedBox(width: 16),
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(width: 12),
                  Text('AI is thinking...', style: TextStyle(color: AppColors.onSurfaceVariant)),
                ],
              ),
            ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(String content, bool isUser) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.85,
        ),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20).copyWith(
            bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(20),
            bottomLeft: isUser ? const Radius.circular(20) : const Radius.circular(0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 5,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: isUser
            ? Text(
                content,
                style: const TextStyle(color: Colors.white, fontSize: 16),
              )
            : MarkdownBody(
                data: content,
                selectable: true,
                styleSheet: MarkdownStyleSheet(
                  p: const TextStyle(color: AppColors.onSurface, fontSize: 16, height: 1.4),
                  code: TextStyle(backgroundColor: Colors.grey.shade200, fontFamily: 'monospace'),
                  codeblockDecoration: BoxDecoration(
                    color: Colors.grey.shade900,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _messageController,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendMessage(),
                  decoration: const InputDecoration(
                    hintText: 'Ask anything...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: _isLoading ? null : _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
