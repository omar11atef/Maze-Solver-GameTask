class Maze {
    constructor(size) {
        // Size must be odd for recursive backtracker algorithm to work properly
        this.size = size % 2 === 0 ? size + 1 : size; 
        this.grid = []; // 1 = Wall, 0 = Path
        this.start = { x: 1, y: 1 };
        this.goal = { x: this.size - 2, y: this.size - 2 };
        this.generate();
    }

    generate() {
        // Initialize grid with walls
        for (let y = 0; y < this.size; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.grid[y][x] = 1;
            }
        }

        // Randomized Depth-First Search for maze generation
        const stack = [];
        const current = { x: 1, y: 1 };
        this.grid[current.y][current.x] = 0;
        stack.push(current);

        while (stack.length > 0) {
            const cell = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(cell.x, cell.y);

            if (neighbors.length > 0) {
                // Choose random neighbor
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                
                // Remove wall between current and next
                const wallX = cell.x + (next.x - cell.x) / 2;
                const wallY = cell.y + (next.y - cell.y) / 2;
                this.grid[wallY][wallX] = 0;
                
                // Mark next as path and push to stack
                this.grid[next.y][next.x] = 0;
                stack.push(next);
            } else {
                stack.pop(); // Backtrack
            }
        }

        // Ensure Goal is reachable
        this.grid[this.goal.y][this.goal.x] = 0;
        this.grid[this.goal.y - 1][this.goal.x] = 0; // Clear path above goal
    }

    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        const dirs = [ {dx: 0, dy: -2}, {dx: 2, dy: 0}, {dx: 0, dy: 2}, {dx: -2, dy: 0} ];
        
        for (let dir of dirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            if (nx > 0 && nx < this.size - 1 && ny > 0 && ny < this.size - 1) {
                if (this.grid[ny][nx] === 1) {
                    neighbors.push({ x: nx, y: ny });
                }
            }
        }
        return neighbors;
    }
}