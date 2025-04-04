// src/algorithm/HashTable.ts

// --- Enums for Strategies ---
export enum HashingStrategy {
    Simple = "SIMPLE",
    Universal = "UNIVERSAL",
    // Perfect hashing is complex, especially dynamic.
}

export enum CollisionResolution {
    Chaining = "CHAINING",
    LinearProbing = "LINEAR_PROBING",
    DoubleHashing = "DOUBLE_HASHING",
}

// --- Node Definition ---
// Keep HashTableNode simple for Chaining
class HashTableNode {
    key: string;
    value: string;
    // No extra state needed here; handled by bucket structure or DELETED_MARKER

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}

// Special marker for deleted slots in probing
export const DELETED_MARKER = { key: "__DELETED__", value: "__DELETED__" };

// Type alias for bucket content in probing strategies
type ProbingBucketEntry = HashTableNode | null | typeof DELETED_MARKER;

// Type alias for the result of the internal find slot helper
type FindSlotResult = {
    found: boolean; // Was the exact key found?
    index: number; // Index where key was found, OR first available (null/deleted) slot if not found
    probes: number;
    probeSequence: number[];
};

// --- Main HashTable Class ---
export class HashTable {
    // Use a more specific union type based on the collision strategy
    private buckets: Array<HashTableNode[]> | Array<ProbingBucketEntry>;
    private size: number; // Actual size of the bucket array (should ideally be prime for probing)
    private tableSize: number; // Stores the effective size used for hashing calculations (prime for probing)
    private hashingStrategy: HashingStrategy;
    private collisionResolution: CollisionResolution;
    private itemCount: number = 0; // Track active items for load factor

    // Universal Hashing parameters
    // Initialize with a default large prime to avoid issues if Universal isn't selected initially
    // but keyToInteger is called (e.g., for DoubleHashing)
    private universal_p: number = 10000019; // A reasonably large prime
    private universal_a: number = 1; // Default values
    private universal_b: number = 0; // Default values

    // Double Hashing prime (R)
    private double_hashing_R: number = 1; // Default/fallback value

    constructor(
        requestedSize: number = 10,
        hashing: HashingStrategy = HashingStrategy.Simple,
        collision: CollisionResolution = CollisionResolution.Chaining
    ) {
        this.size = Math.max(1, requestedSize); // User requested size
        this.hashingStrategy = hashing;
        this.collisionResolution = collision;
        this.itemCount = 0;

        // For probing strategies, especially Double Hashing, ensure table size is prime
        if (
            this.collisionResolution === CollisionResolution.LinearProbing ||
            this.collisionResolution === CollisionResolution.DoubleHashing
        ) {
            this.tableSize = this.findNextPrime(this.size);
            console.log(
                `Requested size ${this.size}, using prime table size ${this.tableSize} for probing.`
            );
        } else {
            this.tableSize = this.size; // Chaining doesn't strictly need prime size
        }

        // Initialize parameters based on strategies *after* tableSize is set
        if (this.hashingStrategy === HashingStrategy.Universal) {
            this.generateUniversalParams(); // Uses this.tableSize implicitly via keyToInteger potentially
        }
        if (this.collisionResolution === CollisionResolution.DoubleHashing) {
            this.setDoubleHashingR(); // Uses this.tableSize
        }

        this.initializeBuckets();
    }

    // --- Bucket Initialization based on Strategy ---
    private initializeBuckets(): void {
        if (this.collisionResolution === CollisionResolution.Chaining) {
            // Size here should be the original requested size or adjusted tableSize?
            // Let's use tableSize for consistency, though chaining often uses requested size directly.
            this.buckets = Array(this.tableSize)
                .fill(null)
                .map(() => []);
        } else {
            // Linear Probing or Double Hashing use the (potentially prime) tableSize
            this.buckets = Array(this.tableSize).fill(null);
        }
        this.itemCount = 0; // Reset count on initialization
        console.log(
            `Initialized buckets for ${this.collisionResolution}, table size ${this.tableSize}`
        );
    }

