class Node {
    value: any;
    next: Node | null;

    constructor(value: any) {
        this.value = value;
        this.next = null;
    }
}

class LinkedList {
    head: Node | null;

    constructor() {
        this.head = null;
    }

    // Adiciona um nó no final da lista
    append(value: any): void {
        const newNode = new Node(value);
        if (this.head === null) {
            this.head = newNode;
            return;
        }

        let current = this.head;
        while (current.next !== null) {
            current = current.next;
        }
        current.next = newNode;
    }

    // Imprime a lista
    print(): void {
        let current = this.head;
        const values: any[] = [];
        while (current !== null) {
            values.push(current.value);
            current = current.next;
        }
        console.log(values.join(' -> '));
    }
}

export default LinkedList;
