#!/bin/bash

echo "🌳 Обновление дерева проекта..."

# Создаём временный файл
TEMP_FILE="tree_temp.txt"

# Генерируем простое дерево
echo "# Дерево проекта DreamCalc" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "\`\`\`" >> "$TEMP_FILE"
tree -I '.git|node_modules|*.swp|*.swo' --dirsfirst >> "$TEMP_FILE" 2>/dev/null || find . -type d -not -path "./.git/*" -not -path "./.git" | sort | while read dir; do
    echo "$dir"
    find "$dir" -maxdepth 1 -type f -not -name ".*" | sort | while read file; do
        echo "  $(basename "$file")"
    done
done >> "$TEMP_FILE"
echo "\`\`\`" >> "$TEMP_FILE"

echo "" >> "$TEMP_FILE"
echo "## Статистика" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "**Обновлено:** $(date)" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
echo "**Файлы по типам:**" >> "$TEMP_FILE"
echo "- HTML: $(find . -name "*.html" -not -path "./.git/*" | wc -l)" >> "$TEMP_FILE"
echo "- JavaScript: $(find . -name "*.js" -not -path "./.git/*" | wc -l)" >> "$TEMP_FILE"
echo "- CSS: $(find . -name "*.css" -not -path "./.git/*" | wc -l)" >> "$TEMP_FILE"
echo "- Markdown: $(find . -name "*.md" -not -path "./.git/*" | wc -l)" >> "$TEMP_FILE"
echo "- Всего: $(find . -type f -not -path "./.git/*" | wc -l)" >> "$TEMP_FILE"

# Копируем в основной файл
cp "$TEMP_FILE" PROJECT_TREE.md
rm "$TEMP_FILE"

echo "✅ PROJECT_TREE.md обновлён"
