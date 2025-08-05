#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Запуск веб-сервера для Калькулятора металлоизделий
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def main():
    # Настройки
    PORT = 8000
    HOST = 'localhost'
    
    # Проверяем, что мы в правильной директории
    if not Path('index.html').exists():
        print("❌ Ошибка: файл index.html не найден в текущей директории!")
        print("📂 Убедитесь, что вы запускаете скрипт из папки с проектом")
        sys.exit(1)
    
    print("🚀 Калькулятор металлоизделий")
    print("=" * 50)
    print(f"📂 Директория: {os.getcwd()}")
    print(f"🌐 Адрес сервера: http://{HOST}:{PORT}")
    print(f"📱 Для доступа с других устройств: http://{get_local_ip()}:{PORT}")
    print("🛑 Для остановки нажмите Ctrl+C")
    print("=" * 50)
    
    # Создаем обработчик запросов
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print(f"✅ Сервер запущен на порту {PORT}")
            
            # Пытаемся открыть браузер
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("🌐 Браузер должен открыться автоматически")
            except:
                print("⚠️  Не удалось открыть браузер автоматически")
                print(f"   Откройте браузер вручную: http://{HOST}:{PORT}")
            
            print("\n🔄 Сервер работает... Ожидание запросов...")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Сервер остановлен пользователем")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Порт {PORT} уже занят!")
            print("   Попробуйте закрыть другие серверы или используйте другой порт")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")

def get_local_ip():
    """Получаем локальный IP адрес"""
    import socket
    try:
        # Подключаемся к удаленному адресу для определения локального IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

if __name__ == "__main__":
    main()