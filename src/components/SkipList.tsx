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
            benchmarkLinear: benchmarkLinear ? benchmarkLinear : "Não testado"
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
            ["Total de Elementos", "Resultado da Busca", "Tempo (Skip List)", "Tempo (Busca Linear)"],
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
        while (uniqueNumbers.size < 10000) {
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
        setSearchResult(found ? `Encontrado: ${num}` : "Não encontrado");
        setBenchmark(`Tempo (Skip List): ${(endTime - startTime).toFixed(2)} ms`);
    };

    // 🚨 Busca Linear (ineficiente)
    const handleLinearSearch = () => {
        const num = parseInt(inputValue);
        const startTime = performance.now();
        const found = list.linearSearch(num);
        const endTime = performance.now();
        setSearchResult(found ? `Encontrado: ${num}` : "Não encontrado");
        setBenchmarkLinear(`Tempo (Busca Linear): ${(endTime - startTime).toFixed(2)} ms`);
    };

    return (
        <div className="p-4 border rounded-lg shadow-lg w-192 mx-auto mt-5">
            <h2 className="text-lg font-bold mb-3">Skip List</h2>
            <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border p-2 w-full mb-3"
                placeholder="Digite um número"
            />
            <div className="flex gap-2 mb-3">
                <button onClick={handleInsert} className="bg-blue-500 text-white px-3 py-1 rounded">
                    Inserir
                </button>
                <button onClick={handleSearch} className="bg-green-500 text-white px-3 py-1 rounded">
                    Buscar (Skip List)
                </button>
                <button onClick={handleLinearSearch} className="bg-red-500 text-white px-3 py-1 rounded">
                    Buscar (Linear)
                </button>
                <button onClick={clearList} className="bg-gray-500 text-white px-3 py-1 rounded">
                    Apagar Tudo
                </button>
                <button onClick={generateRandomList} className="bg-purple-500 text-white px-3 py-1 rounded">
                    Gerar Novamente
                </button>
                <button onClick={exportToJson} className="bg-blue-700 text-white px-3 py-1 rounded">
                    Exportar JSON
                </button>
                <button onClick={exportCsv} className="bg-green-500 text-white px-3 py-1 rounded">
                     Exportar CSV
                </button>
                
            </div>
            <div className="mb-3">
                <strong>Resultado:</strong> {searchResult}
            </div>
            <div className="mb-3">
                <strong>{benchmark}</strong>
            </div>
            <div className="mb-3 text-red-600">
                <strong>{benchmarkLinear}</strong>
            </div>
            <div className="border p-3 rounded bg-gray-100 overflow-x-auto">
                <strong>Estrutura da Skip List:</strong>
                <div className="mt-2 space-y-2">
                    {Array.from({ length: list.getMaxLevel() }, (_, level) => (
                        <div key={level} className="flex gap-2 items-center">
                            <span className="text-sm whitespace-nowrap font-bold">
                                Nível {list.getMaxLevel() - level}:
                            </span>
                            <AnimatePresence>
                                {elements
                                    .filter(el => el.level >= list.getMaxLevel() - level)
                                    .map(el => (
                                        <motion.div
                                            key={el.value}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.3 }}
                                            className="bg-blue-200 px-3 py-1 rounded shadow"
                                        >
                                            {el.value}
                                        </motion.div>
                                    ))}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkipListComponent;
