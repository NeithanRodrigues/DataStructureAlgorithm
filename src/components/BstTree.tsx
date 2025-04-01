import { useState, useEffect } from "react";
import { BST, TreeNode } from "../algorithm/BstTree";
import Tree from "react-d3-tree";

const BSTComponent = () => {
    const [treeData, setTreeData] = useState<any>(null);
    const containerWidth = 600; // Tamanho fixo da árvore
    const containerHeight = 300;

    useEffect(() => {
        const bst = new BST();
        const numElements = 6; // Número de elementos aleatórios

        // Gera valores aleatórios únicos
        const values = new Set<number>();
        while (values.size < numElements) {
            values.add(Math.floor(Math.random() * 100));
        }

        values.forEach((val) => bst.insert(val));

        console.log("Árvore BST gerada:", [...values]);

        // Converte para o formato do react-d3-tree
        const convertToTreeFormat = (node: TreeNode | null): any => {
            if (!node) return null;
            return {
                name: node.value.toString(),
                children: [convertToTreeFormat(node.left), convertToTreeFormat(node.right)].filter(n => n)
            };
        };

        setTreeData(convertToTreeFormat(bst.getRoot()));
    }, []);

    // Função para ajustar a árvore para caber no contêiner
    const calculateTreeDimensions = (tree: any) => {
        // Considerando o tamanho fixo do contêiner
        const nodeWidth = 50; // Largura média de cada nó
        const nodeHeight = 25; // Altura média de cada nó
        const levels = tree ? getTreeHeight(tree) : 0;
        const width = nodeWidth * Math.pow(2, levels - 1); // Calcula a largura máxima da árvore
        const height = nodeHeight * (levels + 1); // Calcula a altura máxima da árvore
        return { width, height };
    };

    // Função para calcular a altura da árvore
    const getTreeHeight = (node: any): number => {
        if (!node) return 0;
        const leftHeight = getTreeHeight(node.children ? node.children[0] : null);
        const rightHeight = getTreeHeight(node.children ? node.children[1] : null);
        return Math.max(leftHeight, rightHeight) + 1;
    };

    const treeDimensions = treeData ? calculateTreeDimensions(treeData) : { width: 0, height: 0 };

    return (
        <>
        <div className="flex flex-col justify-center items-center mt-10 gap-4">
            <h1 className="text-4xl font-bold"> Árvore Binária de Busca</h1>
            <p className="w-[35%]">A Árvore Binária de Busca (BST - Binary Search Tree) é uma estrutura de dados baseada em árvore onde os valores menores ficam à esquerda da sub-árvore, os valores maiores ficar à direita e não pode haver valores duplicados. </p>
        </div>

        <div className="flex justify-center items-center mt-10">
            <div
                className=" w-[500px] h-[700px] border-2 border-gray-300 rounded-lg bg-gray-100 flex justify-center items-center"
            >
                {treeData ? (
                    <Tree
                        data={treeData}
                        orientation="vertical"
                        translate={{ x: containerWidth / 2, y: 50 }}
                        scaleExtent={{ min: 0.5, max: 1 }} // Ajusta o zoom para a árvore caber no espaço
                        pathFunc="elbow"
                        separation={{ siblings: 1.5, nonSiblings: 2 }}
                        renderCustomNodeElement={({ nodeDatum }) => (
                            <g>
                                <circle r="20" fill="lightblue" />
                                <text fill="black" fontSize="12" textAnchor="middle">
                                    {nodeDatum.name}
                                </text>
                            </g>
                        )}
                    />
                ) : (
                    <p>Carregando árvore...</p>
                )}
            </div>
        </div>
        </>
    );
};

export default BSTComponent;
