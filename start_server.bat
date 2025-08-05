@echo off
chcp 65001 >nul
title Калькулятор металлоизделий - Веб-сервер

echo.
echo 🚀 Калькулятор металлоизделий
echo ==================================================
echo.

REM Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python не найден!
    echo 📥 Установите Python с https://python.org
    echo.
    pause
    exit /b 1
)

REM Проверяем наличие index.html
if not exist "index.html" (
    echo ❌ Файл index.html не найден!
    echo 📂 Убедитесь, что вы запускаете скрипт из папки с проектом
    echo.
    pause
    exit /b 1
)

echo ✅ Python найден
echo ✅ Файл index.html найден
echo.
echo 🌐 Сервер будет доступен по адресу: http://localhost:8000
echo 🛑 Для остановки нажмите Ctrl+C
echo.
echo 🔄 Запускаем сервер...
echo.

REM Пытаемся открыть браузер
start http://localhost:8000

REM Запускаем сервер
python -m http.server 8000

echo.
echo 🛑 Сервер остановлен
pause