    // --- Parameter Generation & Prime Helpers ---
    private isPrime(num: number): boolean {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i = i + 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    // Finds the smallest prime >= num
    private findNextPrime(num: number): number {
        if (num <= 2) return 2;
        let prime = num;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (this.isPrime(prime)) {
                return prime;
            }
            prime++;
            // Add a safety break for extremely large loops, though unlikely
            if (prime > num * 2 && prime > 1000000) {
                console.warn(
                    "Prime search exceeded reasonable limits, returning input*2"
                );
                return num * 2; // Fallback
            }
        }
    }

    // Finds the largest prime < num
    private findPrevPrime(num: number): number {
        if (num <= 2) return 1; // No prime < 2, return 1 as special case for R calculation
        let prime = num - 1; // Start checking below num
        while (prime > 1) {
            if (this.isPrime(prime)) {
                return prime;
            }
            prime--;
        }
        return 1; // Return 1 if no smaller prime found (e.g., input was 2 or 3)
    }

    private generateUniversalParams(): void {
        // P should be larger than the max possible integer key value.
        // Since keyToInteger uses modulo P, let's choose P based on tableSize.
        // Choosing a prime larger than tableSize is key.
        this.universal_p = this.findNextPrime(this.tableSize * 100); // Or a larger factor/fixed large prime
        this.universal_a =
            Math.floor(Math.random() * (this.universal_p - 1)) + 1; // 1 <= a < p
        this.universal_b = Math.floor(Math.random() * this.universal_p); // 0 <= b < p
        console.log(
            `Universal Params: p=${this.universal_p}, a=${this.universal_a}, b=${this.universal_b}`
        );
    }

    private setDoubleHashingR(): void {
        // R must be prime and less than the table size (m).
        // R must also be > 0.
        this.double_hashing_R = this.findPrevPrime(this.tableSize);
        // Note: If tableSize is 2 or 3, findPrevPrime returns 1.
        // This causes hash2 to always return 1, degrading to linear probing. This is expected.
        if (this.double_hashing_R <= 0) {
            console.warn(
                `Could not find suitable prime R < ${this.tableSize}. Using fallback R=1.`
            );
            this.double_hashing_R = 1; // Fallback to prevent issues, effectively linear probing step 1
        }
        console.log(
            `Double Hashing R set to: ${this.double_hashing_R} (for table size ${this.tableSize})`
        );
    }

    // --- Key to Integer Conversion ---
    private keyToInteger(key: string): number {
        let hashValue = 0;
        // Use a large prime (universal_p seems reasonable, ensure it's non-zero)
        // or another large fixed prime if universal hashing isn't active.
        const modulus = this.universal_p > 1 ? this.universal_p : 10000019; // Use default if universal_p wasn't set
        for (let i = 0; i < key.length; i++) {
            // Polynomial rolling hash is common (using 31 as prime base)
            hashValue = (hashValue * 31 + key.charCodeAt(i)) % modulus;
        }
        // Ensure positive, although modulo should handle it if modulus is positive
        return Math.abs(hashValue);
    }

    // --- Hashing Functions ---

