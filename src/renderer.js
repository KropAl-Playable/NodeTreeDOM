import { TreeNode } from "./TreeNode.js";

// Simple static renderer (без UI)
export function renderTree(root, container) {
  if (!root || !container) {
    return;
  }

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const walk = (node, depth) => {
    const el = document.createElement("div");
    el.className = "tree-node static";
    el.style.setProperty("--depth", depth);
    if (depth === 0) {
      el.classList.add("is-root");
    }
    el.textContent = node.label || "Node";
    fragment.appendChild(el);

    for (const child of node.children()) {
      walk(child, depth + 1);
    }
  };

  walk(root, 0);
  container.appendChild(fragment);
}

// Интерактивный UI с выделением, коллапсом и drag'n'drop
export function createCollapsibleTreeUI(root, container) {
  if (!root || !container) {
    return;
  }

  const collapsed = new WeakMap();
  const nodeIds = new WeakMap();
  let idSequence = 1;

  let selected = root;
  let autoId = countNodes(root) + 1;
  let draggingNode = null;
  let statusMessage = "";
  let statusTimeout = null;

  container.innerHTML = "";
  const controls = buildControls();
  const treeHost = document.createElement("div");
  treeHost.className = "tree-view";

  container.appendChild(controls.wrapper);
  container.appendChild(treeHost);

  render();

  function buildControls() {
    const wrapper = document.createElement("div");
    wrapper.className = "tree-controls";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "action primary";
    addBtn.textContent = "＋ Добавить узел";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "action danger";
    removeBtn.textContent = "× Удалить выбранный";

    const rebuildBtn = document.createElement("button");
    rebuildBtn.type = "button";
    rebuildBtn.className = "action ghost";
    rebuildBtn.textContent = "↻ Перестроить дерево";

    const status = document.createElement("div");
    status.className = "tree-status";

    addBtn.addEventListener("click", () => {
      const newLabel = `Node ${autoId++}`;
      const newNode = new TreeNode(newLabel);
      selected.add(newNode);
      collapsed.set(selected, false);
      selected = newNode;
      setStatus(`Добавлен узел "${newLabel}" в "${selected.parent?.label ?? "Root"}".`);
      render();
    });

    removeBtn.addEventListener("click", () => {
      if (selected === root) {
        setStatus("Корень удалить нельзя.");
        return;
      }
      const parent = selected.parent;
      if (parent) {
        const name = selected.label;
        parent.remove(selected);
        selected = parent;
        setStatus(`Удалён узел "${name}".`);
        render();
      }
    });

    rebuildBtn.addEventListener("click", () => {
      render({ pulse: true });
      setStatus("Дерево перестроено.");
    });

    wrapper.append(addBtn, removeBtn, rebuildBtn, status);

    return { wrapper, addBtn, removeBtn, rebuildBtn, status };
  }

  function render(options = {}) {
    treeHost.innerHTML = "";
    treeHost.appendChild(buildNode(root, 0));
    updateControls();

    if (options.pulse) {
      treeHost.classList.remove("rebuilt");
      // restart animation
      void treeHost.offsetWidth;
      treeHost.classList.add("rebuilt");
    }
  }

  function buildNode(node, depth) {
    const holder = document.createElement("div");
    holder.className = "tree-item";

    const row = document.createElement("div");
    row.className = "tree-node";
    row.style.setProperty("--depth", depth);
    if (depth === 0) {
      row.classList.add("is-root");
    }

    if (selected === node) {
      row.classList.add("active");
    }

    if (node !== root) {
      row.draggable = true;
    }

    row.addEventListener("click", () => {
      selected = node;
      render();
    });

    attachDragEvents(row, node);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "node-toggle";

    const hasChildren = node.count > 0;
    toggle.textContent = hasChildren
      ? collapsed.get(node)
        ? "▸"
        : "▾"
      : "•";
    toggle.disabled = !hasChildren;

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!hasChildren) {
        return;
      }
      collapsed.set(node, !collapsed.get(node));
      render();
    });

    const label = document.createElement("span");
    label.className = "node-label";
    label.textContent = node.label || "Node";

    row.append(toggle, label);
    holder.appendChild(row);

    if (hasChildren) {
      const children = document.createElement("div");
      children.className = "tree-children";

      if (collapsed.get(node)) {
        children.classList.add("collapsed");
      }

      for (const child of node.children()) {
        children.appendChild(buildNode(child, depth + 1));
      }
      holder.appendChild(children);
    }

    return holder;
  }

  function attachDragEvents(row, node) {
    const id = ensureNodeId(node);
    row.dataset.nodeId = id;

    row.addEventListener("dragstart", (event) => {
      if (node === root) {
        event.preventDefault();
        return;
      }
      draggingNode = node;
      row.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
    });

    row.addEventListener("dragenter", (event) => {
      if (!draggingNode || draggingNode === node) {
        return;
      }
      if (node.isDescendantOf(draggingNode)) {
        row.classList.add("drop-blocked");
        return;
      }
      event.preventDefault();
      row.classList.add("drop-target");
    });

    row.addEventListener("dragover", (event) => {
      if (!draggingNode || draggingNode === node || node.isDescendantOf(draggingNode)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drop-target", "drop-blocked");
    });

    row.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!draggingNode) {
        return;
      }
      if (node === draggingNode || node.isDescendantOf(draggingNode)) {
        setStatus("Нельзя переместить узел внутрь самого себя.");
        clearDragState();
        return;
      }

      const from = draggingNode.parent;
      if (from) {
        from.remove(draggingNode);
      }
      node.add(draggingNode);
      collapsed.set(node, false);
      selected = draggingNode;
      setStatus(`Переместили "${draggingNode.label}" → "${node.label}".`);

      clearDragState();
      render();
    });

    row.addEventListener("dragend", () => {
      clearDragState();
    });
  }

  function ensureNodeId(node) {
    if (!nodeIds.has(node)) {
      nodeIds.set(node, `n-${idSequence++}`);
    }
    return nodeIds.get(node);
  }

  function clearDragState() {
    draggingNode = null;
    treeHost
      .querySelectorAll(".dragging, .drop-target, .drop-blocked")
      .forEach((el) => el.classList.remove("dragging", "drop-target", "drop-blocked"));
  }

  function updateControls() {
    controls.removeBtn.disabled = selected === root;
    if (!statusMessage) {
      controls.status.textContent = `Активный узел: ${selected.label || "Без имени"}`;
    }
  }

  function setStatus(text, temporary = true) {
    statusMessage = text;
    controls.status.textContent = text;
    if (temporary) {
      if (statusTimeout) {
        clearTimeout(statusTimeout);
      }
      statusTimeout = setTimeout(() => {
        statusMessage = "";
        updateControls();
      }, 1600);
    }
  }
}

function countNodes(root) {
  let total = 0;
  root.each(() => total++);
  return total;
}
