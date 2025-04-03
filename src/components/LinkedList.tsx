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
        const headers = "tipo,numero,encontrado,tempo_execucao_ms\n";
        
        const data = [
            ["Desotimizado", inputValue ? parseInt(inputValue) : "", searchResult.includes("Encontrado"), benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0],
            ["MTF", inputValue ? parseInt(inputValue) : "", searchResult.includes("Encontrado"), benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0],
            ["Transposicao", inputValue ? parseInt(inputValue) : "", searchResult.includes("Encontrado"), benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0]
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
                    tipo: "Desotimizado",
                    numero: inputValue ? parseInt(inputValue) : null,
                    encontrado: searchResult.includes("Encontrado"),
                    tempo_execucao_ms: benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0
                },
                {
                    tipo: "MTF",
                    numero: inputValue ? parseInt(inputValue) : null,
                    encontrado: searchResult.includes("Encontrado"),
                    tempo_execucao_ms: benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0
                },
                {
                    tipo: "Transposicao",
                    numero: inputValue ? parseInt(inputValue) : null,
                    encontrado: searchResult.includes("Encontrado"),
                    tempo_execucao_ms: benchmark ? parseFloat(benchmark.match(/[\d.]+/g)?.[0] || "0") : 0
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
    
    
    
    

    // Atualiza a exibição da lista
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

        while (uniqueNumbers.size < 10000) { // Garante que sejam gerados 12 números únicos
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
        setSearchResult(result ? `Encontrado: ${result.value}` : "Não encontrado");
        setBenchmark(`Tempo de execução: ${(endTime - startTime).toFixed(2)} ms`);
    };

    // Busca Move-To-Front (MTF) com benchmark
    const handleSearchMTF = () => {
        const num = parseInt(inputValue);
        const startTime = performance.now();
        const result = list.searchMoveToFront(num);
        const endTime = performance.now();
        if (result) updateElements();
        setSearchResult(result ? `Encontrado: ${result.value}` : "Não encontrado");
        setBenchmark(`Tempo de execução: ${(endTime - startTime).toFixed(2)} ms`);
    };

    // Busca por transposição
    const handleSearchTranspose = () => {
        const num = parseInt(inputValue);
        const result = list.searchTranspose(num);
        if (result) updateElements();
        setSearchResult(result ? `Encontrado: ${result.value}` : "Não encontrado");
    };

    return (
        <div className="p-4 border rounded-lg shadow-lg w-192 mx-auto mt-5">
            <h2 className="text-lg font-bold mb-3">Lista Encadeada</h2>
            <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border p-2 w-full mb-3"
                placeholder="Digite um número"
            />
            <div className="flex gap-2 mb-3">
                <button onClick={handleInsert} className="bg-blue-500 text-white px-3 py-1 rounded">Inserir</button>
                <button onClick={handleSearchUnoptimized} className="bg-gray-500 text-white px-3 py-1 rounded">Buscar (Desotimizado)</button>
                <button onClick={handleSearchMTF} className="bg-green-500 text-white px-3 py-1 rounded">Buscar (MTF)</button>
                <button onClick={handleSearchTranspose} className="bg-yellow-500 text-white px-3 py-1 rounded">Buscar (Transposição)</button>
                <button onClick={handleClearList} className="bg-red-500 text-white px-3 py-1 rounded">Apagar Tudo</button>
                <button onClick={handleGenerateNewList} className="bg-purple-500 text-white px-3 py-1 rounded">Gerar Novamente</button>
                <button onClick={exportToJson} className="bg-blue-500 text-white px-3 py-1 rounded">
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
            <div className="border p-3 rounded bg-gray-100 overflow-x-auto whitespace-nowrap">
                <strong>Lista:</strong>
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
        </div>
    );
};

export default LinkedListComponent;
