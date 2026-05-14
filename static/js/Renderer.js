class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 0;
        this.animationId = null;
    }

    resize(mazeSize) {
        const container = this.canvas.parentElement;
        const padding = 32;
        const availableSize = Math.min(container.clientWidth - padding, container.clientHeight - padding);
        
        this.cellSize = Math.floor(availableSize / mazeSize);
        this.canvas.width = this.cellSize * mazeSize;
        this.canvas.height = this.cellSize * mazeSize;
    }

    drawMaze(maze) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < maze.size; y++) {
            for (let x = 0; x < maze.size; x++) {
                if (maze.grid[y][x] === 1) {
                    this.ctx.fillStyle = '#1f2937'; // Wall color
                } else {
                    this.ctx.fillStyle = '#ffffff'; // Path color
                }
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        // Draw Start (Green)
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(maze.start.x * this.cellSize, maze.start.y * this.cellSize, this.cellSize, this.cellSize);
        
        // Draw Goal (Red)
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillRect(maze.goal.x * this.cellSize, maze.goal.y * this.cellSize, this.cellSize, this.cellSize);
    }

    drawCell(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.cellSize + 1, 
            y * this.cellSize + 1, 
            this.cellSize - 2, 
            this.cellSize - 2
        );
    }

    animateSolution(maze, visited, path, onComplete) {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.drawMaze(maze); 

        let vIndex = 0;
        let pIndex = 0;
        const framesPerTick = Math.max(1, Math.floor(maze.size / 10));

        const animate = () => {
            if (vIndex < visited.length) {
                for(let i=0; i<framesPerTick && vIndex < visited.length; i++) {
                    const node = visited[vIndex];
                    if ((node.x !== maze.start.x || node.y !== maze.start.y) &&
                        (node.x !== maze.goal.x || node.y !== maze.goal.y)) {
                        this.drawCell(node.x, node.y, '#93c5fd'); 
                    }
                    vIndex++;
                }
                this.animationId = requestAnimationFrame(animate);
            } 
            else if (pIndex < path.length) {
                for(let i=0; i<framesPerTick && pIndex < path.length; i++) {
                    const node = path[pIndex];
                    if (node.x !== maze.goal.x || node.y !== maze.goal.y) {
                        this.drawCell(node.x, node.y, '#facc15'); 
                    }
                    pIndex++;
                }
                this.animationId = requestAnimationFrame(animate);
            } 
            else {
                if (onComplete) onComplete();
            }
        };

        animate();
    }
}