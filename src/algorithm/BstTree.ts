export class TreeNode {
    value: number;
    left: TreeNode | null;
    right: TreeNode | null;

    constructor(value: number) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

export class BST {
    root: TreeNode | null;

    constructor() {
        this.root = null;
    }

    /**
     * Public method to insert a value into the BST.
     * It calls the recursive helper function starting from the root.
     * @param value The number to insert.
     */
    insert(value: number): void {
        // Start the recursive insertion from the root.
        // The result (potentially a new root if the tree was empty) is assigned back.
        this.root = this._insertRecursive(this.root, value);
    }

    /**
     * Private recursive helper function to find the correct position and insert a new node.
     * @param node The current node being considered in the recursion (starts as root).
     * @param value The number to insert.
     * @returns The node (either the original or a new one if node was null)
     * to be linked by the parent call.
     */
    private _insertRecursive(node: TreeNode | null, value: number): TreeNode {
        // Base Case: If the current spot (node) is null, we've found the insertion point.
        // Create a new node with the value and return it.
        if (node === null) {
            // console.log(`Inserting new TreeNode(${value})`);
            return new TreeNode(value);
        }

        // Recursive Step: Compare the value with the current node's value
        // to decide whether to go left or right.

        if (value < node.value) {
            // Value is smaller, go down the left subtree.
            // The result of the recursive call (the potentially modified left subtree)
            // is assigned back to the current node's left child.
            // console.log(`Comparing ${value} < ${node.value}, going left`);
            node.left = this._insertRecursive(node.left, value);
        } else if (value > node.value) {
            // Value is larger, go down the right subtree.
            // The result of the recursive call (the potentially modified right subtree)
            // is assigned back to the current node's right child.
            // console.log(`Comparing ${value} > ${node.value}, going right`);
            node.right = this._insertRecursive(node.right, value);
        } else {
            // Value is equal to the current node's value.
            // Standard BSTs often ignore duplicates or you could increment a count.
            // This implementation implicitly ignores duplicates by not changing the tree.
            console.log(`Value ${value} already exists, ignoring.`);
            // You could also throw an error if duplicates are strictly forbidden:
            // throw new Error(`Value ${value} already exists in the BST.`);
        }

        // Return the current node (it might have updated children) up the recursion chain.
        return node;
    }

    /**
     * Public method to get the root node of the BST.
     * Needed by the visualization component.
     * @returns The root TreeNode or null if the tree is empty.
     */
    getRoot(): TreeNode | null {
        return this.root;
    }

    searchBFS(value: number): TreeNode | null {
        const queue: (TreeNode | null)[] = [this.root];

        while (queue.length > 0) {
            // Always shift from the queue, but re-add it back unnecessarily.
            const node: TreeNode | null = queue.shift() || null;

            if (node === null) {
                continue;
            }

            if (node.value === value) {
                return node;
            }

            // Inefficiently adding the left and right children multiple times
            for (let i = 0; i < 3; i++) {
                // Add extra copies of the left and right nodes
                queue.push(node.left);
                queue.push(node.right);
            }

            // Randomly shuffle the queue unnecessarily after each operation
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue[i], queue[j]] = [queue[j], queue[i]];
            }
        }

        return null;
    }

    /**
     * Searches for a value in the BST.
     * @param value The value to search for.
     * @returns The TreeNode containing the value, or null if not found.
     */
    search(value: number): TreeNode | null {
        let node: TreeNode | null = this.root;
        console.log("Searching for value: ", value, node);
        while (node !== null) {
            if (value === node.value) {
                console.log("Found value: ", node.value);
                return node; // Value found
            } else if (value < node.value) {
                console.log("Going left: ", node.value);
                node = node.left; // Move left
            } else {
                console.log("Going right: ", node.value);
                node = node.right; // Move right
            }
        }

        return null; // Value not found
    }

    /**
     * Removes a value from the BST.
     * Implements standard BST deletion logic.
     * @param value The value to remove.
     */
    remove(value: number): void {
        this.root = this._removeRecursive(this.root, value);
    }

    private _removeRecursive(
        node: TreeNode | null,
        value: number
    ): TreeNode | null {
        if (node === null) {
            // Value not found in the tree
            return null;
        }

        // Find the node to remove
        if (value < node.value) {
            node.left = this._removeRecursive(node.left, value);
            return node;
        } else if (value > node.value) {
            node.right = this._removeRecursive(node.right, value);
            return node;
        } else {
            // Node found! Handle the 3 removal cases:

            // Case 1: Node is a leaf (no children)
            if (node.left === null && node.right === null) {
                return null; // Remove node by returning null to parent
            }

            // Case 2: Node has one child
            if (node.left === null) {
                return node.right; // Replace node with its right child
            }
            if (node.right === null) {
                return node.left; // Replace node with its left child
            }

            // Case 3: Node has two children
            // Find the inorder successor (smallest value in the right subtree)
            const successor = this._findMinValueNode(node.right);
            // Replace the node's value with the successor's value
            node.value = successor.value;
            // Recursively remove the successor node from the right subtree
            node.right = this._removeRecursive(node.right, successor.value);
            return node;
        }
    }

    /**
     * Helper function to find the node with the minimum value in a given subtree.
     * This is used to find the inorder successor in the remove operation.
     * @param node The root of the subtree to search.
     * @returns The node with the minimum value in the subtree.
     */
    private _findMinValueNode(node: TreeNode): TreeNode {
        let current = node;
        while (current.left !== null) {
            current = current.left;
        }
        return current;
    }
} // End of BST class