    // Primary hash function h1(key)
    hash(key: string): {
        initialIndex: number; // Renamed from finalHash for clarity before probing
        steps?: Array<{
            char: string;
            code: number;
            position: number;
            subtotal: number;
        }>; // Optional steps for simple hash
    } {
        const hashDetails: {
            initialIndex: number;
            steps?: any[];
        } = { initialIndex: -1 };

        let index: number;
        const m = this.tableSize; // Use the actual table size for modulo

        if (this.hashingStrategy === HashingStrategy.Simple) {
            // Simple (and often poor) hash: sum of weighted char codes
            let simpleHashValue = 0;
            const steps = [];
            for (let i = 0; i < key.length; i++) {
                const char = key[i];
                const charCode = key.charCodeAt(i);
                const position = i + 1;
                const contribution = charCode * position;
                simpleHashValue += contribution;
                steps.push({
                    char,
                    code: charCode,
                    position,
                    subtotal: simpleHashValue,
                });
            }
            // Ensure positive index in [0, m-1]
            index = ((simpleHashValue % m) + m) % m;
            hashDetails.steps = steps;
            hashDetails.initialIndex = index;
        } else if (this.hashingStrategy === HashingStrategy.Universal) {
            const k = this.keyToInteger(key);
            // Ensure params are valid (should be done in constructor/setStrategies)
            if (this.universal_p <= 1 || this.universal_a < 1) {
                console.warn(
                    "Universal hashing parameters seem invalid, regenerating."
                );
                this.generateUniversalParams(); // Attempt to fix if called unexpectedly
            }
            // Formula: ((a*k + b) mod p) mod m
            const hashValue =
                (this.universal_a * k + this.universal_b) % this.universal_p;
            index = ((hashValue % m) + m) % m; // Ensure positive index in [0, m-1]
            hashDetails.initialIndex = index;
            // Steps for universal hashing are less intuitive to show simply
        } else {
            // Default or unknown strategy, fallback to simple
            console.warn("Unknown hashing strategy, defaulting to Simple.");
            const simpleHashResult = this.hashSimpleInternal(key); // Use helper
            index = simpleHashResult.initialIndex;
            hashDetails.steps = simpleHashResult.steps;
            hashDetails.initialIndex = index;
        }

        if (hashDetails.initialIndex === -1) {
            console.error("Failed to calculate hash index for key:", key);
            hashDetails.initialIndex = 0; // Fallback to 0
        }

        return hashDetails;
    }

    // Helper for default/simple case in hash method
    private hashSimpleInternal(key: string): {
        initialIndex: number;
        steps: any[];
    } {
        let hashValue = 0;
        const steps = [];
        const m = this.tableSize;
        for (let i = 0; i < key.length; i++) {
            const char = key[i];
            const charCode = key.charCodeAt(i);
            const position = i + 1;
            const contribution = charCode * position;
            hashValue += contribution;
            steps.push({ char, code: charCode, position, subtotal: hashValue });
        }
        const initialIndex = ((hashValue % m) + m) % m; // Ensure positive index in [0, m-1]
        return { initialIndex, steps };
    }

    // --- Second Hash Function h2(key) for Double Hashing ---
    private hash2(key: string): number {
        // R must be prime, R < tableSize, R > 0.
        // hash2(k) must never be 0.
        // Common choice: R - (k mod R)
        if (this.double_hashing_R <= 0) {
            console.warn(
                `Double Hashing R is invalid (${this.double_hashing_R}), using fallback step 1.`
            );
            return 1; // Must return > 0
        }
        const k = this.keyToInteger(key);
        const step = this.double_hashing_R - (k % this.double_hashing_R);

        // Ensure step > 0. If k % R is 0, step would be R. If R=1, k%R=0, step=1.
        // The formula naturally gives a step in [1, R]. Since R < tableSize, step < tableSize.
        // If tableSize is prime, gcd(step, tableSize) is likely 1.
        // If R=1 (for tableSize 2 or 3), step is always 1.
        return step; // No need for Math.max(1, step) here due to formula properties
    }

