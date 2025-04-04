// src/algorithm/HashTable.ts

// --- Enums for Strategies ---
export enum HashingStrategy {
    Simple = "SIMPLE", // Current method
    Universal = "UNIVERSAL",
    // Perfect hashing is complex, especially dynamic. We'll add a note about it.
}

export enum CollisionResolution {
    Chaining = "CHAINING", // Current method
    LinearProbing = "LINEAR_PROBING",
    DoubleHashing = "DOUBLE_HASHING",
}

// --- Node Definition ---
// Keep HashTableNode simple for Chaining
class HashTableNode {
    key: string;
    value: string;
    // Add state for probing strategies (e.g., occupied, deleted)
    // Alternatively, use null/special markers in the bucket array itself
    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}

// Special marker for deleted slots in probing
const DELETED_MARKER = { key: "__DELETED__", value: "__DELETED__" };

// --- Main HashTable Class ---
export class HashTable {
    private buckets: Array<
        HashTableNode[] | (HashTableNode | null | typeof DELETED_MARKER)
    >; // Type depends on strategy
    private size: number;
    private hashingStrategy: HashingStrategy;
    private collisionResolution: CollisionResolution;
    private itemCount: number = 0; // Track items for load factor in probing

    // Universal Hashing parameters
    private universal_p: number = 0; // Large prime
    private universal_a: number = 0; // Random 1 <= a < p
    private universal_b: number = 0; // Random 0 <= b < p

    // Double Hashing prime (R)
    private double_hashing_R: number = 0; // Prime smaller than size

    constructor(
        size: number = 10,
        hashing: HashingStrategy = HashingStrategy.Simple,
        collision: CollisionResolution = CollisionResolution.Chaining
    ) {
        this.size = Math.max(1, size); // Ensure size is at least 1
        this.hashingStrategy = hashing;
        this.collisionResolution = collision;
        this.initializeBuckets();
        this.itemCount = 0;

        if (this.hashingStrategy === HashingStrategy.Universal) {
            this.generateUniversalParams();
        }
        if (this.collisionResolution === CollisionResolution.DoubleHashing) {
            this.setDoubleHashingR();
        }
    }

    // --- Bucket Initialization based on Strategy ---
    private initializeBuckets(): void {
        if (this.collisionResolution === CollisionResolution.Chaining) {
            this.buckets = Array(this.size)
                .fill(null)
                .map(() => []);
        } else {
            // Linear Probing or Double Hashing
            this.buckets = Array(this.size).fill(null);
        }
        this.itemCount = 0;
        console.log(
            `Initialized buckets for ${this.collisionResolution}, size ${this.size}`
        );
    }

