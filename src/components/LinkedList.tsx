import React, { useState, useEffect } from "react";
import { LinkedListLogic } from "../algorithm/LinkedList";
import { motion, AnimatePresence } from "framer-motion";

const LinkedListComponent: React.FC = () => {
    const [list] = useState(new LinkedListLogic<number>());
    const [inputValue, setInputValue] = useState<string>("");
    const [searchResult, setSearchResult] = useState<string>("");
    const [elements, setElements] = useState<number[]>([]);
    const [benchmark, setBenchmark] = useState<string>("");

    const exportCsv = () => {
        const headers = "type,number,founded,time\n";

        const data = [
            ["Unoptimized", inputValue ? parseInt(inputValue) : "", searchResult.includes("Founded"), benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0],
            ["MTF", inputValue ? parseInt(inputValue) : "", searchResult.includes("Founded"), benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0],
            ["Transposicao", inputValue ? parseInt(inputValue) : "", searchResult.includes("Founded"), benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0]
        ];

        const csvContent = headers + data.map(row => row.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "search_results.csv";
        a.click();

        URL.revokeObjectURL(url);
    };

    const exportToJson = () => {
        const jsonData = {
            buscas: [
                {
                    type: "Unoptimized",
                    number: inputValue ? parseInt(inputValue) : null,
                    founded: searchResult.includes("Founded"),
                    time: benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0
                },
                {
                    type: "MTF",
                    number: inputValue ? parseInt(inputValue) : null,
                    founded: searchResult.includes("Founded"),
                    time: benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0
                },
                {
                    type: "Transpose",
                    number: inputValue ? parseInt(inputValue) : null,
                    founded: searchResult.includes("Founded"),
                    time: benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0
                }
            ]
        };

        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "search_results.json";
        a.click();

        URL.revokeObjectURL(url);
    };

    const updateElements = () => {
        const newElements: number[] = [];
        let current = list.getHead();
        while (current) {
            newElements.push(current.value);
            current = current.next;
        }
        setElements(newElements);
    };

    const generateRandomList = () => {
        list.clear(); // Limpa a lista antes de gerar nova
        const uniqueNumbers = new Set<number>();

        while (uniqueNumbers.size < 5) { // Garante que sejam gerados 12 números únicos
            const randomNum = Math.floor(Math.random() * 10000);
            uniqueNumbers.add(randomNum);
        }

        uniqueNumbers.forEach(num => list.insert(num));
        updateElements();
        setSearchResult("");
        setBenchmark("");
    };

    // Apaga a lista sem gerar novos números
    const handleClearList = () => {
        list.clear();
        setElements([]);
        setSearchResult("");
        setBenchmark("");
    };

    // Gera uma nova lista aleatória (apaga a anterior e cria outra)
    const handleGenerateNewList = () => {
        generateRandomList();
    };

    useEffect(() => {
        generateRandomList(); // Gera lista aleatória ao montar o componente
    }, []);

    // Adiciona um número à lista
    const handleInsert = () => {
        if (!inputValue) return;
        const num = parseInt(inputValue);
        list.insert(num);
        updateElements();
        setInputValue("");
    };

    // Busca desotimizada com benchmark
    const handleSearchUnoptimized = () => {
        const num = parseInt(inputValue);
        const startTime = performance.now();
        const result = list.searchUnoptimized(num);
        const endTime = performance.now();
        setSearchResult(result ? `Founded: ${result.value}` : "Not founded");
        setBenchmark(`Time: ${(endTime - startTime).toFixed(2)} ms`);
    };

    // Busca Move-To-Front (MTF) com benchmark
    const handleSearchMTF = () => {
        const num = parseInt(inputValue);
        const startTime = performance.now();
        const result = list.searchMoveToFront(num);
        const endTime = performance.now();
        if (result) updateElements();
        setSearchResult(result ? `Founded: ${result.value}` : "Not founded");
        setBenchmark(`Time: ${(endTime - startTime).toFixed(2)} ms`);
    };

    // Busca por transposição
    const handleSearchTranspose = () => {
        const num = parseInt(inputValue);
        const result = list.searchTranspose(num);
        if (result) updateElements();
        setSearchResult(result ? `Founded: ${result.value}` : "Not founded");
    };

    return (
        <div>
            <div className="p-4 w-192 mx-auto mt-10">
                <h1 className="font-bold text-4xl">Linked List</h1>
                <p className="mt-5">A linked list is a data structure where elements, called nodes, are connected using pointers. Each node consists of two main components: data, which holds the actual value, and a pointer, which references the next node in the sequence.
                </p>
                <br />
                <p>
                    This structure has several advantages, such as efficient insertions and deletions, and it does not require a contiguous block of memory. However, it also comes with some disadvantages, including the need for extra memory to store pointers and slower access time compared to arrays, since nodes must be traversed one by one to find a specific value.
                </p>

            </div>
            <div className="p-4 border rounded-lg shadow-lg w-192 mx-auto mt-5">
                <div className="flex mb-5 gap-2">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="border p-2 w-full"
                        placeholder="Insert a number"
                    />
                    <button onClick={handleInsert} className="bg-[#02001f] text-white px-3 py-1 rounded">Insert</button>
                </div>
                <div className="flex gap-2 mb-3">
                    <button onClick={handleSearchUnoptimized} className="bg-[#02001f] text-white px-3 py-1 rounded">Linear Search</button>
                    <button onClick={handleSearchMTF} className="bg-[#02001f] text-white px-3 py-1 rounded">Move-To-Front</button>
                    <button onClick={handleSearchTranspose} className="bg-[#02001f] text-white px-3 py-1 rounded">Transpose</button>
                </div>
                <div className="flex mb-3">
                    <strong>Result:</strong> {searchResult}
                    <div className="flex gap-2 ml-auto">
                        <button onClick={handleClearList} className="text-white px-3 py-1 rounded">
                            <img src="src/assets/delete.png" alt="trash" className="w-4 h-4" />
                        </button>
                        <button onClick={handleGenerateNewList} className="text-white px-3 py-1 rounded">
                            <img src="src/assets/refresh.png" alt="refresh" className="w-4 h-4" />
                        </button>

                    </div>
                </div>
                <div className="mb-3">
                    <strong>{benchmark}</strong>
                </div>
                <div className="border p-3 rounded bg-gray-200 overflow-x-auto whitespace-nowrap">
                    <strong>List:</strong>
                    <div className="flex gap-2 mt-2 items-center">
                        <AnimatePresence>
                            {elements.map((el, index) => (
                                <React.Fragment key={el}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-blue-200 px-3 py-1 rounded shadow"
                                    >
                                        {el}
                                    </motion.div>
                                    {index < elements.length - 1 && (
                                        <span className="text-lg">→</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex gap-2 mt-5 justify-end">
                    <button onClick={exportToJson} className="bg-[#02001f] text-white px-3 py-1 rounded border-1 hover:bg-white hover:text-black">
                        Export JSON
                    </button>
                    <button onClick={exportCsv} className="bg-[#02001f] text-white px-3 py-1 rounded border-1 hover:bg-white hover:text-black">
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkedListComponent;