    // --- Refactored Probing Helper ---
    private _findSlot(key: string): FindSlotResult {
        const { initialIndex } = this.hash(key);
        let probes = 0;
        const probeSequence: number[] = [];
        let firstAvailableIndex = -1; // Track first deleted or null slot

        const m = this.tableSize;
        const probingBuckets = this.buckets as Array<ProbingBucketEntry>;

        let step = 1; // Default step for Linear Probing
        if (this.collisionResolution === CollisionResolution.DoubleHashing) {
            step = this.hash2(key);
            if (step <= 0 || step >= m) {
                console.error(
                    `Invalid step ${step} from hash2 for key ${key}. Defaulting to 1.`
                );
                step = 1; // Safety check
            }
        }

        for (let i = 0; i < m; i++) {
            // Probe at most m times
            // Calculate index for this probe using robust modulo
            const probeIndex = (((initialIndex + i * step) % m) + m) % m;
            probes++;
            probeSequence.push(probeIndex);

            const currentNode = probingBuckets[probeIndex];

            if (currentNode === null) {
                // Found empty slot - key is not present beyond this point.
                if (firstAvailableIndex === -1) {
                    firstAvailableIndex = probeIndex; // This is the first available spot
                }
                return {
                    found: false,
                    index: firstAvailableIndex, // Return first available (which is this one)
                    probes,
                    probeSequence,
                };
            } else if (currentNode === DELETED_MARKER) {
                // Found deleted slot - store it as potential insertion point, but continue search for key
                if (firstAvailableIndex === -1) {
                    firstAvailableIndex = probeIndex;
                }
                // Continue probing
            } else if (currentNode.key === key) {
                // Found the actual key
                return {
                    found: true,
                    index: probeIndex, // Return index where key was found
                    probes,
                    probeSequence,
                };
            }
            // Else: Collision with a different key, continue probing
        }

        // If loop finishes, table is full or only deleted slots were found after starting point
        // If firstAvailableIndex was found, return it for potential insertion (set operation)
        // Otherwise, the table is truly full for this probe sequence.
        return {
            found: false,
            index: firstAvailableIndex !== -1 ? firstAvailableIndex : -1, // -1 indicates table full or cycle without empty/deleted
            probes,
            probeSequence,
        };
    }

    // --- Core Operations (Set, Get, Remove) ---

    set(
        key: string,
        value: string
    ): {
        hashInfo: ReturnType<typeof this.hash>;
        isUpdate: boolean;
        finalIndex: number; // Actual index where inserted/updated, -1 if failed
        probes: number;
        probeSequence: number[];
    } {
        const hashInfo = this.hash(key); // Get initial hash info (e.g., simple steps)
        let isUpdate = false;
        let finalIndex = -1;
        let probes = 0;
        let probeSequence: number[] = [];

        switch (this.collisionResolution) {
            case CollisionResolution.Chaining: {
                const { initialIndex } = hashInfo;
                const bucket = this.buckets[initialIndex] as HashTableNode[];
                finalIndex = initialIndex; // For chaining, index is fixed
                probeSequence.push(initialIndex); // Only "probe" is the bucket index

                for (let i = 0; i < bucket.length; i++) {
                    if (bucket[i].key === key) {
                        bucket[i].value = value; // Update existing
                        isUpdate = true;
                        // probes counts comparisons within chain maybe? Let's keep it 0 for consistency with probing def.
                        return {
                            hashInfo,
                            isUpdate,
                            finalIndex,
                            probes: bucket.length,
                            probeSequence,
                        }; // probes = chain length
                    }
                }
                // Insert new node
                bucket.push(new HashTableNode(key, value));
                this.itemCount++;
                return {
                    hashInfo,
                    isUpdate,
                    finalIndex,
                    probes: bucket.length,
                    probeSequence,
                }; // probes = new chain length
            }

            case CollisionResolution.LinearProbing:
            case CollisionResolution.DoubleHashing: {
                // Check load factor before finding slot
                if (this.getLoadFactor() >= 0.7) {
                    // Recommended threshold for probing
                    console.warn(
                        `Load factor ${this.getLoadFactor().toFixed(
                            2
                        )} >= 0.7. Resize recommended before inserting '${key}'.`
                        // Consider triggering resize automatically here or throwing error if desired
                    );
                    // Maybe throw an error if strictly enforcing load factor?
                    // throw new Error(`Load factor too high (${this.getLoadFactor()})`);
                }

                const result = this._findSlot(key);
                probes = result.probes;
                probeSequence = result.probeSequence;
                const probingBuckets = this
                    .buckets as Array<ProbingBucketEntry>;

                if (result.found) {
                    // Key already exists, update it
                    finalIndex = result.index;
                    probingBuckets[finalIndex] = new HashTableNode(key, value); // Replace node
                    isUpdate = true;
                    // Item count doesn't change on update
                } else {
                    // Key not found, insert at first available slot (null or deleted)
                    if (result.index !== -1) {
                        // Check if an available slot was found
                        finalIndex = result.index;
                        // Check if we are replacing a DELETED_MARKER or null
                        const wasDeleted =
                            probingBuckets[finalIndex] === DELETED_MARKER;
                        probingBuckets[finalIndex] = new HashTableNode(
                            key,
                            value
                        );
                        isUpdate = false;
                        // Only increment itemCount if we are filling a truly empty (null) or deleted slot
                        // If it was deleted, it wasn't counted, so increment. If null, also increment.
                        this.itemCount++;
                    } else {
                        // No available slot found (table is full according to probe sequence)
                        console.error(
                            `Hash table full or probe cycle failed. Cannot insert key: ${key}`
                        );
                        // finalIndex remains -1
                        throw new Error(`Hash table overflow for key '${key}'`);
                    }
                }
                return {
                    hashInfo,
                    isUpdate,
                    finalIndex,
                    probes,
                    probeSequence,
                };
            }

            default:
                throw new Error("Unknown collision resolution strategy");
        }
    }

