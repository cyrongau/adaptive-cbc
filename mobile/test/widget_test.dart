import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:adaptive_cbc_mobile/features/auth/providers/auth_provider.dart';
import 'package:adaptive_cbc_mobile/features/chat/providers/chat_provider.dart';
import 'package:adaptive_cbc_mobile/app.dart';

void main() {
  testWidgets('Smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider()),
          ChangeNotifierProvider<ChatProvider>(create: (_) => ChatProvider()),
        ],
        child: const AdaptiveCBCApp(),
      ),
    );
  });
}
