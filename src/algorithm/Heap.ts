class Heap {

    public tree: number[];

    constructor() {
        this.tree = [];

    }

    insert_value(num: number): void {
        this.tree.push(num);
        this.tree.sort((a, b) => a - b);
    }

    extract_value(num: number): number | void {
        if (this.tree.length === 0) {
            console.log("There is no number to remove.")
        }
        const index = this.tree.indexOf(num);
        if (index !== -1) {
            this.tree.splice(index, 1); console.log("The number removed was: ", num);
        } else {
            console.log(`The number ${num} is not found in the heap.`);
        }
    }

    get_heap(): number[] {
        return this.tree;
    }
}
