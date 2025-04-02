class Node<T> {
    value: T;
    next: Node<T> | null = null;

    constructor(value: T) {
        this.value = value;
    }
}

export class LinkedListLogic<T> {
    private head: Node<T> | null = null;

    // Verifica se um valor já existe na lista
    contains(value: T): boolean {
        let current = this.head;
        while (current) {
            if (current.value === value) return true;
            current = current.next;
        }
        return false;
    }

    // Insere um novo valor no final da lista
    insert(value: T): void {
        const newNode = new Node(value);
        if (this.contains(value)) return; // Não insere se já existe
        if (!this.head) {
            this.head = newNode;
            return;
        }
        let current = this.head;
        while (current.next) {
            current = current.next;
        }
        current.next = newNode;
    }

    // Busca desotimizada: percorre toda a lista
    searchUnoptimized(value: T): Node<T> | null {
        let current: Node<T> | null = this.head;
        while (current) {
            if (current.value === value) {
                return current; // Retorna o nó encontrado
            }
            current = current.next;
        }
        return null; // Retorna null se não encontrar
    }

    // Busca otimizada com Move-To-Front (MTF)
    searchMoveToFront(value: T): Node<T> | null {
        if (!this.head || this.head.value === value) {
            return this.head;
        }

        let prev: Node<T> | null = null;
        let current: Node<T> | null = this.head;

        while (current && current.value !== value) {
            prev = current;
            current = current.next;
        }

        if (current && prev) {
            prev.next = current.next; // Remove o nó da posição atual
            current.next = this.head; // Move para a frente
            this.head = current;
        }

        return current;
    }

    // Busca otimizada com Transposição
    searchTranspose(value: T): Node<T> | null {
        if (!this.head || this.head.value === value) {
            return this.head;
        }

        let prev: Node<T> | null = null;
        let current: Node<T> | null = this.head;
        let prevPrev: Node<T> | null = null;

        while (current && current.value !== value) {
            prevPrev = prev;
            prev = current;
            current = current.next;
        }

        if (current && prev) {
            // Faz a transposição trocando o nó com o anterior
            if (prevPrev) {
                prevPrev.next = current;
            } else {
                this.head = current;
            }
            prev.next = current.next;
            current.next = prev;
        }

        return current;
    }

    clear() {
        this.head = null;
    }

    getHead(): Node<T> | null {
        return this.head;
    }

    // Método para exibir a lista (para depuração)
    print(): void {
        let current = this.head;
        const values: T[] = [];
        while (current) {
            values.push(current.value);
            current = current.next;
        }
        console.log(values.join(' -> '));
    }
}
