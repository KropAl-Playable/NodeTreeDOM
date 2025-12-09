import { TreeNode } from "./TreeNode.js";

// Simple static renderer (no UI controls)
export function renderTree(root, container) {
  if (!root || !container) return;

  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const walk = (node, depth) => {
    const el = document.createElement("div");
    el.className = "tree-node static";
    el.style.setProperty("--depth", depth);
    if (depth === 0) el.classList.add("is-root");
    el.textContent = node.label || "Node";
    fragment.appendChild(el);

    for (const child of node.children()) {
      walk(child, depth + 1);
    }
  };

  walk(root, 0);
  container.appendChild(fragment);
}

// Interactive UI: selection, collapse, drag'n'drop, auto-naming, and pre-order display
export function createCollapsibleTreeUI(root, container) {
  if (!root || !container) return;

  const collapsed = new WeakMap();
  const nodeIds = new WeakMap();
  let idSequence = 1;

  let selected = root;
  let draggingNode = null;
  let statusMessage = "";
  let statusTimeout = null;

  container.innerHTML = "";
  const controls = buildControls();
  const treeHost = document.createElement("div");
  treeHost.className = "tree-view";
  const orderPanel = buildOrderPanel();

  container.append(controls.wrapper, treeHost, orderPanel.wrapper);
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

    const status = document.createElement("div");
    status.className = "tree-status";

    addBtn.addEventListener("click", () => {
      const newLabel = nextAutoName(selected);
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

    wrapper.append(addBtn, removeBtn, status);
    return { wrapper, addBtn, removeBtn, status };
  }

  function buildOrderPanel() {
    const wrapper = document.createElement("section");
    wrapper.className = "order-panel";
    const title = document.createElement("div");
    title.className = "order-title";
    title.textContent = "Обход дерева (pre-order, via each)";
    const list = document.createElement("div");
    list.className = "order-list";
    wrapper.append(title, list);
    return { wrapper, list };
  }

  function render() {
    treeHost.innerHTML = "";
    treeHost.appendChild(buildNode(root, 0));
    updateControls();
    updateOrderPanel();
  }

  function buildNode(node, depth) {
    const holder = document.createElement("div");
    holder.className = "tree-item";

    const row = document.createElement("div");
    row.className = "tree-node";
    row.style.setProperty("--depth", depth);
    if (depth === 0) row.classList.add("is-root");

    if (selected === node) row.classList.add("active");
    if (node !== root) row.draggable = true;

    row.addEventListener("click", () => {
      selected = node;
      render();
    });

    attachDragEvents(row, node);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "node-toggle";

    const hasChildren = node.count > 0;
    toggle.textContent = hasChildren ? (collapsed.get(node) ? "▸" : "▾") : "•";
    toggle.disabled = !hasChildren;

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!hasChildren) return;
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
      if (collapsed.get(node)) children.classList.add("collapsed");
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
      if (!draggingNode || draggingNode === node) return;
      if (node.isDescendantOf(draggingNode)) {
        row.classList.add("drop-blocked");
        return;
      }
      event.preventDefault();
      row.classList.add("drop-target");
    });

    row.addEventListener("dragover", (event) => {
      if (!draggingNode || draggingNode === node || node.isDescendantOf(draggingNode)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drop-target", "drop-blocked");
    });

    row.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!draggingNode) return;
      if (node === draggingNode || node.isDescendantOf(draggingNode)) {
        setStatus("Нельзя переместить узел внутрь самого себя.");
        clearDragState();
        return;
      }

      const from = draggingNode.parent;
      if (from) from.remove(draggingNode);
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

  function updateOrderPanel() {
    const list = orderPanel.list;
    list.innerHTML = "";
    let first = true;
    root.each((node, depth) => {
      const id = ensureNodeId(node);
      if (!first) {
        const sep = document.createElement("span");
        sep.className = "order-sep";
        sep.textContent = "→";
        list.appendChild(sep);
      }
      first = false;

      const pill = document.createElement("span");
      pill.className = "order-item";
      if (node === selected) pill.classList.add("selected");
      pill.dataset.nodeId = id;
      pill.textContent = node.label || "Node";
      pill.title = `depth: ${depth}`;

      pill.addEventListener("mouseenter", () => highlightNodeById(id, true));
      pill.addEventListener("mouseleave", () => highlightNodeById(id, false));
      pill.addEventListener("click", () => {
        selected = node;
        collapsed.set(node, collapsed.get(node) || false);
        render();
      });

      list.appendChild(pill);
    });
  }

  function highlightNodeById(id, on) {
    const target = treeHost.querySelector(`[data-node-id="${id}"]`);
    if (target) {
      target.classList.toggle("order-highlight", on);
    }
  }

  function setStatus(text, temporary = true) {
    statusMessage = text;
    controls.status.textContent = text;
    if (temporary) {
      if (statusTimeout) clearTimeout(statusTimeout);
      statusTimeout = setTimeout(() => {
        statusMessage = "";
        updateControls();
      }, 1600);
    }
  }

  function nextAutoName(parent) {
    const index = (parent.count || 0) + 1;
    if (!parent.parent) return toLetters(index);
    return `${parent.label}.${index}`;
  }

  function toLetters(num) {
    let n = num;
    let result = "";
    while (n > 0) {
      n -= 1;
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    return result;
  }
}