    // --- Parameter Generation ---
    private isPrime(num: number): boolean {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i = i + 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    private findNextPrime(num: number): number {
        if (num <= 1) return 2;
        let prime = num;
        let found = false;
        while (!found) {
            prime++;
            if (this.isPrime(prime)) {
                found = true;
            }
        }
        return prime;
    }

    private findPrevPrime(num: number): number {
        if (num <= 2) return 1; // Needs careful handling if size is tiny
        let prime = num;
        let found = false;
        while (!found && prime > 1) {
            prime--;
            if (this.isPrime(prime)) {
                found = true;
            }
        }
        return prime > 1 ? prime : 1; // Return 1 if no smaller prime found
    }

    private generateUniversalParams(): void {
        // Find a prime p larger than typical hash values (e.g., > size * 255 * key_length)
        // For simplicity, let's pick a reasonably large prime.
        this.universal_p = this.findNextPrime(this.size * 100); // Adjust multiplier as needed
        this.universal_a =
            Math.floor(Math.random() * (this.universal_p - 1)) + 1; // 1 <= a < p
        this.universal_b = Math.floor(Math.random() * this.universal_p); // 0 <= b < p
        console.log(
            `Universal Params: p=${this.universal_p}, a=${this.universal_a}, b=${this.universal_b}`
        );
    }

    private setDoubleHashingR(): void {
        this.double_hashing_R = this.findPrevPrime(this.size);
        if (this.double_hashing_R === 0) {
            // Fallback if size is too small (e.g., 1 or 2)
            this.double_hashing_R = 1;
        }
        console.log(`Double Hashing R set to: ${this.double_hashing_R}`);
    }

    // --- Key to Integer Conversion ---
    private keyToInteger(key: string): number {
        let hashValue = 0;
        for (let i = 0; i < key.length; i++) {
            // Simple sum of char codes (can be improved)
            hashValue = (hashValue * 31 + key.charCodeAt(i)) % this.universal_p; // Use universal_p to keep within range
        }
        return Math.abs(hashValue); // Ensure positive
    }

    // --- Hashing Functions ---
    hash(key: string): {
        finalHash: number;
        steps?: Array<{
            char: string;
            code: number;
            position: number;
            subtotal: number;
        }>; // Optional steps for simple hash
        probes?: number; // Number of probes for probing strategies
        probeSequence?: number[]; // Sequence of probed indices
    } {
        const hashDetails: {
            finalHash: number;
            steps?: any[];
            probes?: number;
            probeSequence?: number[];
        } = { finalHash: -1 }; // Initialize finalHash

        let index: number;

        if (this.hashingStrategy === HashingStrategy.Simple) {
            let hashValue = 0;
            const steps = [];
            for (let i = 0; i < key.length; i++) {
                const char = key[i];
                const charCode = key.charCodeAt(i);
                const position = i + 1;
                const contribution = charCode * position; // Simple weighted sum
                hashValue += contribution;
                steps.push({
                    char,
                    code: charCode,
                    position,
                    subtotal: hashValue,
                });
            }
            index = Math.abs(hashValue) % this.size;
            hashDetails.steps = steps;
            hashDetails.finalHash = index; // Assign finalHash here
        } else if (this.hashingStrategy === HashingStrategy.Universal) {
            const k = this.keyToInteger(key);
            if (this.universal_p === 0) this.generateUniversalParams(); // Regenerate if needed
            // Formula: ((a*k + b) mod p) mod m
            index =
                ((this.universal_a * k + this.universal_b) % this.universal_p) %
                this.size;
            index = Math.abs(index); // Ensure positive index
            hashDetails.finalHash = index; // Assign finalHash here
            // Steps for universal hashing are less intuitive to show simply
        } else {
            // Default or unknown strategy, fallback to simple
            console.warn("Unknown hashing strategy, defaulting to Simple.");
            const simpleHashResult = this.hashSimpleInternal(key);
            index = simpleHashResult.finalHash;
            hashDetails.steps = simpleHashResult.steps;
            hashDetails.finalHash = index; // Assign finalHash here
        }

        // Note: The 'finalHash' here is the *initial* index before probing.
        // The actual final location might differ with probing.
        // We'll add probe info in the set/get/remove methods.
        if (hashDetails.finalHash === -1) {
            console.error("Failed to calculate hash index for key:", key);
            // Provide a fallback or throw error, e.g., default to 0
            hashDetails.finalHash = 0;
        }

        return hashDetails;
    }

    // Helper for default case in hash method
    private hashSimpleInternal(key: string): {
        finalHash: number;
        steps: any[];
    } {
        let hashValue = 0;
        const steps = [];
        for (let i = 0; i < key.length; i++) {
            const char = key[i];
            const charCode = key.charCodeAt(i);
            const position = i + 1;
            const contribution = charCode * position;
            hashValue += contribution;
            steps.push({ char, code: charCode, position, subtotal: hashValue });
        }
        const finalHash = Math.abs(hashValue) % this.size;
        return { finalHash, steps };
    }

    // --- Second Hash Function for Double Hashing ---
    private hash2(key: string): number {
        if (this.double_hashing_R === 0) {
            console.warn("Double Hashing R is 0, using fallback step 1");
            return 1; // Cannot be 0
        }
        // Common second hash: R - (key % R) where R is prime < size
        const k = this.keyToInteger(key);
        const step = this.double_hashing_R - (k % this.double_hashing_R);
        // Ensure step is at least 1, even if R is 1
        return Math.max(1, step);
    }

    // --- Core Operations (Set, Get, Remove) ---

    set(
        key: string,
        value: string
    ): {
        hashInfo: ReturnType<typeof this.hash>;
        isUpdate: boolean;
        finalIndex: number; // Actual index where inserted/updated
        probes?: number;
        probeSequence?: number[];
    } {
        const hashInfo = this.hash(key);
        let initialIndex = hashInfo.finalHash;
        let isUpdate = false;
        let finalIndex = -1;
        let probes = 0;
        const probeSequence: number[] = [];

        switch (this.collisionResolution) {
            case CollisionResolution.Chaining: {
                const bucket = this.buckets[initialIndex] as HashTableNode[];
                finalIndex = initialIndex; // For chaining, index is fixed
                probeSequence.push(initialIndex);
                for (let i = 0; i < bucket.length; i++) {
                    if (bucket[i].key === key) {
                        bucket[i].value = value; // Update existing
                        isUpdate = true;
                        return {
                            hashInfo,
                            isUpdate,
                            finalIndex,
                            probes,
                            probeSequence,
                        };
                    }
                }
                // Insert new node
                bucket.push(new HashTableNode(key, value));
                this.itemCount++;
                return {
                    hashInfo,
                    isUpdate,
                    finalIndex,
                    probes,
                    probeSequence,
                }; // probes = 0 for chaining
            }

            case CollisionResolution.LinearProbing:
            case CollisionResolution.DoubleHashing: {
                if (this.getLoadFactor() >= 0.7) {
                    // Resize threshold for probing
                    console.warn(
                        `Load factor ${this.getLoadFactor().toFixed(
                            2
                        )} >= 0.7, consider resizing.`
                    );
                    // Optionally trigger resize here, but let's keep it manual for the example
                }

                let step = 1; // Default for Linear Probing
                if (
                    this.collisionResolution ===
                    CollisionResolution.DoubleHashing
                ) {
                    step = this.hash2(key);
                }

                let currentIndex = initialIndex;
                for (let i = 0; i < this.size; i++) {
                    probes++;
                    probeSequence.push(currentIndex);
                    const bucket = this.buckets as Array<
                        HashTableNode | null | typeof DELETED_MARKER
                    >;
                    const currentNode = bucket[currentIndex];

                    if (
                        currentNode === null ||
                        currentNode === DELETED_MARKER
                    ) {
                        // Found empty or deleted slot, insert here
                        bucket[currentIndex] = new HashTableNode(key, value);
                        this.itemCount++;
                        finalIndex = currentIndex;
                        return {
                            hashInfo,
                            isUpdate,
                            finalIndex,
                            probes,
                            probeSequence,
                        };
                    }

                    if (currentNode.key === key) {
                        // Found the key, update value
                        bucket[currentIndex] = new HashTableNode(key, value); // Replace node
                        isUpdate = true;
                        finalIndex = currentIndex;
                        // Item count doesn't change on update
                        return {
                            hashInfo,
                            isUpdate,
                            finalIndex,
                            probes,
                            probeSequence,
                        };
                    }

                    // Collision, calculate next index
                    currentIndex = (initialIndex + i * step) % this.size;
                    currentIndex = Math.abs(currentIndex); // Ensure positive
                }

                // Table is full
                console.error("Hash table is full. Cannot insert key:", key);
                throw new Error("Hash table overflow");
            }

            default:
                throw new Error("Unknown collision resolution strategy");
        }
    }

    get(key: string): {
        value: string | null;
        hashInfo: ReturnType<typeof this.hash>;
        finalIndex: number | null; // Actual index where found, null if not found
        probes?: number;
        probeSequence?: number[];
    } {
        const hashInfo = this.hash(key);
        const initialIndex = hashInfo.finalHash;
        let probes = 0;
        const probeSequence: number[] = [];

        switch (this.collisionResolution) {
            case CollisionResolution.Chaining: {
                const bucket = this.buckets[initialIndex] as HashTableNode[];
                probeSequence.push(initialIndex); // Only probe is the initial index
                for (let i = 0; i < bucket.length; i++) {
                    probes++; // Count comparisons within the chain as 'probes'
                    if (bucket[i].key === key) {
                        return {
                            value: bucket[i].value,
                            hashInfo,
                            finalIndex: initialIndex,
                            probes,
                            probeSequence,
                        };
                    }
                }
                return {
                    value: null,
                    hashInfo,
                    finalIndex: null,
                    probes,
                    probeSequence,
                }; // Not found
            }

            case CollisionResolution.LinearProbing:
            case CollisionResolution.DoubleHashing: {
                let step = 1;
                if (
                    this.collisionResolution ===
                    CollisionResolution.DoubleHashing
                ) {
                    step = this.hash2(key);
                }

                let currentIndex = initialIndex;
                for (let i = 0; i < this.size; i++) {
                    probes++;
                    probeSequence.push(currentIndex);
                    const bucket = this.buckets as Array<
                        HashTableNode | null | typeof DELETED_MARKER
                    >;
                    const currentNode = bucket[currentIndex];

                    if (currentNode === null) {
                        // Found empty slot, key cannot be further
                        return {
                            value: null,
                            hashInfo,
                            finalIndex: null,
                            probes,
                            probeSequence,
                        };
                    }

                    if (
                        currentNode !== DELETED_MARKER &&
                        currentNode.key === key
                    ) {
                        // Found the key
                        return {
                            value: currentNode.value,
                            hashInfo,
                            finalIndex: currentIndex,
                            probes,
                            probeSequence,
                        };
                    }

                    // Continue probing (skip DELETED_MARKER)
                    currentIndex = (initialIndex + i * step) % this.size;
                    currentIndex = Math.abs(currentIndex); // Ensure positive
                }

                // Cycled through table or hit only deleted markers after starting point
                return {
                    value: null,
                    hashInfo,
                    finalIndex: null,
                    probes,
                    probeSequence,
                };
            }

            default:
                throw new Error("Unknown collision resolution strategy");
        }
    }

    remove(key: string): {
        success: boolean;
        hashInfo: ReturnType<typeof this.hash>;
        finalIndex: number | null; // Index where removed from, null if not found
        probes?: number;
        probeSequence?: number[];
    } {
        const hashInfo = this.hash(key);
        const initialIndex = hashInfo.finalHash;
        let success = false;
        let finalIndex: number | null = null;
        let probes = 0;
        const probeSequence: number[] = [];

        switch (this.collisionResolution) {
            case CollisionResolution.Chaining: {
                const bucket = this.buckets[initialIndex] as HashTableNode[];
                probeSequence.push(initialIndex);
                for (let i = 0; i < bucket.length; i++) {
                    probes++; // Count comparisons
                    if (bucket[i].key === key) {
                        bucket.splice(i, 1); // Remove from chain
                        success = true;
                        this.itemCount--;
                        finalIndex = initialIndex;
                        break;
                    }
                }
                return { success, hashInfo, finalIndex, probes, probeSequence };
            }

            case CollisionResolution.LinearProbing:
            case CollisionResolution.DoubleHashing: {
                let step = 1;
                if (
                    this.collisionResolution ===
                    CollisionResolution.DoubleHashing
                ) {
                    step = this.hash2(key);
                }

                let currentIndex = initialIndex;
                for (let i = 0; i < this.size; i++) {
                    probes++;
                    probeSequence.push(currentIndex);
                    const bucket = this.buckets as Array<
                        HashTableNode | null | typeof DELETED_MARKER
                    >;
                    const currentNode = bucket[currentIndex];

                    if (currentNode === null) {
                        // Found empty slot, key not present
                        success = false;
                        break;
                    }

                    if (
                        currentNode !== DELETED_MARKER &&
                        currentNode.key === key
                    ) {
                        // Found the key, mark as deleted
                        bucket[currentIndex] = DELETED_MARKER;
                        success = true;
                        this.itemCount--;
                        finalIndex = currentIndex;
                        break; // Exit loop once found and removed
                    }

                    // Continue probing
                    currentIndex = (initialIndex + i * step) % this.size;
                    currentIndex = Math.abs(currentIndex); // Ensure positive
                }
                return { success, hashInfo, finalIndex, probes, probeSequence };
            }

            default:
                throw new Error("Unknown collision resolution strategy");
        }
    }

    // --- Utility Methods ---

    getBuckets(): Array<
        HashTableNode[] | (HashTableNode | null | typeof DELETED_MARKER)
    > {
        return this.buckets;
    }

    clear(): void {
        this.initializeBuckets(); // Re-initialize based on current strategy
    }

    getSize(): number {
        return this.size;
    }

    // Needs careful implementation based on strategy
    resize(newSizeInput: number): void {
        const newSize = Math.max(1, newSizeInput); // Ensure new size is at least 1
        console.log(`Resizing from ${this.size} to ${newSize}...`);
        const oldBuckets = this.buckets;
        const oldSize = this.size;
        const oldCollisionResolution = this.collisionResolution; // Store old strategy temporarily

        // Store all valid old items
        const oldItems: HashTableNode[] = [];
        if (oldCollisionResolution === CollisionResolution.Chaining) {
            (oldBuckets as HashTableNode[][]).forEach((bucket) => {
                bucket.forEach((node) => oldItems.push(node));
            });
        } else {
            (
                oldBuckets as Array<
                    HashTableNode | null | typeof DELETED_MARKER
                >
            ).forEach((node) => {
                if (node && node !== DELETED_MARKER) {
                    oldItems.push(node);
                }
            });
        }

        // Update size and re-initialize buckets for the *current* strategy
        this.size = newSize;
        // Re-calculate parameters dependent on size
        if (this.hashingStrategy === HashingStrategy.Universal)
            this.generateUniversalParams();
        if (this.collisionResolution === CollisionResolution.DoubleHashing)
            this.setDoubleHashingR();
        this.initializeBuckets(); // Creates new empty buckets with the new size

        // Re-insert old items into the new table structure
        console.log(`Rehashing ${oldItems.length} items...`);
        oldItems.forEach((node) => {
            // Use the current set method which respects the current strategy
            this.set(node.key, node.value);
        });

        console.log(
            `Resize complete. New size: ${this.size}, Item count: ${this.itemCount}`
        );
    }

    getLoadFactor(): number {
        // For chaining, it's average chain length. For probing, it's % full.
        return this.size > 0 ? this.itemCount / this.size : 0;
    }

    getCollisionCount(): number {
        // Meaningful for Chaining: counts buckets with >1 item.
        // Less direct for probing, maybe count slots not in their 'natural' hash position?
        if (this.collisionResolution === CollisionResolution.Chaining) {
            return (this.buckets as HashTableNode[][]).filter(
                (bucket) => bucket.length > 1
            ).length;
        } else {
            // For probing, collision means needing to probe.
            // We could count occupied slots != null whose initial hash isn't their current index.
            let probingCollisions = 0;
            (
                this.buckets as Array<
                    HashTableNode | null | typeof DELETED_MARKER
                >
            ).forEach((node, index) => {
                if (node && node !== DELETED_MARKER) {
                    const initialHash = this.hash(node.key).finalHash;
                    if (initialHash !== index) {
                        probingCollisions++;
                    }
                }
            });
            return probingCollisions;
        }
    }

    // Method to get current strategy settings
    getCurrentStrategies(): {
        hashing: HashingStrategy;
        collision: CollisionResolution;
    } {
        return {
            hashing: this.hashingStrategy,
            collision: this.collisionResolution,
        };
    }

    // Method to change strategies (requires clearing and potentially parameter regeneration)
    setStrategies(
        hashing: HashingStrategy,
        collision: CollisionResolution
    ): void {
        const needsParamRegen =
            this.hashingStrategy !== hashing &&
            hashing === HashingStrategy.Universal;
        const needsRUpdate =
            this.collisionResolution !== collision &&
            collision === CollisionResolution.DoubleHashing;
        const needsBucketRestructure = this.collisionResolution !== collision;

        this.hashingStrategy = hashing;
        this.collisionResolution = collision;

        if (needsParamRegen) this.generateUniversalParams();
        if (needsRUpdate) this.setDoubleHashingR();

        // Important: Changing collision strategy requires resetting buckets
        if (needsBucketRestructure) {
            console.warn(
                "Changing collision resolution strategy clears the table."
            );
            this.initializeBuckets(); // Reset buckets for the new structure
        } else {
            // If only hashing changes, might not need full clear, but safer to do so
            // to avoid potential inconsistencies if items were added with old hash.
            console.warn("Changing hashing strategy clears the table.");
            this.clear();
        }
    }
}

// Export node class if needed by the component, otherwise keep internal
// export { HashTableNode }; // Let's keep it internal for now
