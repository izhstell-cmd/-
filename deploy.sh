#!/bin/bash

echo "🚀 Развертывание калькулятора металлоизделий"

# Проверяем, что мы в правильной директории
if [ ! -f "index.html" ]; then
    echo "❌ Ошибка: файл index.html не найден"
    exit 1
fi

echo "📦 Подготовка файлов..."

# Создаем директорию для деплоя если её нет
mkdir -p dist

# Копируем все необходимые файлы
cp index.html dist/
cp -r css dist/ 2>/dev/null || echo "⚠️  Папка css не найдена"
cp -r js dist/ 2>/dev/null || echo "⚠️  Папка js не найдена"
cp -r assets dist/ 2>/dev/null || echo "⚠️  Папка assets не найдена"

echo "✅ Файлы подготовлены в папке dist/"

# Проверяем доступность Python
if command -v python3 &> /dev/null; then
    echo "🌐 Запускаем локальный сервер на порту 8000..."
    echo "📱 Откройте браузер и перейдите по адресу: http://localhost:8000"
    echo "🛑 Для остановки сервера нажмите Ctrl+C"
    cd dist && python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "🌐 Запускаем локальный сервер на порту 8000..."
    echo "📱 Откройте браузер и перейдите по адресу: http://localhost:8000"
    echo "🛑 Для остановки сервера нажмите Ctrl+C"
    cd dist && python -m http.server 8000
else
    echo "⚠️  Python не найден. Установите Python или запустите сервер вручную:"
    echo "   cd dist && python -m http.server 8000"
fi