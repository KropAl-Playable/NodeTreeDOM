# TreeNode DOM Demo / Демонстрация дерева узлов

EN:
- Minimal vanilla JS demo with a custom `TreeNode` (no children array: `parent/prev/next/first/last/count/root`).
- Methods: `add`, `remove`, `each` (pre-order). Children stored as a doubly linked list, root auto-updated, self/ancestor attach is blocked.
- UI: collapsible tree, selection, drag-and-drop between parents, auto-naming (root children: A/B/C…, nested: `A.1`, `A.2`, …), pre-order strip rendered via `each`.
- Stack: ES modules, no deps.

RU:
- Минимальный пример на чистом JS с кастомным `TreeNode` (без массива детей: `parent/prev/next/first/last/count/root`).
- Методы: `add`, `remove`, `each` (pre-order). Дети — двусвязный список; корень обновляется автоматически; защита от добавления себя/предка.
- UI: сворачивание, выделение, drag’n’drop между родителями, авто-нейминг (дети корня — A/B/C…, вложенные — `A.1`, `A.2`, …), полоса обхода pre-order через `each`.
- Стек: ES modules, без зависимостей.

## Run / Запуск
```bash
# node 18+
node serve.js
# open in browser
# перейти: http://localhost:3000
```

## Files / Файлы
- `src/TreeNode.js` — структура дерева.
- `src/renderer.js` — рендер, UI, drag’n’drop, автоимена, pre-order полоса.
- `src/demo.js` — демо-дерево.
- `styles/tree.css` — стили.
- `index.html` — точка входа.
- `serve.js` — статический сервер без зависимостей.
