import random
import time

class QLearningAgent:
    def __init__(self, grid, start, goal):
        self.grid = grid
        self.start = (start['x'], start['y'])
        self.goal = (goal['x'], goal['y'])
        self.rows = len(grid)
        self.cols = len(grid[0]) if self.rows > 0 else 0
        
        self.q_table = {}
        
        # Hyperparameters
        self.alpha = 0.1         # Learning rate
        self.gamma = 0.95        # Discount factor
        self.epsilon = 1.0       # Exploration rate
        self.epsilon_decay = 0.999
        self.min_epsilon = 0.01
        
        # Actions: Up, Right, Down, Left
        self.actions = [(0, -1), (1, 0), (0, 1), (-1, 0)]

    def get_q_values(self, state):
        """Retrieve Q-values for a state, initialize if it doesn't exist."""
        if state not in self.q_table:
            self.q_table[state] = [0.0, 0.0, 0.0, 0.0]
        return self.q_table[state]

    def choose_action(self, state, exploit_only=False):
        """Epsilon-greedy action selection."""
        q_values = self.get_q_values(state)
        
        if not exploit_only and random.random() < self.epsilon:
            return random.randint(0, 3)  # Explore randomly
            
        max_q = max(q_values)
        # Handle ties randomly to prevent getting stuck
        best_actions = [i for i, q in enumerate(q_values) if q == max_q]
        return random.choice(best_actions)

    def train(self, episodes=5000):
        """Train the Q-table over a number of episodes."""
        self.q_table.clear()
        self.epsilon = 1.0
        max_steps = self.rows * self.cols

        for _ in range(episodes):
            curr_state = self.start
            steps = 0
            
            while curr_state != self.goal and steps < max_steps:
                action_idx = self.choose_action(curr_state)
                dx, dy = self.actions[action_idx]
                nx, ny = curr_state[0] + dx, curr_state[1] + dy
                
                next_state = (nx, ny)
                reward = 0
                
                # Check walls / boundaries
                if not (0 <= ny < self.rows and 0 <= nx < self.cols) or self.grid[ny][nx] == 1:
                    reward = -10  # Penalty for wall
                    next_state = curr_state  # Stay in place
                elif next_state == self.goal:
                    reward = 100  # Reward for goal
                else:
                    reward = -0.1 # Small penalty to encourage shortest path
                    
                q_values = self.get_q_values(curr_state)
                next_q_values = self.get_q_values(next_state)
                max_next_q = max(next_q_values)
                
                # Bellman Equation
                q_values[action_idx] += self.alpha * (reward + self.gamma * max_next_q - q_values[action_idx])
                
                curr_state = next_state
                steps += 1
                
            if self.epsilon > self.min_epsilon:
                self.epsilon *= self.epsilon_decay

    def solve(self):
        """Execute the greedy policy based on the trained Q-Table."""
        start_time = time.time()
        path = []
        visited = []
        
        curr_state = self.start
        steps = 0
        max_steps = self.rows * self.cols
        state_visits = {}
        
        while curr_state != self.goal and steps < max_steps:
            visited.append({'x': curr_state[0], 'y': curr_state[1]})
            
            # Prevent infinite loops from imperfect training
            state_visits[curr_state] = state_visits.get(curr_state, 0) + 1
            if state_visits[curr_state] > 3:
                break 
                
            action_idx = self.choose_action(curr_state, exploit_only=True)
            dx, dy = self.actions[action_idx]
            nx, ny = curr_state[0] + dx, curr_state[1] + dy
            
            # Stop if the imperfect policy drives us into a wall
            if not (0 <= ny < self.rows and 0 <= nx < self.cols) or self.grid[ny][nx] == 1:
                break
                
            curr_state = (nx, ny)
            if curr_state != self.goal:
                path.append({'x': nx, 'y': ny})
            steps += 1
            
        success = (curr_state == self.goal)
        if success:
            path.append({'x': self.goal[0], 'y': self.goal[1]})
            
        time_taken = (time.time() - start_time) * 1000
        
        return {
            'path': path if success else [],
            'visited': visited,
            'timeTaken': round(time_taken, 2),
            'steps': len(path),
            'success': success
        }