import { useState, useEffect, FC, ChangeEvent, useCallback } from "react";
import Tree from "react-d3-tree";
import { BST, TreeNode } from "../algorithm/BstTree";

interface TreeDataNode {
    name: string;
    children?: TreeDataNode[];
}

interface NodeDatum {
    name: string;
    children?: NodeDatum[];
    __rd3t?: any;
}

const NODE_RADIUS = 20;
const MIN_NODES = 20;

const BSTComponent: FC = () => {
    const [bstInstance, setBstInstance] = useState<BST>(new BST());
    const [treeData, setTreeData] = useState<TreeDataNode | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [inputValue, setInputValue] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [benchResult, setBenchResult] = useState<number | null>(null);
    const CONTAINER_WIDTH = 1200; // Approximate width for translation calculation
    const NODE_RADIUS = 20; // Smaller radius for potentially more nodes


    /**
     * Converts the internal BST structure into the format required by react-d3-tree.
     * This is a recursive function.
     * @param node The current TreeNode (or null) from the BST.
     * @returns The TreeDataNode structure for react-d3-tree, or null.
     */
    const convertToTreeFormat = (
        node: TreeNode | null
    ): TreeDataNode | null => {
        if (!node) return null;

        const children = [
            convertToTreeFormat(node.left),
            convertToTreeFormat(node.right),
        ].filter(Boolean) as TreeDataNode[];

        return {
            name: node.value.toString(), // Node value becomes the 'name'
            ...(children.length > 0 && { children }),
        };
    };

    const updateTreeVisualization = useCallback(() => {
        // Convert the current BST root to the react-d3-tree format
        const formattedTree = convertToTreeFormat(bstInstance.getRoot());
        // Update the state, triggering a re-render of the Tree component
        setTreeData(formattedTree);
        // console.log("Tree visualization updated.");
    }, [bstInstance]); // Dependency: run only if bstInstance changes

    const generateRandomBST = useCallback((): void => {
        setIsLoading(true);
        setMessage("");
        setInputValue("");

        const newBst = new BST();
        const numElements = 100;
        const values = new Set<number>();

        while (values.size < numElements) {
            values.add(Math.floor(Math.random() * 900));
        }

        Array.from(values).forEach((val) => newBst.insert(val));

        setBstInstance(newBst);

        const formattedTree = convertToTreeFormat(newBst.getRoot());
        setTreeData(formattedTree);

        setIsLoading(false); // Hide loading indicator
    }, []); // No dependencies, it always creates a new tree

    useEffect(() => {
        generateRandomBST();
    }, [generateRandomBST]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setInputValue(event.target.value); // Update input value state
        setMessage(""); // Clear message when user starts typing
    };

    const exportToJson = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number to search.");
            return;
        }

        const foundNode = bstInstance.search(value);
        const searchResult = {
            searchedValue: value,
            found: !!foundNode,
        };

        const jsonBlob = new Blob([JSON.stringify(searchResult, null, 2)], {
            type: "application/json",
        });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(jsonBlob);
        downloadLink.download = `search_result_${value}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setMessage(`Search result exported for number ${value}.`);
    };

    const exportToCsv = (value: number, found: boolean): void => {
        const csvContent = `Searched Value,Found\n${value},${found ? "Yes" : "No"
            }`;

        const csvBlob = new Blob([csvContent], { type: "text/csv" });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(csvBlob);
        downloadLink.download = `search_result_${value}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setMessage(`Search result exported for number ${value}.`);
    };

    const handleAdd = (): void => {
        const value = parseInt(inputValue, 10); // Parse input string to integer (base 10)
        if (isNaN(value)) {
            // Check if parsing failed
            setMessage("Please enter a valid number.");
            return;
        }

        try {
            bstInstance.insert(value); // Insert the value into the BST instance
            updateTreeVisualization(); // Update the visual representation
            setMessage(`Number ${value} added successfully.`);
            setInputValue(""); // Clear the input field
        } catch (error) {
            // Handle potential errors from the insert method (e.g., duplicate if not allowed)
            setMessage(
                error instanceof Error ? error.message : "Failed to add number."
            );
            console.error("Add error:", error);
        }
    };

    const handleSearch = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number to search.");
            return;
        }

        try {
            // Assume bstInstance.search returns the node if found, or null otherwise
            const startTime = performance.now();
            const foundNode = bstInstance.search(value);
            const endTime = performance.now();

            setBenchResult(endTime - startTime);
            if (foundNode) {
                setMessage(`Number ${value} found in the tree.`);
                // Future enhancement: Add logic here to highlight the found node visually.
            } else {
                setMessage(`Number ${value} not found in the tree.`);
            }
            setInputValue(""); // Clear input after search
        } catch (error) {
            setMessage("An error occurred during search.");
            console.error("Search error:", error);
        }
    };

    const handleSearchBFS = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number to search.");
            return;
        }

        try {
            // Assume bstInstance.search returns the node if found, or null otherwise
            const startTime = performance.now();
            const foundNode = bstInstance.searchBFS(value);
            const endTime = performance.now();

            setBenchResult(endTime - startTime);

            if (foundNode) {
                setMessage(`Number ${value} found in the tree.`);
                // Future enhancement: Add logic here to highlight the found node visually.
            } else {
                setMessage(`Number ${value} not found in the tree.`);
            }
            setInputValue(""); // Clear input after search
        } catch (error) {
            setMessage("An error occurred during search.");
            console.error("Search error:", error);
        }
    };

    const handleRemove = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number to remove.");
            return;
        }

        try {
            // We need to know if the remove operation actually did something.
            // A simple way is to search first, though the remove method itself might indicate success/failure.
            // Assuming bstInstance.remove handles the "not found" case gracefully internally.
            const nodeExists = bstInstance.search(value); // Check if node exists before attempting removal

            bstInstance.remove(value); // Attempt to remove the value from the BST instance
            updateTreeVisualization(); // Update the visual representation regardless

            if (nodeExists) {
                setMessage(`Number ${value} removed successfully.`);
            } else {
                setMessage(`Number ${value} was not found in the tree.`);
            }
            setInputValue(""); // Clear the input field
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to remove number."
            );
            console.error("Remove error:", error);
        }
    };

    // --- Custom Node Rendering for react-d3-tree ---
    /**
     * Renders a custom SVG structure for each node in the tree.
     * @param nodeDatum The data object for the node provided by react-d3-tree.
     * @returns A JSX element representing the node visually (SVG group).
     */
    const renderCustomNode = ({ nodeDatum }: { nodeDatum: NodeDatum }) => (
        <g>
            {/* Circle representing the node */}
            <circle
                r={NODE_RADIUS}
                fill="#60A5FA" // Tailwind blue-400
                stroke="#2563EB" // Tailwind blue-600
                strokeWidth="1"
            />
            {/* Text displaying the node's value */}
            <text
                fill="#1E3A8A" // Tailwind blue-900
                fontSize="12" // Slightly smaller font for smaller radius
                fontWeight="bold"
                textAnchor="middle" // Center text horizontally
                strokeWidth={0.5} // Thinner stroke for text
                dy=".3em" // Center text vertically
            >
                {nodeDatum.name}
            </text>
        </g>
    );

    // --- Component Return JSX ---
    return (
        <div>
            <div className="p-4 w-192 mx-auto mt-15">
                <h1 className="font-bold text-4xl">Binary Search Tree</h1>
                <p className="mt-5">
                    A Binary Search Tree (BST) is a node-based binary tree data structure where each node has a comparable key (and associated value) and satisfies the property that the key in each node is greater than the keys in its left subtree and less than the keys in its right subtree.
                </p>
                <br />
                <p>
                    In this demo, you can insert values, perform search operations, and compare time performance for different search strategies.
                </p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg shadow-lg w-192 mx-auto mt-5 mb-5">
                <div className="flex gap-2 mb-3">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={handleInputChange}
                        className="border border-gray-300 p-2 w-full"
                        placeholder="Digite um número"
                    />
                    <button onClick={handleAdd} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Insert
                    </button>
                </div>
                <div className="flex gap-2 mb-3">
                    <button onClick={handleSearch} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Search (DFS)
                    </button>
                    <button onClick={handleSearchBFS} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Search (BFS)
                    </button>
                    <button onClick={handleRemove} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Remove
                    </button>
                </div>
                <div className="mb-3 flex gap-2 items-center">
                    <strong>Result:</strong> {message}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={() => setTreeData(null)} className="text-white w-10 h-10 px-3 py-1 rounded">
                            <img src="src/assets/delete.png" />
                        </button>
                        <button onClick={generateRandomBST} className="text-white w-10 h-10 px-3 py-1 rounded">
                            <img src="src/assets/refresh.png" />
                        </button>
                    </div>
                </div>
                <div className="mb-3">
                    <strong>{benchResult !== null ? `Benchmark: ${benchResult.toFixed(2)} ms` : ""}</strong>
                </div>
                <div className="border border-gray-400 p-3 rounded bg-gray-200 overflow-x-auto">
                    <strong>BST Structure:</strong>
                    <div className="h-[600px] w-full">
                        {!isLoading && treeData && (
                            <Tree
                                data={[treeData]}
                                orientation="vertical"
                                translate={{ x: CONTAINER_WIDTH / 2, y: 50 }}
                                nodeSize={{ x: 100, y: 100 }}
                                zoomable={true}
                                separation={{ siblings: 1.5, nonSiblings: 2 }}
                                scaleExtent={{ min: 0.01, max: 10 }}
                            />
                        )}
                    </div>
                </div>
                <div className="mt-4 flex gap-4 justify-end">
                    <button
                        onClick={() => {
                            const value = parseInt(inputValue, 10);
                            if (!isNaN(value)) {
                                const found = !!bstInstance.search(value);
                                const searchResult = { searchedValue: value, found: !!found };

                                const jsonBlob = new Blob([JSON.stringify(searchResult, null, 2)], { type: "application/json" });
                                const downloadLink = document.createElement("a");
                                downloadLink.href = URL.createObjectURL(jsonBlob);
                                downloadLink.download = `search_result_${value}.json`;
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);

                                setMessage(`Search result exported for number ${value}.`);
                            } else {
                                setMessage("Please enter a valid number to export JSON.");
                            }
                        }}
                        className="bg-[#02001f] text-white px-3 py-1 border-1 rounded hover:bg-white hover:text-black"
                    >
                        Export JSON
                    </button>
                    <button
                        onClick={() => {
                            const value = parseInt(inputValue, 10);
                            if (!isNaN(value)) {
                                const found = !!bstInstance.search(value);
                                const csvContent = `Searched Value,Found\n${value},${found ? "Yes" : "No"}`;
                                const csvBlob = new Blob([csvContent], { type: "text/csv" });
                                const downloadLink = document.createElement("a");
                                downloadLink.href = URL.createObjectURL(csvBlob);
                                downloadLink.download = `search_result_${value}.csv`;
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);

                                setMessage(`Search result exported for number ${value}.`);
                            } else {
                                setMessage("Please enter a valid number to export CSV.");
                            }
                        }}
                        className="bg-[#02001f] text-white px-3 py-1 border rounded hover:bg-white hover:text-black"
                    >
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );


};

export default BSTComponent;
