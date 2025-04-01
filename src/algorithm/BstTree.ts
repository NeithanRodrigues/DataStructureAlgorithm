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

    insert(value: number): void {
        this.root = this._insertRecursive(this.root, value);
    }

    private _insertRecursive(node: TreeNode | null, value: number): TreeNode {
        if (node === null) return new TreeNode(value);

        if (value < node.value) {
            node.left = this._insertRecursive(node.left, value);
        } else {
            node.right = this._insertRecursive(node.right, value);
        }

        return node;
    }

    getRoot(): TreeNode | null {
        return this.root;
    }
}