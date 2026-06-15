import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import '../constants.dart';
import '../services/sync_service.dart';
import '../database/database_helper.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  late final CookieJar cookieJar;
  bool _initialized = false;

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseHttpUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      contentType: 'application/json',
      validateStatus: (status) => status != null && status < 500,
    ));
    if (kIsWeb) {
      dio.options.extra['withCredentials'] = true;
    }
  }

  Future<void> init() async {
    if (_initialized) return;
    
    if (kIsWeb) {
      cookieJar = CookieJar();
    } else {
      // Get application documents directory to persist cookies
      final appDocDir = await getApplicationDocumentsDirectory();
      final String cookiePath = '${appDocDir.path}/.cookies/';
      cookieJar = PersistCookieJar(
        storage: FileStorage(cookiePath),
      );
      dio.interceptors.add(CookieManager(cookieJar));
    }
    // Add Offline/Cache Interceptor
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final isOffline = await SyncService().isOffline();

        if (isOffline) {
          if (options.method.toUpperCase() == 'GET') {
            final cachedData = await DatabaseHelper.instance.getCachedResponse(options.path);
            if (cachedData != null) {
              print('[Offline] Serving from cache: \${options.path}');
              return handler.resolve(Response(
                requestOptions: options,
                data: cachedData,
                statusCode: 200,
              ));
            } else {
              print('[Offline] No cache found for: \${options.path}');
              // Proceed to fail or return empty
              return handler.next(options);
            }
          } else {
            // POST / PUT / DELETE
            // Add to sync queue and return 200 mock success
            print('[Offline] Queuing request: \${options.path}');
            await DatabaseHelper.instance.addToSyncQueue(
              options.path,
              options.method,
              options.data,
              options.headers,
            );
            return handler.resolve(Response(
              requestOptions: options,
              data: {'message': 'Queued offline'},
              statusCode: 200,
            ));
          }
        }
        return handler.next(options);
      },
      onResponse: (response, handler) async {
        // Cache successful GET requests
        if (response.requestOptions.method.toUpperCase() == 'GET' && 
            response.statusCode != null && 
            response.statusCode! >= 200 && 
            response.statusCode! < 300) {
          await DatabaseHelper.instance.cacheResponse(
            response.requestOptions.path,
            response.requestOptions.method,
            response.data,
          );
        }
        return handler.next(response);
      },
    ));

    // Add logging interceptor for development debugging
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('[API] $obj'),
    ));

    _initialized = true;
  }

  Future<void> clearCookies() async {
    if (_initialized && !kIsWeb) {
      await cookieJar.deleteAll();
    }
  }
}
