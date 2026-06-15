import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import '../network/api_client.dart';
import 'database_helper.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  bool _isSyncing = false;

  void initialize() {
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (results.contains(ConnectivityResult.mobile) || 
          results.contains(ConnectivityResult.wifi)) {
        _syncQueue();
      }
    });
  }

  Future<void> _syncQueue() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final queue = await DatabaseHelper.instance.getSyncQueue();
      if (queue.isEmpty) {
        _isSyncing = false;
        return;
      }

      print('Starting offline sync. Queue size: \${queue.length}');
      final dio = ApiClient().dio;

      for (final item in queue) {
        final id = item['id'] as int;
        final url = item['url'] as String;
        final method = item['method'] as String;
        final bodyStr = item['request_body'] as String?;
        final headersStr = item['headers'] as String?;

        final data = bodyStr != null ? jsonDecode(bodyStr) : null;
        final headers = headersStr != null ? jsonDecode(headersStr) as Map<String, dynamic> : null;

        try {
          if (method.toUpperCase() == 'POST') {
            await dio.post(url, data: data, options: Options(headers: headers));
          } else if (method.toUpperCase() == 'PUT') {
            await dio.put(url, data: data, options: Options(headers: headers));
          } else if (method.toUpperCase() == 'DELETE') {
            await dio.delete(url, data: data, options: Options(headers: headers));
          }

          // If successful (no exception thrown), remove from queue
          await DatabaseHelper.instance.removeFromSyncQueue(id);
          print('Successfully synced request \${id}: \${method} \${url}');
        } catch (e) {
          print('Failed to sync request \${id}: \${method} \${url} - \${e}');
          // Depending on the error (e.g. 400 Bad Request), we might want to discard it anyway
          // For now, we'll keep it in the queue for the next retry if it's a network error
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  Future<bool> isOffline() async {
    final results = await Connectivity().checkConnectivity();
    return results.contains(ConnectivityResult.none);
  }
}
