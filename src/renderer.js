import { TreeNode } from "./TreeNode.js";

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

export function createCollapsibleTreeUI(root, container) {
  if (!root || !container) {
    return;
  }

  const collapsed = new WeakMap();
  let selected = root;
  let autoId = countNodes(root) + 1;

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
      render();
    });

    removeBtn.addEventListener("click", () => {
      if (selected === root) {
        status.textContent = "Корень удалить нельзя.";
        return;
      }
      const parent = selected.parent;
      if (parent) {
        parent.remove(selected);
        selected = parent;
        render();
      }
    });

    rebuildBtn.addEventListener("click", () => {
      render();
      status.textContent = "Дерево перестроено.";
    });

    wrapper.append(addBtn, removeBtn, rebuildBtn, status);

    return { wrapper, addBtn, removeBtn, rebuildBtn, status };
  }

  function render() {
    treeHost.innerHTML = "";
    treeHost.appendChild(buildNode(root, 0));
    updateControls();
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

    row.addEventListener("click", () => {
      selected = node;
      render();
    });

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

  function updateControls() {
    controls.removeBtn.disabled = selected === root;
    controls.status.textContent = `Активный узел: ${selected.label || "Без имени"}`;
  }
}

function countNodes(root) {
  let total = 0;
  root.each(() => total++);
  return total;
}
