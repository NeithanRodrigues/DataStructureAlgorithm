// Estrutura de grafo simples para BFS
class Graph {
    adjacencyList: Map<number, number[]>;

    constructor() {
        this.adjacencyList = new Map();
    }

    addVertex(vertex: number): void {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, []);
        }
    }

    addEdge(vertex1: number, vertex2: number): void {
        this.adjacencyList.get(vertex1)?.push(vertex2);
        this.adjacencyList.get(vertex2)?.push(vertex1); // Se for grafo não direcionado
    }

    // BFS
    bfs(start: number): number[] {
        const visited: Set<number> = new Set();
        const queue: number[] = [start];
        const result: number[] = [];

        visited.add(start);

        while (queue.length > 0) {
            const vertex = queue.shift()!;
            result.push(vertex);

            this.adjacencyList.get(vertex)?.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }

        return result;
    }
}

export default Graph;
