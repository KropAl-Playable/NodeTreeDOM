// A lightweight tree node that stores children via a doubly linked list.
export class TreeNode {
  constructor(label = "") {
    this.label = label;
    this.parent = null;
    this.prev = null;
    this.next = null;
    this.first = null;
    this.last = null;
    this.count = 0;
    this.root = this;
  }

  add(node) {
    if (!(node instanceof TreeNode)) {
      throw new TypeError("add() expects a TreeNode");
    }
    if (node === this) {
      throw new Error("A node cannot be added to itself.");
    }
    if (this.isDescendantOf(node)) {
      throw new Error("Cannot attach an ancestor as a child.");
    }

    if (node.parent) {
      node.parent.remove(node);
    }

    node.parent = this;
    node.prev = this.last;
    node.next = null;

    if (this.last) {
      this.last.next = node;
    }
    if (!this.first) {
      this.first = node;
    }

    this.last = node;
    this.count += 1;

    const newRoot = this.root || this;
    this.setRootForSubtree(node, newRoot);
  }

  remove(node) {
    if (!(node instanceof TreeNode)) {
      throw new TypeError("remove() expects a TreeNode");
    }
    if (node.parent !== this) {
      return;
    }

    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.first = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.last = node.prev;
    }

    node.parent = null;
    node.prev = null;
    node.next = null;

    this.count = Math.max(0, this.count - 1);
    this.setRootForSubtree(node, node);
  }

  each(cb) {
    if (typeof cb !== "function") {
      return;
    }

    const stack = [{ node: this, depth: 0 }];

    while (stack.length) {
      const { node, depth } = stack.pop();
      cb(node, depth);

      let child = node.last;
      while (child) {
        stack.push({ node: child, depth: depth + 1 });
        child = child.prev;
      }
    }
  }

  isDescendantOf(potentialAncestor) {
    let cursor = this.parent;
    while (cursor) {
      if (cursor === potentialAncestor) {
        return true;
      }
      cursor = cursor.parent;
    }
    return false;
  }

  setRootForSubtree(node, newRoot) {
    const rootRef = newRoot || node;
    const stack = [node];

    while (stack.length) {
      const current = stack.pop();
      current.root = rootRef;

      let child = current.first;
      while (child) {
        stack.push(child);
        child = child.next;
      }
    }
  }

  *children() {
    let cursor = this.first;
    while (cursor) {
      yield cursor;
      cursor = cursor.next;
    }
  }
}
