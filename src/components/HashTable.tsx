import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    HashTable,
    HashingStrategy,
    CollisionResolution,
    DELETED_MARKER,
} from "../algorithm/HashTable";
import "./HashTable.css";

// Interface for hash step details
interface HashStep {
    char: string;
    code: number;
    position: number;
    subtotal: number;
}

// Interface for operation result details
interface OperationResult {
    action: string; // 'set', 'get', 'remove'
    key: string;
    value?: string | null;
    success?: boolean;
    isUpdate?: boolean;
    hashInfo: {
        finalHash: number; // Initial hash index
        steps?: HashStep[];
        probes?: number;
        probeSequence?: number[];
    };
    finalIndex?: number | null; // Actual final index after probing/chaining
    message: string;
}

// Helper to get node display value
const getNodeDisplay = (node: any): string => {
    if (node === null) return "null";
    if (node.key === "__DELETED__") return "DEL"; // Use the DELETED_MARKER symbol
    return `${node.key}: ${node.value}`;
};

const HashTableComponent: React.FC = () => {
    const [size, setSize] = useState<number>(10);
    const [hashingStrategy, setHashingStrategy] = useState<HashingStrategy>(
        HashingStrategy.Simple
    );
    const [collisionStrategy, setCollisionStrategy] =
        useState<CollisionResolution>(CollisionResolution.Chaining);

    // Use useRef to hold the HashTable instance
    const hashTableRef = useRef<HashTable>(
        new HashTable(size, hashingStrategy, collisionStrategy)
    );

    const [buckets, setBuckets] = useState<Array<any>>(
        hashTableRef.current.getBuckets()
    );
    const [keyInput, setKeyInput] = useState<string>("");
    const [valueInput, setValueInput] = useState<string>("");
    const [operationResult, setOperationResult] =
        useState<OperationResult | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(
        null
    );
    const [probePath, setProbePath] = useState<number[]>([]); // For visualizing probes

    // Effect to update HashTable instance when strategies or size change
    useEffect(() => {
        console.log(
            `Recreating HashTable. Size: ${size}, Hashing: ${hashingStrategy}, Collision: ${collisionStrategy}`
        );
        hashTableRef.current = new HashTable(
            size,
            hashingStrategy,
            collisionStrategy
        );
        setBuckets(hashTableRef.current.getBuckets());
        setOperationResult(null); // Clear previous results
        setHighlightedIndex(null);
        setProbePath([]);
    }, [size, hashingStrategy, collisionStrategy]);

    const updateBuckets = useCallback(() => {
        setBuckets([...hashTableRef.current.getBuckets()]); // Trigger re-render
    }, []);

    const handleOperation = useCallback(
        (action: "set" | "get" | "remove") => {
            const key = keyInput;
            if (!key) {
                setOperationResult({
                    action,
                    key,
                    message: "Key cannot be empty.",
                    hashInfo: { finalHash: -1 }, // Provide a default hashInfo
                });
                return;
            }

            let result: OperationResult;
            setHighlightedIndex(null); // Reset highlights
            setProbePath([]); // Reset probe path

            try {
                switch (action) {
                    case "set": {
                        const value = valueInput;
                        const setResult = hashTableRef.current.set(key, value);
                        result = {
                            action: "set",
                            key,
                            value,
                            isUpdate: setResult.isUpdate,
                            hashInfo: setResult.hashInfo,
                            finalIndex: setResult.finalIndex,
                            message: `Set "${key}" to "${value}". ${
                                setResult.isUpdate ? "(Updated)" : "(Inserted)"
                            }${
                                setResult.probes
                                    ? ` Probes: ${setResult.probes}`
                                    : ""
                            }`,
                        };
                        setHighlightedIndex(setResult.finalIndex);
                        setProbePath(setResult.probeSequence || []);
                        break;
                    }
                    case "get": {
                        const getResult = hashTableRef.current.get(key);
                        result = {
                            action: "get",
                            key,
                            value: getResult.value,
                            hashInfo: getResult.hashInfo,
                            finalIndex: getResult.finalIndex,
                            message:
                                getResult.value !== null
                                    ? `Get "${key}": Found "${getResult.value}".`
                                    : `Get "${key}": Not Found.${
                                          getResult.probes
                                              ? ` Probes: ${getResult.probes}`
                                              : ""
                                      }`,
                        };
                        setHighlightedIndex(getResult.finalIndex);
                        setProbePath(getResult.probeSequence || []);
                        break;
                    }
                    case "remove": {
                        const removeResult = hashTableRef.current.remove(key);
                        result = {
                            action: "remove",
                            key,
                            success: removeResult.success,
                            hashInfo: removeResult.hashInfo,
                            finalIndex: removeResult.finalIndex, // Index where it was (or would be if probing)
                            message: removeResult.success
                                ? `Removed "${key}".`
                                : `Remove "${key}": Not Found.${
                                      removeResult.probes
                                          ? ` Probes: ${removeResult.probes}`
                                          : ""
                                  }`,
                        };
                        // Highlight the initial hash or final probe location even if not found/deleted
                        setHighlightedIndex(
                            removeResult.finalIndex ??
                                removeResult.hashInfo.finalHash
                        );
                        setProbePath(removeResult.probeSequence || []);
                        break;
                    }
                }
                setOperationResult(result);
                updateBuckets(); // Update visualization
                setKeyInput(""); // Clear inputs after operation
                setValueInput("");
            } catch (error: any) {
                console.error("Operation failed:", error);
                setOperationResult({
                    action,
                    key,
                    message: `Error: ${error.message}`,
                    hashInfo: { finalHash: -1 }, // Provide default hashInfo
                });
            }
        },
        [keyInput, valueInput, hashTableRef, updateBuckets]
    );

    const handleClear = () => {
        hashTableRef.current.clear();
        updateBuckets();
        setOperationResult({
            action: "clear",
            key: "",
            message: "Table cleared.",
            hashInfo: { finalHash: -1 },
        });
        setHighlightedIndex(null);
        setProbePath([]);
    };

    const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = parseInt(event.target.value, 10);
        if (!isNaN(newSize) && newSize > 0) {
            setSize(newSize); // This triggers the useEffect to recreate the table
        }
    };

    // --- Render Functions ---

    const renderHashSteps = (steps: HashStep[] | undefined) => {
        if (!steps || steps.length === 0)
            return (
                <p>Hash calculation steps not available for this strategy.</p>
            );
        return (
            <ol className="list-decimal list-inside text-xs">
                {steps.map((step, i) => (
                    <li key={i}>
                        Char: '{step.char}' (Code: {step.code}) * Pos:{" "}
                        {step.position} = {step.code * step.position}. Subtotal:{" "}
                        {step.subtotal}
                    </li>
                ))}
            </ol>
        );
    };

    const renderBucketContent = (
        bucketData: any,
        index: number,
        isHighlighted: boolean,
        isInProbePath: boolean
    ) => {
        const baseClasses =
            "border p-2 m-1 min-h-[50px] transition-colors duration-500";
        const highlightClass = isHighlighted
            ? "bg-blue-300"
            : isInProbePath
            ? "bg-yellow-200"
            : "bg-gray-100";

        if (collisionStrategy === CollisionResolution.Chaining) {
            const chain = bucketData as { key: string; value: string }[];
            return (
                <div className={`${baseClasses} ${highlightClass}`}>
                    <strong className="block text-center text-xs mb-1">
                        Index {index}
                    </strong>
                    {chain.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">
                            Empty
                        </span>
                    ) : (
                        <ul className="text-xs space-y-1">
                            {chain.map((node, nodeIndex) => (
                                <li
                                    key={`${node.key}-${nodeIndex}`}
                                    className="bg-white border rounded px-1 py-0.5"
                                >
                                    {node.key}: {node.value}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        } else {
            // Linear Probing or Double Hashing
            const node = bucketData as
                | { key: string; value: string }
                | null
                | typeof DELETED_MARKER;
            let displayValue: string;
            let nodeClass = "text-xs";
            if (node === null) {
                displayValue = "[Empty]";
                nodeClass += " text-gray-400 italic";
            } else if (node.key === "__DELETED__") {
                displayValue = "[Deleted]";
                nodeClass += " text-red-500 italic";
            } else {
                displayValue = `${node.key}: ${node.value}`;
                nodeClass += " font-semibold";
            }

            return (
                <div
                    className={`${baseClasses} ${highlightClass} flex flex-col justify-between items-center`}
                >
                    <strong className="block text-center text-xs mb-1">
                        Index {index}
                    </strong>
                    <span className={nodeClass}>{displayValue}</span>
                </div>
            );
        }
    };

    return (
        <div className="p-4 space-y-4 font-sans bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-indigo-700 mb-4">
                Interactive Hash Table
            </h2>
            <p>
                A Hash Table is a data structure that associates keys with
                values for efficient information retrieval. It uses a hash
                function to compute an array index from a key, where the
                corresponding value is stored. The primary benefit is speed: on
                average, operations like insertion, search, and deletion can be
                performed in constant time, close to O(1). However, downsides
                include the occurrence of collisions (when different keys map to
                the same index), which require resolution strategies like
                chaining or probing, potentially degrading performance to O(n)
                in the worst case. Furthermore, performance heavily depends on
                the quality of the hash function and the chosen collision
                resolution strategy, and resizing the table to maintain
                efficiency can be a costly operation.
            </p>
            {/* Configuration Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white rounded shadow">
                <div>
                    <label
                        htmlFor="sizeInput"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Table Size:
                    </label>
                    <input
                        id="sizeInput"
                        type="number"
                        value={size}
                        onChange={handleSizeChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        min="1"
                    />
                </div>
                <div>
                    <label
                        htmlFor="hashingStrategy"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Hashing Strategy:
                    </label>
                    <select
                        id="hashingStrategy"
                        value={hashingStrategy}
                        onChange={(e) =>
                            setHashingStrategy(
                                e.target.value as HashingStrategy
                            )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value={HashingStrategy.Simple}>
                            Simple (Weighted Sum)
                        </option>
                        <option value={HashingStrategy.Universal}>
                            Universal Hashing
                        </option>
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="collisionStrategy"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Collision Resolution:
                    </label>
                    <select
                        id="collisionStrategy"
                        value={collisionStrategy}
                        onChange={(e) =>
                            setCollisionStrategy(
                                e.target.value as CollisionResolution
                            )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value={CollisionResolution.Chaining}>
                            Separate Chaining
                        </option>
                        <option value={CollisionResolution.LinearProbing}>
                            Linear Probing
                        </option>
                        <option value={CollisionResolution.DoubleHashing}>
                            Double Hashing
                        </option>
                    </select>
                </div>
            </div>

            {/* Explanation Texts */}
            <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-sm text-indigo-800 space-y-1">
                <p>
                    <strong>
                        {hashingStrategy.replace("_", " ")} Hashing:
                    </strong>
                    {hashingStrategy === HashingStrategy.Simple &&
                        " Calculates hash based on character codes and positions."}
                    {hashingStrategy === HashingStrategy.Universal &&
                        " Uses randomized parameters (a, b, p) for better distribution. Parameters are regenerated on resize."}
                </p>
                <p>
                    <strong>{collisionStrategy.replace("_", " ")}:</strong>
                    {collisionStrategy === CollisionResolution.Chaining &&
                        " Stores colliding elements in a list at the hash index."}
                    {collisionStrategy === CollisionResolution.LinearProbing &&
                        " Searches sequentially for the next empty slot on collision."}
                    {collisionStrategy === CollisionResolution.DoubleHashing &&
                        " Uses a second hash function to determine the step size for probing."}
                </p>
                <p>
                    <strong>Perfect Hashing (Concept):</strong> Guarantees O(1)
                    lookups for a *static* set of keys by using a two-level
                    hashing scheme. Complex to implement dynamically.
                </p>
            </div>

            {/* Input Controls */}
            <div className="flex flex-wrap gap-2 items-end p-3 bg-white rounded shadow">
                <div className="flex-grow">
                    <label
                        htmlFor="keyInput"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Key:
                    </label>
                    <input
                        id="keyInput"
                        type="text"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter key"
                    />
                </div>
                <div className="flex-grow">
                    <label
                        htmlFor="valueInput"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Value:
                    </label>
                    <input
                        id="valueInput"
                        type="text"
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter value"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => handleOperation("set")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Set
                    </button>
                    <button
                        onClick={() => handleOperation("get")}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Get
                    </button>
                    <button
                        onClick={() => handleOperation("remove")}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Remove
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Operation Result Display */}
            {operationResult && (
                <div className="p-3 bg-yellow-100 border border-yellow-300 rounded shadow-sm text-sm">
                    <p>
                        <strong>Last Operation:</strong>{" "}
                        {operationResult.action.toUpperCase()} (
                        {operationResult.key})
                    </p>
                    <p>{operationResult.message}</p>
                    {operationResult.hashInfo?.finalHash !== -1 && (
                        <p>
                            Initial Hash Index:{" "}
                            {operationResult.hashInfo.finalHash}
                        </p>
                    )}
                    {operationResult.finalIndex !== undefined &&
                        operationResult.finalIndex !== null && (
                            <p>Final Index: {operationResult.finalIndex}</p>
                        )}
                    {operationResult.hashInfo?.probes !== undefined && (
                        <p>Probes: {operationResult.hashInfo.probes}</p>
                    )}
                    {operationResult.hashInfo?.probeSequence &&
                        operationResult.hashInfo.probeSequence.length > 1 && (
                            <p>
                                Probe Sequence:{" "}
                                {operationResult.hashInfo.probeSequence.join(
                                    " -> "
                                )}
                            </p>
                        )}
                    {/* Display Hash Steps (if available) */}
                    {operationResult.hashInfo?.steps && (
                        <div>
                            <p className="font-medium mt-1">
                                Hash Calculation Steps:
                            </p>
                            {renderHashSteps(operationResult.hashInfo.steps)}
                            <p>
                                Final Hash ={" "}
                                {
                                    operationResult.hashInfo.steps[
                                        operationResult.hashInfo.steps.length -
                                            1
                                    ].subtotal
                                }{" "}
                                % {size} = {operationResult.hashInfo.finalHash}
                            </p>
                        </div>
                    )}
                    {hashingStrategy === HashingStrategy.Universal &&
                        operationResult.hashInfo?.finalHash !== -1 && (
                            <p className="text-xs italic mt-1">
                                (Universal Hash: ((a*k + b) % p) % m)
                            </p>
                        )}
                </div>
            )}

            {/* Hash Table Visualization */}
            <div className="mt-4 p-3 bg-white rounded shadow overflow-x-auto">
                <h3 className="text-lg font-semibold mb-2 text-indigo-600">
                    Hash Table Structure
                </h3>
                <div className={`grid grid-cols-${Math.min(size, 12)} gap-1`}>
                    {" "}
                    {/* Adjust grid columns based on size */}
                    {buckets.map((bucketData, index) => {
                        const isHighlighted = index === highlightedIndex;
                        // Check if the index is part of the probe path (excluding the final landing spot if it's also highlighted)
                        const isInProbePath =
                            probePath.includes(index) &&
                            index !== highlightedIndex;
                        return (
                            <div key={index}>
                                {renderBucketContent(
                                    bucketData,
                                    index,
                                    isHighlighted,
                                    isInProbePath
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                    <p>
                        Load Factor:{" "}
                        {hashTableRef.current.getLoadFactor().toFixed(2)}
                    </p>
                    <p>
                        Collisions (
                        {collisionStrategy === CollisionResolution.Chaining
                            ? "buckets > 1 item"
                            : "displaced items"}
                        ): {hashTableRef.current.getCollisionCount()}
                    </p>
                    <div className="flex space-x-4 mt-1">
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-yellow-200 mr-1 inline-block"></span>{" "}
                            Probe Path
                        </span>
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-blue-300 mr-1 inline-block"></span>{" "}
                            Final Location
                        </span>
                        {collisionStrategy !== CollisionResolution.Chaining && (
                            <span className="flex items-center">
                                <span className="w-3 h-3 text-red-500 mr-1 inline-block font-bold">
                                    DEL
                                </span>{" "}
                                Deleted Slot
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HashTableComponent;
