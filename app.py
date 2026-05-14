from flask import Flask, request, jsonify, send_from_directory
from agents.astar_agent import AStarAgent
from agents.qlearning_agent import QLearningAgent
import os

app = Flask(__name__, static_folder='static')

# In-memory dictionary to store trained Q-Learning agents per user session.
# This prevents the Q-Table from being lost between HTTP requests.
sessions = {}

@app.route('/')
def index():
    """Serve the main HTML interface."""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static JS and CSS files."""
    return send_from_directory('static', path)

@app.route('/api/train', methods=['POST'])
def train_agent():
    """Endpoint to train the Q-Learning agent."""
    data = request.json
    session_id = data.get('session_id')
    maze_data = data.get('maze')
    
    # Initialize and train the Python Q-Learning Agent
    agent = QLearningAgent(maze_data['grid'], maze_data['start'], maze_data['goal'])
    agent.train(episodes=5000)
    
    # Save the trained agent to memory
    sessions[session_id] = agent
    
    return jsonify({'status': 'success', 'message': 'Agent trained successfully'})

@app.route('/api/solve', methods=['POST'])
def solve_maze():
    """Endpoint to solve the maze using the selected agent."""
    data = request.json
    session_id = data.get('session_id')
    maze_data = data.get('maze')
    agent_type = data.get('agent')
    
    if agent_type == 'astar':
        agent = AStarAgent(maze_data['grid'], maze_data['start'], maze_data['goal'])
        result = agent.solve()
        return jsonify(result)
        
    elif agent_type == 'qlearning':
        if session_id not in sessions:
            return jsonify({'success': False, 'error': 'Agent not trained'})
        
        agent = sessions[session_id]
        result = agent.solve()
        return jsonify(result)

    return jsonify({'success': False, 'error': 'Invalid agent type'}), 400

if __name__ == '__main__':
    print("Starting AI Maze Solver API on http://localhost:5000")
    app.run(debug=True, port=5000)