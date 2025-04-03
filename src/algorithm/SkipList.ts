export class SkipListNode<T> {
    value: T;
    next: SkipListNode<T>[];

    constructor(value: T, level: number) {
        this.value = value;
        this.next = new Array(level).fill(null);
    }
}

export class SkipList<T> {
    private maxLevel: number;
    private head: SkipListNode<T>;
    private probability: number = 0.5;

    constructor(maxLevel: number = 4) {
        this.maxLevel = maxLevel;
        this.head = new SkipListNode<T>(null as unknown as T, maxLevel);
    }

    private randomLevel(): number {
        let level = 1;
        while (Math.random() < this.probability && level < this.maxLevel) {
            level++;
        }
        return level;
    }

    insert(value: T): void {
        if (this.search(value)) return;
        const update: SkipListNode<T>[] = new Array(this.maxLevel).fill(null);
        let current = this.head;

        for (let i = this.maxLevel - 1; i >= 0; i--) {
            while (current.next[i] && current.next[i].value < value) {
                current = current.next[i];
            }
            update[i] = current;
        }

        const level = this.randomLevel();
        const newNode = new SkipListNode<T>(value, level);

        for (let i = 0; i < level; i++) {
            newNode.next[i] = update[i]?.next[i] || null;
            if (update[i]) update[i].next[i] = newNode;
        }
    }

    search(value: T): boolean {
        let current = this.head;

        for (let i = this.maxLevel - 1; i >= 0; i--) {
            while (current.next[i] && current.next[i].value < value) {
                current = current.next[i];
            }
        }

        current = current.next[0];
        return current !== null && current.value === value;
    }

    linearSearch(value: T): boolean {
        let current = this.head.next[0]; // Começa do primeiro elemento real
        while (current) {
            if (current.value === value) {
                return true;
            }
            current = current.next[0]; // Vai para o próximo nó
        }
        return false;
    }

    delete(value: T): void {
        const update: SkipListNode<T>[] = new Array(this.maxLevel).fill(null);
        let current = this.head;

        for (let i = this.maxLevel - 1; i >= 0; i--) {
            while (current.next[i] && current.next[i].value < value) {
                current = current.next[i];
            }
            update[i] = current;
        }

        let target = current.next[0];

        if (target && target.value === value) {
            for (let i = 0; i < this.maxLevel; i++) {
                if (update[i]?.next[i] !== target) break;
                update[i].next[i] = target.next[i];
            }
        }
    }

    getValues(): T[] {
        let current = this.head.next[0];
        const values: T[] = [];

        while (current) {
            values.push(current.value);
            current = current.next[0];
        }

        return values;
    }

    clear(): void {
        this.head = new SkipListNode<T>(null as unknown as T, this.maxLevel);
    }

    getMaxLevel(): number {
        return this.maxLevel;
    }

    getLevels(value: T): number {
        let current = this.head;

        for (let i = this.maxLevel - 1; i >= 0; i--) {
            while (current.next[i] && current.next[i].value < value) {
                current = current.next[i];
            }
        }
        current = current.next[0]; // Desce para o nível base

        if (current !== null && current.value === value) {
            return current.next.length; // O nível do nó é o tamanho do array de ponteiros `next`
        }

        return 0; // Retorna 0 se o valor não for encontrado
    }
}
