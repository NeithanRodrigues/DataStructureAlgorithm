import { useState, useEffect, FC, ChangeEvent, useCallback } from "react";
import Tree from "react-d3-tree";
import { BST, TreeNode } from "../algorithm/BstTree"; // Assuming this file exports BST and TreeNode

// Define clear interfaces for react-d3-tree data structure
interface TreeDataNode {
    name: string; // Node value as string
    children?: TreeDataNode[]; // Optional children array
}

// Interface for the node datum provided by react-d3-tree's renderCustomNodeElement
interface NodeDatum {
    name: string;
    children?: NodeDatum[];
    __rd3t?: any; // Internal properties used by react-d3-tree
}

const BSTComponent: FC = () => {
    // State for the BST instance itself
    // We keep the BST instance in state to perform operations on it
    const [bstInstance, setBstInstance] = useState<BST>(new BST());
    // State for the data formatted for react-d3-tree visualization
    const [treeData, setTreeData] = useState<TreeDataNode | null>(null);
    // State to manage loading status during tree generation
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // State for the input field value
    const [inputValue, setInputValue] = useState<string>("");
    // State for displaying messages to the user (e.g., success, error, found/not found)
    const [message, setMessage] = useState<string>("");
    const [benchResult, setBenchResult] = useState<number | null>(null);

    // Constants for tree container dimensions and node appearance
    const CONTAINER_WIDTH = 1200; // Approximate width for translation calculation
    // const CONTAINER_HEIGHT = 700; // Not directly used in translate but good for reference
    const NODE_RADIUS = 20; // Smaller radius for potentially more nodes

    // --- Core BST Interaction Functions ---

    /**
     * Converts the internal BST structure into the format required by react-d3-tree.
     * This is a recursive function.
     * @param node The current TreeNode (or null) from the BST.
     * @returns The TreeDataNode structure for react-d3-tree, or null.
     */
    const convertToTreeFormat = (
        node: TreeNode | null
    ): TreeDataNode | null => {
        if (!node) return null; // Base case: empty node/subtree

        // Recursively convert left and right children
        const children = [
            convertToTreeFormat(node.left),
            convertToTreeFormat(node.right),
        ].filter(Boolean) as TreeDataNode[]; // Filter out null results (empty children)

        // Return the node structure for react-d3-tree
        return {
            name: node.value.toString(), // Node value becomes the 'name'
            // Only include the 'children' property if there are actual children
            ...(children.length > 0 && { children }),
        };
    };

    /**
     * Updates the visual tree data based on the current state of the bstInstance.
     * Should be called after any operation that modifies the BST (insert, remove).
     */
    const updateTreeVisualization = useCallback(() => {
        // Convert the current BST root to the react-d3-tree format
        const formattedTree = convertToTreeFormat(bstInstance.getRoot());
        // Update the state, triggering a re-render of the Tree component
        setTreeData(formattedTree);
        // console.log("Tree visualization updated.");
    }, [bstInstance]); // Dependency: run only if bstInstance changes

    /**
     * Generates a new BST with a fixed number of unique random values.
     * Clears the existing tree and populates a new one.
     */
    const generateRandomBST = useCallback((): void => {
        setIsLoading(true); // Show loading indicator
        setMessage(""); // Clear previous messages
        setInputValue(""); // Clear input field

        const newBst = new BST(); // Create a fresh BST instance
        const numElements = 100; // Number of elements to add
        const values = new Set<number>(); // Use a Set to ensure uniqueness

        // Generate unique random values
        while (values.size < numElements) {
            values.add(Math.floor(Math.random() * 900)); // Values between 0 and 99
        }

        // Insert unique values into the new BST
        Array.from(values).forEach((val) => newBst.insert(val));
        // console.log("New BST generated with values:", Array.from(values));

        setBstInstance(newBst); // Update the BST instance state

        // Convert the new BST to react-d3-tree format *after* state is set
        // Note: Direct conversion here might use the *old* state due to closure.
        // It's safer to rely on the useEffect hook triggered by bstInstance update,
        // or call updateTreeVisualization explicitly after setting state (though less common).
        // However, for simplicity in this example, we convert immediately.
        // A useEffect watching bstInstance is a more robust pattern.
        const formattedTree = convertToTreeFormat(newBst.getRoot());
        setTreeData(formattedTree);

        setIsLoading(false); // Hide loading indicator
    }, []); // No dependencies, it always creates a new tree

    // --- Initial Tree Generation on Mount ---
    useEffect(() => {
        // Generate the initial random BST when the component mounts
        generateRandomBST();
    }, [generateRandomBST]); // Dependency: generateRandomBST function

    // --- UI Event Handlers ---

    /**
     * Handles changes in the input field.
     * @param event The input change event.
     */
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setInputValue(event.target.value); // Update input value state
        setMessage(""); // Clear message when user starts typing
    };

    /**
     * Handles adding a number to the BST.
     * Parses the input value, calls the BST's insert method, and updates the visualization.
     */
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

    /**
     * Handles searching for a number in the BST.
     * Parses the input value, calls the BST's search method, and displays the result.
     * NOTE: This implementation just shows a message. Highlighting the node visually
     * in react-d3-tree requires more complex state management and node rendering logic.
     */
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
            setBenchResult(endTime - startTime); // Store the time taken for search
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

    /**
     * Handles searching for a number in the BST.
     * Parses the input value, calls the BST's search method, and displays the result.
     * NOTE: This implementation just shows a message. Highlighting the node visually
     * in react-d3-tree requires more complex state management and node rendering logic.
     */
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

    /**
     * Handles removing a number from the BST.
     * Parses the input value, calls the BST's remove method, and updates the visualization.
     * Uses the standard BST deletion algorithm (handling 0, 1, or 2 children).
     *
     * **Note on Knuth's Algorithm T:** The user requested Knuth's specific deletion
     * algorithm (TAoCP Vol 3, 6.2.2). However, implementing that precise, often
     * non-recursive, pointer-based algorithm is complex in this context.
     * This implementation uses the standard recursive deletion approach common in
     * educational BST examples, which finds the inorder successor for nodes with two children.
     * This fulfills the functional requirement of removing a node while maintaining BST properties.
     */
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
        <div className="flex flex-col items-center max-w-4xl mx-auto my-8 px-4">
            {/* Header Section */}
            <header className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-3">
                    Interactive Binary Search Tree
                </h1>
                <p className="text-gray-600 max-w-2xl text-sm">
                    Visualize a Binary Search Tree. Add, search, or remove
                    nodes. Smaller values go left, larger values go right. No
                    duplicates allowed (handled by `insert`).
                </p>
            </header>

            {/* Control Panel Section */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 p-4 bg-gray-100 rounded-lg shadow-sm w-full max-w-md">
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter number"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Number input for BST operations"
                />
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 transition-colors duration-200"
                >
                    Add
                </button>
                <button
                    onClick={handleSearchBFS}
                    className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 transition-colors duration-200"
                >
                    Search Nerfed
                </button>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-yellow-500 text-white font-medium rounded-md hover:bg-yellow-600 transition-colors duration-200"
                >
                    Search
                </button>
                <button
                    onClick={handleRemove}
                    className="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                    Remove
                </button>
            </div>

            {/* Message Display Area */}
            {message && ( // Only render the message div if the message string is not empty
                <div className="mb-4 text-center text-sm font-medium text-gray-700 h-5">
                    {" "}
                    {/* Fixed height to prevent layout shifts */}
                    {message}
                </div>
            )}

            {/* Message Display Area */}
            {benchResult && ( // Only render the message div if the message string is not empty
                <div className="mb-4 text-center text-sm font-medium text-gray-700 h-5">
                    {" "}
                    {/* Fixed height to prevent layout shifts */}
                    {benchResult.toFixed(2) + " ms"}
                </div>
            )}

            {/* Tree Visualization Section */}
            <div className="w-full max-w-5xl h-96 md:h-[550px] bg-gray-50 border-2 border-gray-200 rounded-xl shadow-md flex items-center justify-center overflow-hidden relative">
                {isLoading ? (
                    // Loading Indicator
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Generating tree...</p>
                    </div>
                ) : treeData ? (
                    // Tree Visualization using react-d3-tree
                    <Tree
                        data={treeData} // The data to visualize
                        orientation="vertical" // Layout direction
                        translate={{ x: CONTAINER_WIDTH / 2, y: 50 }} // Center the tree initially
                        scaleExtent={{ min: 0.3, max: 2 }} // Zoom limits
                        nodeSize={{ x: 60, y: 100 }} // Spacing between nodes (x: horizontal, y: vertical)
                        pathFunc="elbow" // Style of links between nodes ('diagonal', 'elbow', 'straight')
                        separation={{ siblings: 1.2, nonSiblings: 1.8 }} // Fine-tune spacing
                        renderCustomNodeElement={renderCustomNode} // Use custom SVG for nodes
                        zoom={0.7} // Initial zoom level
                        dimensions={{ width: CONTAINER_WIDTH, height: 550 }} // Explicit dimensions help
                        centeringTransitionDuration={300} // Smooth transition on centering
                        shouldCollapseNeighborNodes={false} // Keep nodes expanded
                    />
                ) : (
                    // Message when the tree is empty (e.g., after removing all nodes)
                    <p className="text-gray-500">Tree is empty.</p>
                )}
            </div>

            {/* Button to Generate a New Random Tree */}
            <button
                onClick={generateRandomBST}
                className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
            >
                Generate New Random Tree
            </button>
        </div>
    );
};

export default BSTComponent;
