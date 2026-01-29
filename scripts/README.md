# Ghost Import Script

Скрипт для импорта постов, тегов и медиа файлов из Ghost в Vivid напрямую из SQLite базы данных.

## Использование

1. Убедитесь, что Ghost база данных доступна (по умолчанию: `../../andy.book/content/data/ghost-local.db`).

2. Для импорта с нуля (очистить посты, теги и медиа, затем импорт):

```bash
GHOST_IMPORT_CLEAN=1 npm run import:ghost
```

3. Обычный импорт (без очистки):

```bash
npm run import:ghost
```

4. С кастомными путями:

```bash
GHOST_DB_PATH=/path/to/ghost-local.db GHOST_CONTENT_PATH=/path/to/ghost/content npm run import:ghost
```

## Что импортируется

- **Посты**: title, slug, content (Mobiledoc → Lexical или Lexical если уже есть), status, visibility, published_at
- **Теги**: name, slug (создаются или используются существующие)
- **Медиа**: feature_image и изображения из HTML контента загружаются в S3
- **Связи**: посты связываются с тегами через таблицу posts_tags

## Источник данных

Скрипт работает напрямую с SQLite базой данных Ghost (`ghost-local.db`), читая данные из таблиц:
- `posts` - все посты типа 'post'
- `tags` - все теги
- `posts_tags` - связи между постами и тегами

## Примечания

- Посты с уже существующими slug пропускаются
- Mobiledoc конвертируется в Lexical формат
- HTML контент также конвертируется в Lexical
- Медиа файлы должны находиться в `/content/images/` или `/content/media/` относительно GHOST_CONTENT_PATH
- Для загрузки медиа в S3 должны быть настроены переменные окружения (S3_ENDPOINT, S3_BUCKET, и т.д.)
- База данных открывается в режиме read-only для безопасности