    get(key: string): {
        value: string | null;
        hashInfo: ReturnType<typeof this.hash>;
        finalIndex: number | null; // Actual index where found, null if not found
        probes: number;
        probeSequence: number[];
    } {
        const hashInfo = this.hash(key);
        let finalIndex: number | null = null;
        let probes = 0;
        let probeSequence: number[] = [];
        let value: string | null = null;

        switch (this.collisionResolution) {
            case CollisionResolution.Chaining: {
                const { initialIndex } = hashInfo;
                const bucket = this.buckets[initialIndex] as HashTableNode[];
                probeSequence.push(initialIndex); // Only probe is the bucket index

                for (let i = 0; i < bucket.length; i++) {
                    // probes++; // Increment for each comparison in the chain
                    if (bucket[i].key === key) {
                        value = bucket[i].value;
                        finalIndex = initialIndex;
                        probes = bucket.length; // Report chain length as probes
                        break;
                    }
                }
                return { value, hashInfo, finalIndex, probes, probeSequence }; // Not found if loop finishes
            }

            case CollisionResolution.LinearProbing:
            case CollisionResolution.DoubleHashing: {
                const result = this._findSlot(key);
                probes = result.probes;
                probeSequence = result.probeSequence;

                if (result.found) {
                    finalIndex = result.index;
                    const node = (this.buckets as Array<ProbingBucketEntry>)[
                        finalIndex
                    ];
                    // Type guard to be sure it's a node
                    if (node && node !== DELETED_MARKER) {
                        value = node.value;
                    } else {
                        // Should not happen if result.found is true, but good for robustness
                        console.error(
                            "Inconsistency: _findSlot reported found, but slot is not a valid node."
                        );
                        value = null;
                        finalIndex = null;
                    }
                } else {
                    // Key not found by _findSlot
                    value = null;
                    finalIndex = null;
                }
                return { value, hashInfo, finalIndex, probes, probeSequence };
            }

            default:
                throw new Error("Unknown collision resolution strategy");
        }
    }

