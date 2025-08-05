# Инструкции по развертыванию

## 🚀 Быстрый старт

### Локальный запуск

```bash
# Вариант 1: Используя готовый скрипт
./deploy.sh

# Вариант 2: Вручную с Python
python -m http.server 8000
# или
python3 -m http.server 8000

# Откройте браузер: http://localhost:8000
```

## 🌐 Развертывание в интернете

### 1. GitHub Pages (БЕСПЛАТНО)

**Шаг 1:** Создайте репозиторий на GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

**Шаг 2:** Включите GitHub Pages
1. Перейдите в Settings репозитория
2. Найдите раздел "Pages"
3. Выберите Source: "Deploy from a branch"
4. Выберите Branch: "main"
5. Нажмите "Save"

**Результат:** Ваш сайт будет доступен по адресу:
`https://USERNAME.github.io/REPOSITORY`

### 2. Netlify (БЕСПЛАТНО)

**Способ 1: Drag & Drop**
1. Откройте [netlify.com](https://netlify.com)
2. Перетащите папку проекта в область "Deploy"
3. Сайт автоматически развернется

**Способ 2: Git интеграция**
1. Подключите GitHub репозиторий
2. Netlify автоматически развернет сайт при каждом коммите

**Результат:** Получите URL вида `https://amazing-name-123456.netlify.app`

### 3. Vercel (БЕСПЛАТНО)

```bash
# Установите Vercel CLI
npm install -g vercel

# Разверните проект
vercel

# Следуйте инструкциям в терминале
```

**Результат:** Получите URL вида `https://project-name.vercel.app`

### 4. Firebase Hosting (БЕСПЛАТНО)

```bash
# Установите Firebase CLI
npm install -g firebase-tools

# Войдите в аккаунт
firebase login

# Инициализируйте проект
firebase init hosting

# Разверните
firebase deploy
```

### 5. Surge.sh (БЕСПЛАТНО)

```bash
# Установите Surge
npm install -g surge

# Разверните
surge
```

## 📱 Мобильное приложение

### Превращение в PWA (Progressive Web App)

Добавьте в `index.html`:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#223142">
```

Создайте `manifest.json`:
```json
{
  "name": "Калькулятор металлоизделий",
  "short_name": "MetalCalc",
  "description": "Расчет стоимости металлоизделий",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f6f8fa",
  "theme_color": "#223142",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔧 Настройка домена

### Собственный домен

1. **Купите домен** (например, на reg.ru, godaddy.com)
2. **Настройте DNS:**
   - Для GitHub Pages: CNAME запись на `USERNAME.github.io`
   - Для Netlify: следуйте инструкциям в панели управления
   - Для Vercel: добавьте домен в настройках проекта

### Бесплатные поддомены

- **Netlify:** `yoursite.netlify.app`
- **Vercel:** `yoursite.vercel.app`
- **GitHub Pages:** `username.github.io/repository`

## 🛡️ Безопасность

Все конфигурации уже включают:
- Защиту от XSS атак
- Защиту от clickjacking
- Безопасные HTTP заголовки
- HTTPS по умолчанию

## 📊 Аналитика

Добавьте Google Analytics:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🚨 Решение проблем

### Сайт не загружается
- Проверьте, что файл `index.html` в корне проекта
- Убедитесь, что все пути к файлам корректны

### Ошибки JavaScript
- Откройте Developer Tools (F12)
- Проверьте Console на наличие ошибок
- Убедитесь, что библиотека xlsx загружается

### Проблемы с HTTPS
- Большинство платформ автоматически предоставляют HTTPS
- Для собственного домена может потребоваться время на активацию SSL

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте документацию платформы хостинга
2. Создайте issue в репозитории проекта
3. Обратитесь к сообществу разработчиков