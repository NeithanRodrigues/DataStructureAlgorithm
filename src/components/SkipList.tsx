import React, { useState, useEffect } from "react";
import { SkipList } from "../algorithm/SkipList";
import { motion, AnimatePresence } from "framer-motion";

const SkipListComponent: React.FC = () => {
    const [list] = useState(new SkipList<number>(4));
    const [inputValue, setInputValue] = useState<string>("");
    const [searchResult, setSearchResult] = useState<string>("");
    const [benchmark, setBenchmark] = useState<string>("");
    const [benchmarkLinear, setBenchmarkLinear] = useState<string>("");
    const [elements, setElements] = useState<{ value: number; level: number }[]>([]);

    const exportToJson = () => {
        const jsonData = JSON.stringify({
            totalElements: elements.length, // Apenas o número total de elementos
            searchResult,
            benchmark,
            benchmarkLinear: benchmarkLinear ? benchmarkLinear : "Not tested"
        }, null, 2); // Formata o JSON com indentação de 2 espaços para melhor legibilidade

        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "skip_list_data.json";
        a.click();

        URL.revokeObjectURL(url);
    };

    const exportCsv = () => {
        const csvRows = [
            ["Total Elements", "Search Result", "Time (Skip List)", "Time (Linear Search)"],
            [elements.length, searchResult || "N/A", benchmark || "N/A", benchmarkLinear || "N/A"]
        ];

        const csvContent = csvRows
            .map(row => row.map(value => `"${value}"`).join(";")) // Separador `;` ao invés de `,`
            .join("\r\n"); // Usa `\r\n` para compatibilidade com Windows e Excel

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "skip_list_data.csv";
        a.click();

        URL.revokeObjectURL(url);
    };

    const updateElements = () => {
        const values = list.getValues().map(value => ({
            value,
            level: list.getLevels(value)
        }));
        setElements(values);
    };

    const generateRandomList = () => {
        list.clear();
        const uniqueNumbers = new Set<number>();
        while (uniqueNumbers.size < 100) {
            const randomNum = Math.floor(Math.random() * 10000);
            uniqueNumbers.add(randomNum);
        }
        uniqueNumbers.forEach(num => list.insert(num));
        updateElements();
        setSearchResult("");
        setBenchmark("");
        setBenchmarkLinear("");
    };

    // 🚀 Apenas limpa a lista, sem gerar novos números
    const clearList = () => {
        list.clear();
        updateElements();
        setSearchResult("");
        setBenchmark("");
        setBenchmarkLinear("");
    };

    useEffect(() => {
        generateRandomList();
    }, []);

    const handleInsert = () => {
        if (!inputValue) return;
        list.insert(parseInt(inputValue));
        updateElements();
        setInputValue("");
    };

    const handleSearch = () => {
        const num = parseInt(inputValue);
        const startTime = performance.now();
        const found = list.search(num);
        const endTime = performance.now();
        setSearchResult(found ? `Founded: ${num}` : "Not founded");
        setBenchmark(`Time of Skip List: ${(endTime - startTime).toFixed(2)} ms`);
    };

    // 🚨 Busca Linear (ineficiente)
    const handleLinearSearch = () => {
        const num = parseInt(inputValue);
        const startTime = performance.now();
        const found = list.linearSearch(num);
        const endTime = performance.now();
        setSearchResult(found ? `Founded: ${num}` : "Not Founded");
        setBenchmarkLinear(`Time of Linear Search: ${(endTime - startTime).toFixed(2)} ms`);
    };

    return (
        <div>
            <div className="p-4 w-192 mx-auto mt-15">
                <h1 className="font-bold text-4xl">Skip List</h1>
                <p className="mt-5">A Skip List is a data structure based on linked lists that enables efficient search, insertion, and deletion, serving as an alternative to balanced trees. It uses multiple levels of ordered lists where higher levels "skip" over nodes to speed up searches. The average time complexity for operations is O(log n), making it an efficient choice for dynamic ordered data storage.
                </p>
                <br />
                <p>
                    In this demo, you can test both an unoptimized search (linear search) and an optimized search using Skip List, allowing you to compare their performance.
                </p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg shadow-lg w-192 mx-auto mt-5 mb-5">
                <div className="flex gap-2 mb-3">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border border-gray-300 p-2 w-full "
                        placeholder="Digite um número"
                    />
                    <button onClick={handleInsert} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Inserir
                    </button>
                </div>
                <div className="flex gap-2 mb-3">
                    <button onClick={handleSearch} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Skip List Search
                    </button>
                    <button onClick={handleLinearSearch} className="bg-[#02001f] text-white px-3 py-1 rounded border hover:bg-white hover:text-black">
                        Linear Search
                    </button>

                </div>
                <div className="mb-3 flex gap-2 items-center">
                    <strong>Result:</strong> {searchResult}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={clearList} className="text-white w-10 h-10 px-3 py-1 rounded">
                            <img src="src/assets/delete.png" />
                        </button>
                        <button onClick={generateRandomList} className="text-white w-10 h-10 px-3 py-1 rounded">
                            <img src="src/assets/refresh.png" />
                        </button>
                    </div>
                </div>
                <div className="mb-3">
                    <strong>{benchmark}</strong>
                </div>
                <div className="mb-3 text-red-600">
                    <strong>{benchmarkLinear}</strong>
                </div>
                <div className="border border-gray-300 p-3 rounded bg-gray-200 overflow-x-auto">
                    <strong>Skip List Structure:</strong>
                    <div className="mt-2 space-y-2">
                        {Array.from({ length: list.getMaxLevel() }, (_, level) => (
                            <div key={level} className="flex gap-2 items-center">
                                <span className="text-sm whitespace-nowrap font-bold">
                                    Level {list.getMaxLevel() - level}:
                                </span>
                                <AnimatePresence>
                                    {elements
                                        .filter(el => el.level >= list.getMaxLevel() - level)
                                        .map((el, index, arr) => (
                                            <div className="flex items-center" key={el.value}>
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="bg-blue-200 px-3 py-1 rounded shadow"
                                                >
                                                    {el.value}
                                                </motion.div>
                                                {index < arr.length - 1 && (
                                                    <span className="mx-2 text-xl">→</span>
                                                )}
                                            </div>
                                        ))}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex gap-4 justify-end">
                    <button onClick={exportToJson} className="bg-[#02001f] text-white px-3 py-1 border-1 rounded hover:bg-white hover:text-black">
                        Export JSON
                    </button>
                    <button onClick={exportCsv} className="bg-[#02001f] text-white px-3 py-1 border-1 rounded hover:bg-white hover:text-black">
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkipListComponent;
