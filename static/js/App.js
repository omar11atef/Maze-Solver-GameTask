class App {
    constructor() {
        this.maze = null;
        this.renderer = new Renderer('mazeCanvas');
        this.isAnimating = false;
        this.isQTrained = false;
        
        // Unique session ID to track the Q-learning state in the Python backend
        this.sessionId = Math.random().toString(36).substr(2, 9);

        this.bindEvents();
        this.generateNewMaze();
    }

    bindEvents() {
        document.getElementById('btnGenerate').addEventListener('click', () => this.generateNewMaze());
        document.getElementById('agentSelect').addEventListener('change', (e) => this.toggleAgentControls(e.target.value));
        document.getElementById('btnTrain').addEventListener('click', () => this.trainQAgentAPI());
        document.getElementById('btnRun').addEventListener('click', () => this.runSimulationAPI());
        document.getElementById('btnReset').addEventListener('click', () => {
            if (!this.isAnimating && this.maze) this.renderer.drawMaze(this.maze);
        });
        document.getElementById('overlayClose').addEventListener('click', () => {
            document.getElementById('messageOverlay').classList.add('hidden');
        });

        window.addEventListener('resize', () => {
            if (this.maze && !this.isAnimating) {
                this.renderer.resize(this.maze.size);
                this.renderer.drawMaze(this.maze);
            }
        });
    }

    showMessage(title, text) {
        document.getElementById('overlayTitle').innerText = title;
        document.getElementById('overlayText').innerText = text;
        document.getElementById('messageOverlay').classList.remove('hidden');
    }

    updateStats(time, steps, visited, success, isQError = false) {
        document.getElementById('statTime').innerText = time !== '-' ? `${time} ms` : '-';
        document.getElementById('statSteps').innerText = steps;
        document.getElementById('statVisited').innerText = visited;
        
        const statusEl = document.getElementById('statStatus');
        if (time === '-') {
            statusEl.innerText = '-';
            statusEl.className = 'stat-value text-sm mt-1';
        } else if (isQError) {
            statusEl.innerText = 'Needs Training';
            statusEl.className = 'stat-value text-sm mt-1 text-orange-600';
        } else if (success) {
            statusEl.innerText = 'Goal Reached!';
            statusEl.className = 'stat-value text-sm mt-1 text-green-600';
        } else {
            statusEl.innerText = 'Failed / No Path';
            statusEl.className = 'stat-value text-sm mt-1 text-red-600';
        }
    }

    generateNewMaze() {
        if (this.isAnimating) return;
        
        const size = parseInt(document.getElementById('difficultySelect').value);
        this.maze = new Maze(size);
        this.isQTrained = false; // Reset training state for new maze

        this.renderer.resize(this.maze.size);
        this.renderer.drawMaze(this.maze);
        
        this.updateStats('-', '-', '-', false);
        document.getElementById('trainProgress').classList.add('hidden');
    }

    toggleAgentControls(agentType) {
        const qControls = document.getElementById('qLearningControls');
        if (agentType === 'qlearning') {
            qControls.classList.remove('hidden');
        } else {
            qControls.classList.add('hidden');
        }
    }

    async trainQAgentAPI() {
        if (this.isAnimating) return;
        
        const btn = document.getElementById('btnTrain');
        const progress = document.getElementById('trainProgress');
        const spinner = document.getElementById('spinnerTrain');
        
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
        spinner.classList.remove('hidden');
        progress.classList.remove('hidden');
        progress.innerText = "Training Python Model... Please wait.";
        progress.classList.replace('text-green-600', 'text-indigo-700');
        
        try {
            // Call Python Backend to train
            const response = await fetch('/api/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    maze: {
                        grid: this.maze.grid,
                        start: this.maze.start,
                        goal: this.maze.goal
                    }
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.isQTrained = true;
                progress.innerText = "Training Complete! (100%)";
                progress.classList.replace('text-indigo-700', 'text-green-600');
            }
        } catch (error) {
            console.error("Training Error:", error);
            this.showMessage("Connection Error", "Could not connect to the Python backend. Is the Flask server running?");
            progress.classList.add('hidden');
        } finally {
            spinner.classList.add('hidden');
            setTimeout(() => {
                btn.disabled = false;
                btn.classList.remove('opacity-75', 'cursor-not-allowed');
            }, 1000);
        }
    }

    async runSimulationAPI() {
        if (this.isAnimating) return;

        const selectedAgent = document.getElementById('agentSelect').value;

        if (selectedAgent === 'qlearning' && !this.isQTrained) {
            this.showMessage('Training Required', 'The Q-Learning agent must be trained on this specific maze before it can run. Please click "Train Q-Agent (API)" first.');
            this.updateStats('-', '-', '-', false, true);
            return;
        }

        this.setUIRunningState(true);
        const spinner = document.getElementById('spinnerRun');
        spinner.classList.remove('hidden');

        try {
            // Send maze data to Python Backend
            const response = await fetch('/api/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    agent: selectedAgent,
                    maze: {
                        grid: this.maze.grid,
                        start: this.maze.start,
                        goal: this.maze.goal
                    }
                })
            });

            const result = await response.json();

            if (result.error) {
                this.showMessage("Backend Error", result.error);
                this.setUIRunningState(false);
                return;
            }

            if (!result.success && selectedAgent === 'qlearning') {
                 this.showMessage('Suboptimal Policy', 'The Python Learning Agent failed to reach the goal. Q-Learning may require more training episodes or parameter tuning.');
            }

            this.updateStats(result.timeTaken, result.steps, result.visited.length, result.success);

            // Animate using data returned from Python
            this.renderer.animateSolution(this.maze, result.visited, result.path, () => {
                this.setUIRunningState(false);
            });

        } catch (error) {
            console.error("Simulation Error:", error);
            this.showMessage("Connection Error", "Could not execute agent. Is the Flask server running?");
            this.setUIRunningState(false);
        } finally {
            spinner.classList.add('hidden');
        }
    }

    setUIRunningState(isRunning) {
        this.isAnimating = isRunning;
        const buttons = ['btnGenerate', 'btnRun', 'btnReset', 'btnTrain', 'difficultySelect', 'agentSelect'];
        buttons.forEach(id => {
            document.getElementById(id).disabled = isRunning;
            if(isRunning) document.getElementById(id).classList.add('opacity-50', 'cursor-not-allowed');
            else document.getElementById(id).classList.remove('opacity-50', 'cursor-not-allowed');
        });
    }
}

// Initialize App on load
window.onload = () => {
    new App();
};