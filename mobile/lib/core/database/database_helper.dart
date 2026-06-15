import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('adaptive_learning.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    // Cache for GET requests
    await db.execute('''
      CREATE TABLE api_cache (
        url TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        response_body TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    ''');

    // Queue for offline POST/PUT requests
    await db.execute('''
      CREATE TABLE sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        request_body TEXT,
        headers TEXT,
        timestamp INTEGER NOT NULL
      )
    ''');
  }

  // --- API CACHE METHODS ---

  Future<void> cacheResponse(String url, String method, dynamic data) async {
    final db = await instance.database;
    final jsonString = jsonEncode(data);

    await db.insert(
      'api_cache',
      {
        'url': url,
        'method': method,
        'response_body': jsonString,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<dynamic> getCachedResponse(String url) async {
    final db = await instance.database;
    final maps = await db.query(
      'api_cache',
      where: 'url = ?',
      whereArgs: [url],
    );

    if (maps.isNotEmpty) {
      final jsonString = maps.first['response_body'] as String;
      return jsonDecode(jsonString);
    }
    return null;
  }

  // --- SYNC QUEUE METHODS ---

  Future<void> addToSyncQueue(String url, String method, dynamic data, Map<String, dynamic> headers) async {
    final db = await instance.database;
    
    await db.insert(
      'sync_queue',
      {
        'url': url,
        'method': method,
        'request_body': data != null ? jsonEncode(data) : null,
        'headers': jsonEncode(headers),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      },
    );
  }

  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final db = await instance.database;
    return await db.query('sync_queue', orderBy: 'timestamp ASC');
  }

  Future<void> removeFromSyncQueue(int id) async {
    final db = await instance.database;
    await db.delete(
      'sync_queue',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> clearSyncQueue() async {
    final db = await instance.database;
    await db.delete('sync_queue');
  }

  Future<void> clearCache() async {
    final db = await instance.database;
    await db.delete('api_cache');
  }
}
