import { useState, useEffect, FC, ChangeEvent, useCallback } from "react";
import Tree from "react-d3-tree";
import { BST, TreeNode } from "../algorithm/BstTree";
import { motion } from "framer-motion";

interface TreeDataNode {
    name: string;
    children?: TreeDataNode[];
    highlight?: boolean;
}

interface NodeDatum {
    name: string;
    children?: NodeDatum[];
    highlight?: boolean;
    __rd3t?: any;
}

const BSTComponent: FC = () => {
    const [bstInstance, setBstInstance] = useState<BST>(new BST());
    const [treeData, setTreeData] = useState<TreeDataNode | null>(null);
    const [inputValue, setInputValue] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [highlightedNode, setHighlightedNode] = useState<number | null>(null);

    const NODE_RADIUS = 20;

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
    
        const jsonBlob = new Blob([JSON.stringify(searchResult, null, 2)], { type: "application/json" });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(jsonBlob);
        downloadLink.download = `search_result_${value}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    
        setMessage(`Search result exported for number ${value}.`);
    };
    
    const exportToCsv = (value: number, found: boolean): void => {
        const csvContent = `Searched Value,Found\n${value},${found ? "Yes" : "No"}`;
    
        const csvBlob = new Blob([csvContent], { type: "text/csv" });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(csvBlob);
        downloadLink.download = `search_result_${value}.csv`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    
        setMessage(`Search result exported for number ${value}.`);
    };

    const convertToTreeFormat = (node: TreeNode | null): TreeDataNode | null => {
        if (!node) return null;

        const children = [
            convertToTreeFormat(node.left),
            convertToTreeFormat(node.right),
        ].filter(Boolean) as TreeDataNode[];

        return {
            name: node.value.toString(),
            children: children.length > 0 ? children : undefined,
            highlight: node.value === highlightedNode,
        };
    };

    const updateTreeVisualization = useCallback(() => {
        const formattedTree = convertToTreeFormat(bstInstance.getRoot());
        setTreeData(formattedTree);
    }, [bstInstance, highlightedNode]);

    useEffect(() => {
        updateTreeVisualization();
    }, [updateTreeVisualization]);

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setInputValue(event.target.value);
        setMessage("");
    };

    const handleAdd = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number.");
            return;
        }
        bstInstance.insert(value);
        setMessage(`Number ${value} added successfully.`);
        setHighlightedNode(value);
        setInputValue("");
        updateTreeVisualization();
        setTimeout(() => setHighlightedNode(null), 2000);
    };

    const handleSearch = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number to search.");
            return;
        }
        const foundNode = bstInstance.search(value);
        if (foundNode) {
            setMessage(`Number ${value} found.`);
            setHighlightedNode(value);
            setTimeout(() => setHighlightedNode(null), 2000);
        } else {
            setMessage(`Number ${value} not found.`);
        }
        setInputValue("");
    };

    const handleRemove = (): void => {
        const value = parseInt(inputValue, 10);
        if (isNaN(value)) {
            setMessage("Please enter a valid number to remove.");
            return;
        }
        bstInstance.remove(value);
        setMessage(`Number ${value} removed.`);
        setHighlightedNode(value);
        setInputValue("");
        updateTreeVisualization();
        setTimeout(() => setHighlightedNode(null), 2000);
    };

    const renderCustomNode = ({ nodeDatum }: { nodeDatum: NodeDatum }) => (
        <motion.g
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <circle
                r={NODE_RADIUS}
                fill={nodeDatum.highlight ? "#FBBF24" : "#60A5FA"}
                stroke="#2563EB"
                strokeWidth="1"
            />
            <text
                fill="#1E3A8A"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dy=".3em"
            >
                {nodeDatum.name}
            </text>
        </motion.g>
    );

    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto my-8 px-4">
            <div className="mb-6 flex space-x-2">
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter number"
                    className="border rounded px-3 py-2"
                />
                <button onClick={handleAdd} className="bg-green-500 text-white px-4 py-2 rounded">Add</button>
                <button onClick={handleSearch} className="bg-yellow-500 text-white px-4 py-2 rounded">Search</button>
                <button onClick={handleRemove} className="bg-red-500 text-white px-4 py-2 rounded">Remove</button>
                <button onClick={exportToJson} className="bg-yellow-500 text-white px-4 py-2 rounded">
                    JSON
                </button>
                <button onClick={() => exportToCsv(parseInt(inputValue, 10), !!bstInstance.search(parseInt(inputValue, 10)))}
                    className="bg-blue-500 text-white px-4 py-2 rounded">
                    Export to CSV
                </button>

            </div>
            {message && <p className="mb-4 text-sm text-gray-700">{message}</p>}
            <div style={{ width: "100%", height: "500px" }}>
                {treeData && (
                    <Tree data={treeData} renderCustomNodeElement={renderCustomNode} />
                )}
            </div>
        </div>
    );
};

export default BSTComponent;