    remove(key: string): {
        success: boolean;
        hashInfo: ReturnType<typeof this.hash>;
        finalIndex: number | null; // Index where removed from, null if not found/removed
        probes: number;
        probeSequence: number[];
    } {
        const hashInfo = this.hash(key);
        let success = false;
        let finalIndex: number | null = null;
        let probes = 0;
        let probeSequence: number[] = [];

        switch (this.collisionResolution) {
            case CollisionResolution.Chaining: {
                const { initialIndex } = hashInfo;
                const bucket = this.buckets[initialIndex] as HashTableNode[];
                probeSequence.push(initialIndex);
                const initialLength = bucket.length;

                for (let i = 0; i < bucket.length; i++) {
                    // probes++;
                    if (bucket[i].key === key) {
                        bucket.splice(i, 1); // Remove from chain
                        success = true;
                        this.itemCount--;
                        finalIndex = initialIndex;
                        probes = initialLength; // Report original chain length as probes?
                        break;
                    }
                }
                if (!success) probes = initialLength; // Report probes even if not found
                return { success, hashInfo, finalIndex, probes, probeSequence };
            }

            case CollisionResolution.LinearProbing:
            case CollisionResolution.DoubleHashing: {
                const result = this._findSlot(key);
                probes = result.probes;
                probeSequence = result.probeSequence;

                if (result.found) {
                    // Key found at result.index, replace with DELETED_MARKER
                    finalIndex = result.index;
                    (this.buckets as Array<ProbingBucketEntry>)[finalIndex] =
                        DELETED_MARKER;
                    success = true;
                    this.itemCount--; // Decrement active item count
                } else {
                    // Key not found
                    success = false;
                    finalIndex = null;
                }
                return { success, hashInfo, finalIndex, probes, probeSequence };
            }

            default:
                throw new Error("Unknown collision resolution strategy");
        }
    }

    // --- Utility Methods ---

    getBuckets(): Array<HashTableNode[]> | Array<ProbingBucketEntry> {
        return this.buckets;
    }

    clear(): void {
        this.initializeBuckets(); // Re-initializes based on current strategy and size
    }

    getSize(): number {
        return this.size; // Return the user-requested size
    }

    getTableSize(): number {
        return this.tableSize; // Return the actual array size (potentially prime)
    }

    resize(newRequestedSizeInput: number): void {
        const newRequestedSize = Math.max(1, newRequestedSizeInput);
        const oldTableSize = this.tableSize;
        console.log(
            `Resizing requested from ${this.size} towards ${newRequestedSize} (current table size ${oldTableSize})...`
        );

        const oldBuckets = this.buckets;
        const oldCollisionResolution = this.collisionResolution;

        // Store all valid old items
        const oldItems: HashTableNode[] = [];
        if (oldCollisionResolution === CollisionResolution.Chaining) {
            (oldBuckets as HashTableNode[][]).forEach((bucket) => {
                bucket.forEach((node) =>
                    oldItems.push(new HashTableNode(node.key, node.value))
                ); // Copy nodes
            });
        } else {
            (oldBuckets as Array<ProbingBucketEntry>).forEach((node) => {
                if (node && node !== DELETED_MARKER) {
                    oldItems.push(new HashTableNode(node.key, node.value)); // Copy nodes
                }
            });
        }

        // Update size parameters *before* initializing new buckets
        this.size = newRequestedSize; // Store new requested size

        // Determine new actual table size (prime if needed)
        if (
            this.collisionResolution === CollisionResolution.LinearProbing ||
            this.collisionResolution === CollisionResolution.DoubleHashing
        ) {
            this.tableSize = this.findNextPrime(this.size);
            console.log(
                `New requested size ${this.size}, using new prime table size ${this.tableSize}.`
            );
        } else {
            this.tableSize = this.size;
        }

        // Re-calculate parameters dependent on the *new* tableSize
        // Note: Regenerating universal params might change hashes unpredictably if not desired.
        // Usually, you keep the hash function stable unless explicitly changing strategy.
        // Let's only regen if the strategy requires it and size changed significantly,
        // or maybe just recalculate R for double hashing.
        // if (this.hashingStrategy === HashingStrategy.Universal) this.generateUniversalParams(); // Re-randomize? Often not done on resize.
        if (this.collisionResolution === CollisionResolution.DoubleHashing) {
            this.setDoubleHashingR(); // R depends on the new tableSize
        }

        // Initialize new empty buckets with the new tableSize
        this.initializeBuckets(); // This also resets itemCount to 0

        // Re-insert old items into the new table structure
        console.log(`Rehashing ${oldItems.length} items into new table...`);
        if (oldItems.length > 0 && this.tableSize == 0) {
            console.error(
                "Resize resulted in zero table size with items to rehash. Aborting rehash."
            );
            return;
        }

        oldItems.forEach((node) => {
            // Use the current set method which respects the current strategy and new size/params
            try {
                this.set(node.key, node.value);
            } catch (e: any) {
                console.error(
                    `Error rehashing key '${node.key}' during resize: ${e.message}`
                );
                // Depending on requirements, might continue or re-throw
            }
        });

        console.log(
            `Resize complete. New requested size: ${this.size}, New table size: ${this.tableSize}, Item count: ${this.itemCount}`
        );
        if (this.itemCount !== oldItems.length) {
            console.warn(
                `Item count mismatch after resize: expected ${oldItems.length}, found ${this.itemCount}. Check for errors during rehash.`
            );
        }
    }

