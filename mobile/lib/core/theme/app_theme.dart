import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: AppColors.primary,
        onPrimary: AppColors.onPrimary,
        secondary: AppColors.accent,
        onSecondary: AppColors.onAccent,
        error: AppColors.error,
        onError: AppColors.onError,
        surface: AppColors.surface,
        onSurface: AppColors.onSurface,
      ),
      scaffoldBackgroundColor: AppColors.background,
      textTheme: GoogleFonts.nunitoSansTextTheme(
        const TextTheme(
          displayLarge: TextStyle(fontWeight: FontWeight.w800, fontSize: 32, color: AppColors.onSurface),
          displayMedium: TextStyle(fontWeight: FontWeight.w800, fontSize: 28, color: AppColors.onSurface),
          displaySmall: TextStyle(fontWeight: FontWeight.w700, fontSize: 24, color: AppColors.onSurface),
          headlineLarge: TextStyle(fontWeight: FontWeight.w700, fontSize: 22, color: AppColors.onSurface),
          headlineMedium: TextStyle(fontWeight: FontWeight.w600, fontSize: 20, color: AppColors.onSurface),
          titleLarge: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: AppColors.onSurface),
          titleMedium: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: AppColors.onSurface),
          bodyLarge: TextStyle(fontWeight: FontWeight.w400, fontSize: 16, color: AppColors.onSurface),
          bodyMedium: TextStyle(fontWeight: FontWeight.w400, fontSize: 14, color: AppColors.onSurfaceVariant),
          labelLarge: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.onSurface),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.onPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 20, color: AppColors.onPrimary),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surfaceContainer,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceContainer,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.error, width: 1.5),
        ),
        labelStyle: const TextStyle(color: AppColors.onSurfaceVariant),
      ),
    );
  }
}
