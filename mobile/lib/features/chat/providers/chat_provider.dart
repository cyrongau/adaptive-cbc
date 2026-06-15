import 'dart:async';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../core/network/api_client.dart';
import '../../../core/constants.dart';

class ChatProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  io.Socket? _socket;
  
  bool _isLoadingConversations = false;
  bool _isLoadingMessages = false;
  List<dynamic> _conversations = [];
  final Map<String, List<dynamic>> _messagesCache = {};
  String? _activeConversationId;
  
  // Presence and typing states
  Set<String> _onlineUserIds = {};
  final Map<String, String> _typingUsers = {}; // Map of userId to userName
  
  bool get isLoadingConversations => _isLoadingConversations;
  bool get isLoadingMessages => _isLoadingMessages;
  List<dynamic> get conversations => _conversations;
  List<dynamic> get activeMessages => _messagesCache[_activeConversationId] ?? [];
  String? get activeConversationId => _activeConversationId;
  Set<String> get onlineUserIds => _onlineUserIds;
  Map<String, String> get typingUsers => _typingUsers;
  bool get isConnected => _socket?.connected ?? false;

  // Initialize and connect socket
  Future<void> connect(String userId) async {
    if (_socket != null && _socket!.connected) return;
    
    // Load cookies to simulate browser session cookies
    final cookies = await _apiClient.cookieJar.loadForRequest(Uri.parse(AppConstants.baseHttpUrl));
    final cookieString = cookies.map((c) => '${c.name}=${c.value}').join('; ');

    // Configure connection options to support polling fallback and headers
    _socket = io.io(
      '${AppConstants.baseWsUrl}/chat',
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setExtraHeaders({
            if (cookieString.isNotEmpty) 'cookie': cookieString,
          })
          .enableForceNew()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionAttempts(99)
          .build(),
    );

    _socket!.onConnect((_) {
      print('[Socket] Connected to chat gateway');
      notifyListeners();
      
      // If we had an active conversation, rejoin it
      if (_activeConversationId != null) {
        joinConversation(_activeConversationId!);
      }
    });

    _socket!.onDisconnect((_) {
      print('[Socket] Disconnected from chat gateway');
      notifyListeners();
    });

    _socket!.onConnectError((data) {
      print('[Socket] Connection error: $data');
    });

    _socket!.onError((data) {
      print('[Socket] General error: $data');
    });

    // Handle incoming messages
    _socket!.on('messageReceived', (data) {
      print('[Socket] Message received: $data');
      final String convId = data['conversationId'] ?? '';
      if (convId.isNotEmpty) {
        if (!_messagesCache.containsKey(convId)) {
          _messagesCache[convId] = [];
        }
        
        // Add message if it's not already in list
        final list = _messagesCache[convId]!;
        final bool exists = list.any((msg) => msg['id'] == data['id']);
        if (!exists) {
          list.add(data);
          // Sort messages by creation date (older first)
          list.sort((a, b) {
            final da = DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime.now();
            final db = DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime.now();
            return da.compareTo(db);
          });
          
          // Move conversation to top in conversations list
          _updateConversationLastMessage(convId, data);
          notifyListeners();
        }
      }
    });

    // Handle read receipts
    _socket!.on('messagesRead', (data) {
      print('[Socket] Messages read receipt: $data');
      final String convId = data['conversationId'] ?? '';
      final List<dynamic> messageIds = data['messageIds'] as List? ?? [];
      
      if (convId.isNotEmpty && messageIds.isNotEmpty && _messagesCache.containsKey(convId)) {
        final list = _messagesCache[convId]!;
        for (var msg in list) {
          if (messageIds.contains(msg['id'])) {
            msg['readAt'] = data['readAt'] ?? DateTime.now().toIso8601String();
          }
        }
        notifyListeners();
      }
    });

    // Handle online users inside active room
    _socket!.on('onlineUsers', (data) {
      print('[Socket] Online users update: $data');
      final String convId = data['conversationId'] ?? '';
      if (convId == _activeConversationId) {
        final List<dynamic> userIds = data['userIds'] as List? ?? [];
        _onlineUserIds = userIds.map((id) => id.toString()).toSet();
        notifyListeners();
      }
    });

    _socket!.on('onlineUserIds', (data) {
      final String convId = data['conversationId'] ?? '';
      if (convId == _activeConversationId) {
        final List<dynamic> userIds = data['userIds'] as List? ?? [];
        _onlineUserIds = userIds.map((id) => id.toString()).toSet();
        notifyListeners();
      }
    });

    // Handle typing events
    _socket!.on('typing', (data) {
      final String convId = data['conversationId'] ?? '';
      if (convId == _activeConversationId) {
        final String userId = data['userId'] ?? '';
        final String name = data['userName'] ?? 'Someone';
        final bool isTyping = data['isTyping'] ?? false;
        
        if (isTyping && userId.isNotEmpty) {
          _typingUsers[userId] = name;
        } else {
          _typingUsers.remove(userId);
        }
        notifyListeners();
      }
    });

    // Handle custom gateway errors
    _socket!.on('authError', (data) {
      print('[Socket] Authentication error on gateway: $data');
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _activeConversationId = null;
    _messagesCache.clear();
    _onlineUserIds.clear();
    _typingUsers.clear();
    notifyListeners();
  }

  // Fetch all conversations from HTTP API
  Future<void> fetchConversations() async {
    _isLoadingConversations = true;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get(AppConstants.conversations);
      if (response.statusCode == 200) {
        _conversations = response.data as List? ?? [];
        
        // Seed our messages cache from preloaded messages in conversation payload
        for (var conv in _conversations) {
          final String id = conv['id'] ?? '';
          final List<dynamic> msgs = conv['messages'] as List? ?? [];
          if (id.isNotEmpty) {
            // NestJS returns latest messages first. Let's reverse to show oldest first in UI.
            _messagesCache[id] = msgs.reversed.toList();
          }
        }
      }
    } catch (e) {
      print('[Chat] Fetch conversations failed: $e');
    }

    _isLoadingConversations = false;
    notifyListeners();
  }

  // Active room management
  void joinConversation(String conversationId) {
    if (_activeConversationId != null && _activeConversationId != conversationId) {
      leaveConversation(_activeConversationId!);
    }
    
    _activeConversationId = conversationId;
    _onlineUserIds.clear();
    _typingUsers.clear();
    
    if (_socket != null && _socket!.connected) {
      _socket!.emit('joinConversation', {'conversationId': conversationId});
    }
    
    _fetchMessages(conversationId);
    markConversationAsRead(conversationId);
    notifyListeners();
  }

  void leaveConversation(String conversationId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('leaveConversation', {'conversationId': conversationId});
    }
    if (_activeConversationId == conversationId) {
      _activeConversationId = null;
    }
    notifyListeners();
  }

  // Fetch messages from HTTP API (fallback/initial seed)
  Future<void> _fetchMessages(String conversationId) async {
    _isLoadingMessages = true;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get('${AppConstants.conversations}/$conversationId/messages');
      if (response.statusCode == 200) {
        _messagesCache[conversationId] = response.data as List? ?? [];
      }
    } catch (e) {
      print('[Chat] Fetch messages failed: $e');
    }

    _isLoadingMessages = false;
    notifyListeners();
  }

  // Send message
  Future<void> sendMessage(String text) async {
    if (_activeConversationId == null || text.trim().isEmpty) return;
    
    final String convId = _activeConversationId!;
    final String body = text.trim();
    
    // We can emit over websocket or post to HTTP
    if (_socket != null && _socket!.connected) {
      _socket!.emit('sendMessage', {
        'conversationId': convId,
        'message': body,
      });
      // Typing status is stopped upon sending
      sendTyping(false);
    } else {
      // Fallback to HTTP
      try {
        final response = await _apiClient.dio.post(
          '${AppConstants.conversations}/$convId/messages',
          data: {'message': body},
        );
        if (response.statusCode == 201 || response.statusCode == 200) {
          final newMsg = response.data;
          if (!_messagesCache.containsKey(convId)) {
            _messagesCache[convId] = [];
          }
          _messagesCache[convId]!.add(newMsg);
          _updateConversationLastMessage(convId, newMsg);
          notifyListeners();
        }
      } catch (e) {
        print('[Chat] Send message failed: $e');
      }
    }
  }

  // Broadcast typing status
  void sendTyping(bool isTyping) {
    if (_activeConversationId == null) return;
    if (_socket != null && _socket!.connected) {
      _socket!.emit('typing', {
        'conversationId': _activeConversationId,
        'isTyping': isTyping,
      });
    }
  }

  // Mark messages as read
  Future<void> markConversationAsRead(String conversationId) async {
    try {
      await _apiClient.dio.put('${AppConstants.conversations}/$conversationId/read');
      
      // Update local unread state
      for (var conv in _conversations) {
        if (conv['id'] == conversationId) {
          conv['unreadCount'] = 0;
        }
      }
      notifyListeners();
    } catch (e) {
      print('[Chat] Mark read failed: $e');
    }
  }

  // Private helper to update last message in conversation list
  void _updateConversationLastMessage(String conversationId, Map<String, dynamic> message) {
    for (var conv in _conversations) {
      if (conv['id'] == conversationId) {
        conv['messages'] = [message];
        conv['updatedAt'] = message['createdAt'];
      }
    }
    
    // Sort conversations by updated date (newest first)
    _conversations.sort((a, b) {
      final da = DateTime.tryParse(a['updatedAt'] ?? '') ?? DateTime.now();
      final db = DateTime.tryParse(b['updatedAt'] ?? '') ?? DateTime.now();
      return db.compareTo(da);
    });
  }
}
