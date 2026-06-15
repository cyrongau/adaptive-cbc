import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/chat_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  bool _isLoadingSearch = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.currentUser != null) {
        final userId = authProvider.currentUser!['id'].toString();
        final chatProvider = Provider.of<ChatProvider>(context, listen: false);
        chatProvider.connect(userId);
        chatProvider.fetchConversations();
      }
    });
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
      });
      return;
    }

    setState(() {
      _isLoadingSearch = true;
    });

    try {
      final response = await _apiClient.dio.get('/users/search', queryParameters: {'q': query});
      if (response.statusCode == 200) {
        setState(() {
          _searchResults = response.data as List? ?? [];
        });
      }
    } catch (e) {
      print('[Chat] User search failed: $e');
    } finally {
      setState(() {
        _isLoadingSearch = false;
      });
    }
  }

  Future<void> _startConversation(Map<String, dynamic> user) async {
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    final currentUserId = Provider.of<AuthProvider>(context, listen: false).currentUser!['id'];

    if (user['id'] == currentUserId) return;

    setState(() {
      _isSearching = false;
      _searchController.clear();
      _searchResults = [];
    });

    try {
      final response = await _apiClient.dio.post(
        '/chat/conversations',
        data: {
          'type': 'direct',
          'participantIds': [user['id']],
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final conv = response.data;
        // Fetch conversations to update list and navigate
        await chatProvider.fetchConversations();
        context.push('/chat/${conv['id']}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to start conversation: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = Provider.of<ChatProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUser = authProvider.currentUser;

    if (currentUser == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final currentUserId = currentUser['id'].toString();

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Search people to chat...',
                  hintStyle: TextStyle(color: Colors.white70),
                  border: InputBorder.none,
                ),
                onChanged: _performSearch,
              )
            : const Text(
                'Inbox Messages',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
        backgroundColor: AppColors.primaryGreen,
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _isSearching = false;
                  _searchController.clear();
                  _searchResults = [];
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
        ],
      ),
      body: _isSearching
          ? _buildSearchResults()
          : RefreshIndicator(
              onRefresh: () async {
                await chatProvider.fetchConversations();
              },
              color: AppColors.primaryGreen,
              child: chatProvider.isLoadingConversations
                  ? const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                      ),
                    )
                  : chatProvider.conversations.isEmpty
                      ? _buildEmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: chatProvider.conversations.length,
                          separatorBuilder: (context, index) => const Divider(height: 1, indent: 76),
                          itemBuilder: (context, index) {
                            final conv = chatProvider.conversations[index];
                            return _buildConversationTile(context, conv, currentUserId);
                          },
                        ),
            ),
    );
  }

  Widget _buildSearchResults() {
    if (_isLoadingSearch) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
        ),
      );
    }

    if (_searchController.text.isEmpty) {
      return const Center(
        child: Text(
          'Type a name or email to start messaging',
          style: TextStyle(color: Colors.grey, fontSize: 16),
        ),
      );
    }

    if (_searchResults.isEmpty) {
      return const Center(
        child: Text(
          'No users found matching query',
          style: TextStyle(color: Colors.grey, fontSize: 16),
        ),
      );
    }

    return ListView.builder(
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        final name = '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
        final role = user['role']?.toString().toUpperCase() ?? 'STUDENT';
        final email = user['email'] ?? '';

        return ListTile(
          leading: CircleAvatar(
            backgroundColor: AppColors.accentGolden.withOpacity(0.2),
            child: Text(
              name.isNotEmpty ? name[0] : 'U',
              style: const TextStyle(
                color: AppColors.primaryGreen,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          title: Text(name.isNotEmpty ? name : email, style: const TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text('$role • $email'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _startConversation(user),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.accentGolden.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chat_bubble_outline,
                size: 80,
                color: AppColors.accentGolden,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No conversations yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Start messaging your teachers, peers, or support assistants to get real-time learning help.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 15, height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _isSearching = true;
                });
              },
              icon: const Icon(Icons.search, color: Colors.white),
              label: const Text('Find People to Chat', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConversationTile(BuildContext context, dynamic conv, String currentUserId) {
    // Resolve Title / Other User Details
    String displayTitle = conv['title'] ?? '';
    String sub = '';
    
    final participants = conv['participants'] as List? ?? [];
    final otherParticipants = participants.where((p) => p['id'].toString() != currentUserId).toList();
    
    if (displayTitle.isEmpty && otherParticipants.isNotEmpty) {
      final other = otherParticipants.first;
      displayTitle = '${other['firstName'] ?? ''} ${other['lastName'] ?? ''}'.trim();
      if (displayTitle.isEmpty) {
        displayTitle = other['email'] ?? 'Unknown User';
      }
      sub = other['role']?.toString().toUpperCase() ?? 'USER';
    } else if (displayTitle.isEmpty) {
      displayTitle = 'Group Conversation';
    }

    // Resolve Last Message
    final messages = conv['messages'] as List? ?? [];
    String lastMessageText = 'No messages yet';
    String timeStr = '';
    
    if (messages.isNotEmpty) {
      final lastMsg = messages.first;
      lastMessageText = lastMsg['message'] ?? '';
      if (lastMsg['senderId']?.toString() == currentUserId) {
        lastMessageText = 'You: $lastMessageText';
      }
      
      final created = DateTime.tryParse(lastMsg['createdAt'] ?? '');
      if (created != null) {
        final now = DateTime.now();
        final diff = now.difference(created);
        if (diff.inDays == 0) {
          timeStr = DateFormat('jm').format(created);
        } else if (diff.inDays == 1) {
          timeStr = 'Yesterday';
        } else {
          timeStr = DateFormat('MMM d').format(created);
        }
      }
    }

    final int unreadCount = conv['unreadCount'] ?? 0;

    return ListTile(
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: AppColors.primaryGreen.withOpacity(0.1),
            child: Text(
              displayTitle.isNotEmpty ? displayTitle[0].toUpperCase() : 'C',
              style: const TextStyle(
                color: AppColors.primaryGreen,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          if (otherParticipants.isNotEmpty)
            // Visual green dot if any participant online
            Positioned(
              right: 2,
              bottom: 2,
              child: Consumer<ChatProvider>(
                builder: (context, cp, _) {
                  final isOnline = otherParticipants.any((p) => cp.onlineUserIds.contains(p['id'].toString()));
                  // In conversations where user is not in the active room, we can rely on standard list check if needed,
                  // but a small visual dot is standard.
                  return isOnline
                      ? Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        )
                      : const SizedBox();
                },
              ),
            ),
        ],
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              displayTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: unreadCount > 0 ? FontWeight.bold : FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
          if (timeStr.isNotEmpty)
            Text(
              timeStr,
              style: TextStyle(
                fontSize: 12,
                color: unreadCount > 0 ? AppColors.primaryGreen : Colors.grey,
                fontWeight: unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
              ),
            ),
        ],
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 4.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                lastMessageText,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: unreadCount > 0 ? Colors.black87 : Colors.grey,
                  fontSize: 14,
                  fontWeight: unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
                ),
              ),
            ),
            if (unreadCount > 0)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: const BoxDecoration(
                  color: AppColors.primaryGreen,
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                child: Text(
                  unreadCount.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
      onTap: () {
        context.push('/chat/${conv['id']}');
      },
    );
  }
}
