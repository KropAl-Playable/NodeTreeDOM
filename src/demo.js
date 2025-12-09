import { TreeNode } from "./TreeNode.js";
import { createCollapsibleTreeUI } from "./renderer.js";

const root = new TreeNode("Root");
const nodeA = new TreeNode("A");
const nodeB = new TreeNode("B");
const nodeC = new TreeNode("C");
const nodeD = new TreeNode("D");

root.add(nodeA);
root.add(nodeB);
nodeA.add(nodeC);
nodeA.add(nodeD);

const container = document.getElementById("app");
createCollapsibleTreeUI(root, container);
