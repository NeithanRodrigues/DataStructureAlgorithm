// HashTableNode Class (remains the same)
class HashTableNode {
    key: string;
    value: string;

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}

// HashTable Class (remains the same - logic unchanged)
class HashTable {
    private buckets: Array<HashTableNode[]>;
    private size: number;

    constructor(size: number = 10) {
        this.size = size;
        this.buckets = Array(size)
            .fill(null)
            .map(() => []);
    }

    hash(key: string): {
        finalHash: number;
        steps: Array<{
            char: string;
            code: number;
            position: number;
            subtotal: number;
        }>;
    } {
        let hashValue = 0;
        const steps = [];

        for (let i = 0; i < key.length; i++) {
            const char = key[i];
            const charCode = key.charCodeAt(i);
            const position = i + 1; // 1-based position
            const contribution = charCode * position;
            hashValue += contribution;

            steps.push({
                char,
                code: charCode,
                position,
                subtotal: hashValue,
            });
        }

        const finalHash = hashValue % this.size;

        return {
            finalHash,
            steps,
        };
    }

    set(
        key: string,
        value: string
    ): { hashInfo: ReturnType<typeof this.hash>; isUpdate: boolean } {
        const hashInfo = this.hash(key);
        const index = hashInfo.finalHash;
        const bucket = this.buckets[index];
        let isUpdate = false;

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].key === key) {
                bucket[i].value = value;
                isUpdate = true;
                return { hashInfo, isUpdate };
            }
        }

        bucket.push(new HashTableNode(key, value));
        return { hashInfo, isUpdate };
    }

    get(key: string): {
        value: string | null;
        hashInfo: ReturnType<typeof this.hash>;
    } {
        const hashInfo = this.hash(key);
        const index = hashInfo.finalHash;
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].key === key) {
                return { value: bucket[i].value, hashInfo };
            }
        }

        return { value: null, hashInfo };
    }

    remove(key: string): {
        success: boolean;
        hashInfo: ReturnType<typeof this.hash>;
    } {
        const hashInfo = this.hash(key);
        const index = hashInfo.finalHash;
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i].key === key) {
                bucket.splice(i, 1);
                return { success: true, hashInfo };
            }
        }

        return { success: false, hashInfo };
    }

    getBuckets(): Array<HashTableNode[]> {
        return this.buckets;
    }

    clear(): void {
        this.buckets = Array(this.size)
            .fill(null)
            .map(() => []);
    }

    getSize(): number {
        return this.size;
    }

    resize(newSize: number): void {
        const oldBuckets = this.buckets;
        this.size = newSize;
        this.buckets = Array(newSize)
            .fill(null)
            .map(() => []);

        oldBuckets.forEach((bucket) => {
            bucket.forEach((node) => {
                const { finalHash } = this.hash(node.key);
                this.buckets[finalHash].push(
                    new HashTableNode(node.key, node.value)
                );
            });
        });
    }

    getLoadFactor(): number {
        let totalItems = 0;
        this.buckets.forEach((bucket) => {
            totalItems += bucket.length;
        });
        // Avoid division by zero if size is somehow 0
        return this.size > 0 ? totalItems / this.size : 0;
    }

    getCollisionCount(): number {
        return this.buckets.filter((bucket) => bucket.length > 1).length;
    }
}

export { HashTable, HashTableNode };
