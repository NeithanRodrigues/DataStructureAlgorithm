import { useState, useEffect, FC, ChangeEvent, useCallback } from "react";
import { motion } from "framer-motion";
import { HashTable } from "../algorithm/HashTable";

// Interfaces (remain the same)
interface VisualizationData {
    buckets: Array<{
        index: number;
        nodes: Array<{
            key: string;
            value: string;
            highlight: boolean;
        }>;
    }>;
    stats: {
        loadFactor: number;
        collisions: number;
        totalItems: number;
    };
}

interface HashCalculationState {
    key: string;
    steps: Array<{
        char: string;
        code: number;
        position: number;
        subtotal: number;
    }>;
    rawHash: number;
    finalHash: number;
    visible: boolean;
}

// *** STYLING REFINEMENTS START HERE ***

const HashTableComponent: FC = () => {
    const [tableSize, setTableSize] = useState<number>(8);
    const [hashTable, setHashTable] = useState<HashTable>(
        new HashTable(tableSize)
    );
    const [visualizationData, setVisualizationData] =
        useState<VisualizationData>({
            buckets: [],
            stats: { loadFactor: 0, collisions: 0, totalItems: 0 },
        });
    const [keyInput, setKeyInput] = useState<string>("");
    const [valueInput, setValueInput] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
    const [hashCalculation, setHashCalculation] =
        useState<HashCalculationState>({
            key: "",
            steps: [],
            rawHash: 0,
            finalHash: 0,
            visible: false,
        });
    const [animatingBucket, setAnimatingBucket] = useState<number | null>(null);

    const updateVisualization = useCallback(() => {
        const buckets = hashTable.getBuckets();
        const totalItems = buckets.reduce(
            (sum, bucket) => sum + bucket.length,
            0
        );

        const vizData: VisualizationData = {
            buckets: buckets.map((bucket, index) => ({
                index,
                nodes: bucket.map((node) => ({
                    key: node.key,
                    value: node.value,
                    highlight: node.key === highlightedKey,
                })),
            })),
            stats: {
                loadFactor: hashTable.getLoadFactor(),
                collisions: hashTable.getCollisionCount(),
                totalItems,
            },
        };
        setVisualizationData(vizData);
    }, [hashTable, highlightedKey]); // Dependencies are correct

    useEffect(() => {
        updateVisualization();
    }, [updateVisualization]); // Dependency is correct

    const handleKeyInputChange = (
        event: ChangeEvent<HTMLInputElement>
    ): void => {
        const newKey = event.target.value;
        setKeyInput(newKey);
        setMessage("");

        if (newKey) {
            const { finalHash, steps } = hashTable.hash(newKey);
            const rawHash =
                steps.length > 0 ? steps[steps.length - 1].subtotal : 0;

            setHashCalculation({
                key: newKey,
                steps,
                rawHash,
                finalHash,
                visible: true,
            });
        } else {
            // Hide calculation if input is cleared
            setHashCalculation((prev) => ({
                ...prev,
                visible: false,
                key: "",
            }));
        }
    };

    const handleValueInputChange = (
        event: ChangeEvent<HTMLInputElement>
    ): void => {
        setValueInput(event.target.value);
        setMessage("");
    };

    // Common function to display calculation and animate
    const showCalculationAndAnimate = (
        hashInfo: ReturnType<typeof hashTable.hash>,
        key: string
    ) => {
        const rawHash =
            hashInfo.steps.length > 0
                ? hashInfo.steps[hashInfo.steps.length - 1].subtotal
                : 0;
        setHashCalculation({
            key: key,
            steps: hashInfo.steps,
            rawHash,
            finalHash: hashInfo.finalHash,
            visible: true,
        });
        setAnimatingBucket(hashInfo.finalHash);

        // Use a timer to clear calculation visibility, animation, and highlight
        const timerId = setTimeout(() => {
            setHighlightedKey(null);
            setAnimatingBucket(null);
            // Only hide calculation if the keyInput hasn't changed to something else in the meantime
            setHashCalculation((prev) =>
                prev.key === key ? { ...prev, visible: false } : prev
            );
        }, 3500); // Slightly longer timeout

        // Return cleanup function if needed, though not strictly necessary here
        return () => clearTimeout(timerId);
    };

    const handleSet = (): void => {
        if (!keyInput.trim()) {
            setMessage("Please enter a key.");
            return;
        }

        const { hashInfo, isUpdate } = hashTable.set(keyInput, valueInput);
        setMessage(
            `Key "${keyInput}" ${
                isUpdate ? "updated" : "added"
            } with value "${valueInput}".`
        );
        setHighlightedKey(keyInput); // Highlight the key being set/updated
        showCalculationAndAnimate(hashInfo, keyInput);

        // Clear inputs after action
        setKeyInput("");
        setValueInput("");
        updateVisualization(); // Update visualization immediately
    };

    const handleGet = (): void => {
        if (!keyInput.trim()) {
            setMessage("Please enter a key to search.");
            return;
        }

        const { value, hashInfo } = hashTable.get(keyInput);
        showCalculationAndAnimate(hashInfo, keyInput); // Show calculation and bucket

        if (value !== null) {
            setMessage(`Found key "${keyInput}" with value "${value}".`);
            setHighlightedKey(keyInput); // Highlight the found key
        } else {
            setMessage(`Key "${keyInput}" not found.`);
            setHighlightedKey(null); // Ensure nothing is highlighted if not found
        }
        // Do not clear inputs for "get"
    };

    const handleRemove = (): void => {
        if (!keyInput.trim()) {
            setMessage("Please enter a key to remove.");
            return;
        }

        const currentKey = keyInput; // Capture key before clearing
        const { success, hashInfo } = hashTable.remove(currentKey);
        showCalculationAndAnimate(hashInfo, currentKey); // Show calculation and bucket

        if (success) {
            setMessage(`Key "${currentKey}" removed successfully.`);
            setHighlightedKey(null); // Clear highlight after removal
            setKeyInput(""); // Clear inputs on successful removal
            setValueInput("");
            updateVisualization(); // Update visualization immediately
        } else {
            setMessage(`Key "${currentKey}" not found.`);
            setHighlightedKey(null);
        }
    };

    const handleResize = (newSize: number): void => {
        if (newSize === tableSize) return; // No change needed
        hashTable.resize(newSize);
        setTableSize(newSize);
        setMessage(`HashTable resized to ${newSize} buckets.`);
        updateVisualization();
        // Optionally hide hash calculation on resize
        setHashCalculation((prev) => ({ ...prev, visible: false }));
    };

    const handleClear = (): void => {
        hashTable.clear();
        setMessage("HashTable cleared.");
        updateVisualization();
        setHashCalculation((prev) => ({ ...prev, visible: false }));
        setKeyInput("");
        setValueInput("");
        setHighlightedKey(null);
        setAnimatingBucket(null);
    };

    // Refined Color Palette & Bucket Styling
    const getBucketColor = (index: number): string => {
        const colors = [
            "bg-sky-50",
            "bg-emerald-50",
            "bg-amber-50",
            "bg-violet-50",
            "bg-rose-50",
            "bg-cyan-50",
            "bg-fuchsia-50",
            "bg-lime-50",
        ];
        return colors[index % colors.length];
    };

    const getLoadFactorStatus = (): { color: string; message: string } => {
        const loadFactor = visualizationData.stats.loadFactor;
        if (loadFactor < 0.5) return { color: "bg-green-500", message: "Good" };
        if (loadFactor < 0.7)
            return { color: "bg-yellow-500", message: "Okay" };
        return { color: "bg-red-500", message: "High" };
    };

    const loadFactorStatus = getLoadFactorStatus();

    return (
        // Use a slightly lighter background for the whole container if desired
        <div className="flex flex-col items-center max-w-5xl mx-auto my-10 p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Interactive HashTable
            </h2>

            {/* Controls Section - Improved Layout & Styling */}
            <div className="w-full mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input & Actions */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={keyInput}
                                onChange={handleKeyInputChange}
                                placeholder="Enter key"
                                className="border border-slate-300 rounded-md flex-1 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-150 ease-in-out"
                            />
                            <input
                                type="text"
                                value={valueInput}
                                onChange={handleValueInputChange}
                                placeholder="Enter value (for Set)"
                                className="border border-slate-300 rounded-md flex-1 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-150 ease-in-out"
                            />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {/* Consistent Button Styling */}
                            <button
                                onClick={handleSet}
                                className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-md font-medium transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                            >
                                Set
                            </button>
                            <button
                                onClick={handleGet}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-md font-medium transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                            >
                                Get
                            </button>
                            <button
                                onClick={handleRemove}
                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-md font-medium transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                            >
                                Remove
                            </button>
                            <button
                                onClick={handleClear}
                                className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-md font-medium transition duration-150 ease-in-out shadow-sm hover:shadow-md"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Size & Load Factor */}
                    <div className="space-y-4">
                        <div>
                            <label className="block font-medium text-slate-700 mb-2">
                                Table Size:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[4, 8, 16, 32].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => handleResize(size)}
                                        className={`px-4 py-1 rounded-md border transition duration-150 ease-in-out ${
                                            tableSize === size
                                                ? "bg-indigo-600 text-white font-semibold border-indigo-700 shadow-md"
                                                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Improved Load Factor Display */}
                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Load Factor:
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`${loadFactorStatus.color} h-2.5 rounded-full transition-all duration-300 ease-in-out`}
                                        style={{
                                            width: `${Math.min(
                                                visualizationData.stats
                                                    .loadFactor * 100,
                                                100
                                            )}%`,
                                        }}
                                    ></div>
                                </div>
                                <div className="text-sm font-medium text-slate-800 w-28 text-right">
                                    {(
                                        visualizationData.stats.loadFactor * 100
                                    ).toFixed(0)}
                                    %
                                    <span
                                        className={`ml-1 text-xs font-normal ${loadFactorStatus.color.replace(
                                            "bg-",
                                            "text-"
                                        )}`}
                                    >
                                        ({loadFactorStatus.message})
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Section - Slightly Enhanced */}
            {message && (
                <div className="w-full mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md shadow-sm">
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            {/* Hash Calculation Visualization - Improved Table Styling */}
            {hashCalculation.visible && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }} // Ensure margin collapses on exit
                    transition={{ duration: 0.3 }}
                    className="w-full mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm overflow-hidden" // Added overflow-hidden
                >
                    <h3 className="font-semibold text-slate-800 mb-3 text-lg">
                        Hash Calculation for:{" "}
                        <code className="bg-amber-100 px-2 py-0.5 rounded text-amber-800">
                            {hashCalculation.key}
                        </code>
                    </h3>

                    <div className="overflow-x-auto rounded">
                        {" "}
                        {/* Rounded corners for scroll container */}
                        <table className="min-w-full text-sm border border-amber-200">
                            <thead className="bg-amber-100">
                                <tr className="border-b border-amber-300">
                                    <th className="px-3 py-2 text-left font-medium text-amber-800">
                                        Char
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-amber-800">
                                        ASCII
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-amber-800">
                                        Pos
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-amber-800">
                                        Char * Pos
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium text-amber-800">
                                        Running Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {hashCalculation.steps.map((step, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-amber-100 last:border-b-0 hover:bg-amber-50 transition duration-100"
                                    >
                                        <td className="px-3 py-2 font-mono text-center">
                                            {step.char}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {step.code}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {step.position}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {step.code * step.position}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium">
                                            {step.subtotal}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary below table */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="font-medium text-slate-700">
                            Total Hash:
                        </span>
                        <code className="font-mono text-slate-800">
                            {hashCalculation.rawHash}
                        </code>
                        <span className="font-medium text-slate-700">
                            Table Size:
                        </span>
                        <code className="font-mono text-slate-800">
                            {tableSize}
                        </code>
                        <span className="font-medium text-slate-700">
                            Bucket Index:
                        </span>
                        <code className="font-mono text-slate-800">
                            {hashCalculation.rawHash} % {tableSize} =
                        </code>
                        <span className="font-bold text-lg bg-amber-200 text-amber-900 px-2 py-1 rounded">
                            {hashCalculation.finalHash}
                        </span>
                    </div>
                </motion.div>
            )}

            {/* HashTable Visualization - Refined Bucket/Node Styling */}
            <div className="w-full border border-slate-300 rounded-lg overflow-hidden shadow-md">
                {visualizationData.buckets.map((bucket) => (
                    <motion.div
                        key={bucket.index}
                        className="border-b border-slate-200 last:border-b-0" // Consistent border
                        // Animate background color smoothly
                        animate={{
                            // Use the base color function, apply animating color temporarily
                            backgroundColor:
                                animatingBucket === bucket.index
                                    ? [
                                          "#FFFBEB",
                                          getBucketColor(bucket.index).replace(
                                              "bg-",
                                              ""
                                          ),
                                      ] // Flash yellow then back to base
                                    : getBucketColor(bucket.index).replace(
                                          "bg-",
                                          ""
                                      ), // Base color (needs hex/rgb) - Simplified for now
                        }}
                        // Apply base color directly for non-animated state
                        style={{
                            backgroundColor: getBucketColor(
                                bucket.index
                            ).replace("bg-", ""),
                        }}
                        transition={{ duration: 1.5, times: [0, 0.2, 1] }} // Adjust timing
                    >
                        <div
                            className={`flex min-h-[72px] ${getBucketColor(
                                bucket.index
                            )}`}
                        >
                            {" "}
                            {/* Use class for base color */}
                            {/* Bucket Index Styling */}
                            <div className="w-16 flex items-center justify-center bg-slate-100 font-mono font-bold text-slate-700 p-2 border-r border-slate-200 text-lg">
                                {bucket.index}
                            </div>
                            {/* Bucket Content Area */}
                            <div className="flex-1 p-3 flex items-center">
                                {bucket.nodes.length === 0 ? (
                                    <div className="text-slate-400 italic text-sm w-full text-center">
                                        Empty
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {/* Node Styling & Animation */}
                                        {bucket.nodes.map((node, idx) => (
                                            <motion.div
                                                key={`${node.key}-${idx}`} // Ensure key uniqueness if keys can be duplicated (though unlikely in standard hashmap vis)
                                                layout // Animate layout changes smoothly
                                                initial={{
                                                    scale: 0.8,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                    // More pronounced highlight animation
                                                    boxShadow: node.highlight
                                                        ? [
                                                              "0px 0px 0px rgba(0,0,0,0)",
                                                              "0px 0px 12px 3px rgba(250, 204, 21, 0.9)",
                                                              "0px 0px 0px rgba(0,0,0,0)",
                                                          ]
                                                        : "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", // Tailwind shadow-sm equivalent
                                                }}
                                                transition={{
                                                    duration: 0.3,
                                                    boxShadow: {
                                                        duration: 1.2,
                                                        repeat: node.highlight
                                                            ? 1
                                                            : 0,
                                                    }, // Repeat highlight flash once
                                                }}
                                                className={`border rounded-lg shadow-sm p-2.5 ${
                                                    node.highlight
                                                        ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300"
                                                        : "bg-white border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 ease-in-out"
                                                }`}
                                            >
                                                <div className="text-sm font-semibold text-slate-800 break-all">
                                                    {node.key}
                                                </div>
                                                <div className="text-xs text-slate-600 break-all">
                                                    {node.value}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Statistics - Enhanced Boxes */}
            <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">
                        Total Items
                    </div>
                    <div className="text-2xl font-semibold text-slate-800">
                        {visualizationData.stats.totalItems}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">
                        Load Factor
                    </div>
                    <div className="text-2xl font-semibold text-slate-800">
                        {visualizationData.stats.loadFactor.toFixed(2)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">
                        Collisions
                    </div>
                    <div className="text-2xl font-semibold text-slate-800">
                        {visualizationData.stats.collisions}
                    </div>
                </div>
            </div>

            {/* Educational Information - Slightly Improved Readability */}
            <div className="mt-10 pt-6 border-t border-slate-200 text-slate-700 w-full text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-base text-slate-800 mb-3">
                            How the HashTable Works:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                Keys are processed by a hash function to find a
                                bucket index.
                            </li>
                            <li>
                                The hash function uses character codes and
                                positions.
                            </li>
                            <li>
                                Modulo (%) operation maps the hash value to the
                                table size.
                            </li>
                            <li>
                                Collisions occur when multiple keys map to the
                                same bucket.
                            </li>
                            <li>
                                This visualization uses 'chaining': nodes in the
                                same bucket form a list.
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p className="font-semibold text-base text-slate-800 mb-3">
                            Performance Notes:
                        </p>
                        <ul className="list-disc space-y-1.5 pl-5">
                            <li>
                                Avg. Time (Set/Get/Remove): O(1) - Constant
                                time.
                            </li>
                            <li>
                                Worst Case (many collisions): O(n) - Linear
                                time.
                            </li>
                            <li>
                                Load Factor (Items / Buckets) impacts speed.
                                Lower is generally faster.
                            </li>
                            <li>
                                Keep Load Factor below ~0.7 for good
                                performance.
                            </li>
                            <li>
                                Resizing redistributes items to maintain
                                efficiency.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HashTableComponent;