    /**
     * Calculates the load factor (alpha).
     * For Chaining: Average chain length (items / number of buckets).
     * For Probing: Ratio of occupied slots (items / table size).
     * Note: For probing, this doesn't account for DELETED_MARKER slots,
     * which can still impact performance.
     */
    getLoadFactor(): number {
        return this.tableSize > 0 ? this.itemCount / this.tableSize : 0;
    }

    /**
     * Estimates the number of primary collisions.
     * For Chaining: Counts buckets with more than one item.
     * For Probing: Counts occupied slots whose current index doesn't match their initial hash index.
     * This is an approximation for probing collisions.
     */
    getCollisionCount(): number {
        if (this.collisionResolution === CollisionResolution.Chaining) {
            return (this.buckets as HashTableNode[][]).filter(
                (bucket) => bucket.length > 1
            ).length;
        } else {
            let probingCollisions = 0;
            const probingBuckets = this.buckets as Array<ProbingBucketEntry>;
            probingBuckets.forEach((node, index) => {
                if (node && node !== DELETED_MARKER) {
                    // Re-calculate initial hash for the key found at this index
                    const { initialIndex } = this.hash(node.key);
                    if (initialIndex !== index) {
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
        console.warn("Changing strategies will clear the hash table!");

        const oldCollision = this.collisionResolution;
        const oldHashing = this.hashingStrategy;

        this.hashingStrategy = hashing;
        this.collisionResolution = collision;

        // Check if table size needs to become prime or can revert to requested size
        const needsPrimeSize =
            collision === CollisionResolution.LinearProbing ||
            collision === CollisionResolution.DoubleHashing;
        const oldNeedsPrimeSize =
            oldCollision === CollisionResolution.LinearProbing ||
            oldCollision === CollisionResolution.DoubleHashing;

        if (needsPrimeSize && !oldNeedsPrimeSize) {
            this.tableSize = this.findNextPrime(this.size); // Ensure prime size
        } else if (!needsPrimeSize && oldNeedsPrimeSize) {
            this.tableSize = this.size; // Revert to requested size if no longer probing
        }
        // If both old and new need/don't need prime, tableSize might still change if size itself changed via resize previously. Re-align if necessary.
        else if (needsPrimeSize) {
            this.tableSize = this.findNextPrime(this.size);
        } else {
            this.tableSize = this.size;
        }

        // Regenerate parameters if necessary
        if (
            hashing === HashingStrategy.Universal &&
            (oldHashing !== hashing || needsPrimeSize !== oldNeedsPrimeSize)
        ) {
            // Regenerate if switching TO Universal, or if table characteristics changed
            this.generateUniversalParams();
        }
        if (
            collision === CollisionResolution.DoubleHashing &&
            (oldCollision !== collision || needsPrimeSize !== oldNeedsPrimeSize)
        ) {
            // Regenerate R if switching TO DoubleHashing or if table size changed nature
            this.setDoubleHashingR();
        }

        // Changing strategies requires resetting buckets to match new structure/size
        this.initializeBuckets(); // Re-create buckets and reset item count
    }
}

// Export node class if needed externally, otherwise keep internal
// export { HashTableNode };
