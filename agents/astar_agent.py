import heapq
import time

class AStarAgent:
    def __init__(self, grid, start, goal):
        self.grid = grid
        self.start = (start['x'], start['y'])
        self.goal = (goal['x'], goal['y'])
        self.rows = len(grid)
        self.cols = len(grid[0]) if self.rows > 0 else 0

    def heuristic(self, a, b):
        """Manhattan distance heuristic"""
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    def solve(self):
        """Executes the A* Search Algorithm"""
        start_time = time.time()
        
        open_set = []
        heapq.heappush(open_set, (0, self.start))
        
        came_from = {}
        g_score = {self.start: 0}
        visited_nodes = []
        
        while open_set:
            _, current = heapq.heappop(open_set)
            
            # Record visited nodes for animation (exclude start and goal)
            if current != self.start and current != self.goal:
                visited_nodes.append({'x': current[0], 'y': current[1]})
                
            # Goal Reached
            if current == self.goal:
                path = self._reconstruct_path(came_from, current)
                time_taken = (time.time() - start_time) * 1000  # Convert to ms
                return {
                    'path': path,
                    'visited': visited_nodes,
                    'timeTaken': round(time_taken, 2),
                    'steps': len(path),
                    'success': True
                }
                
            # Check adjacent neighbors (Up, Right, Down, Left)
            for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
                nx, ny = current[0] + dx, current[1] + dy
                neighbor = (nx, ny)
                
                # Check boundaries and walls
                if 0 <= ny < self.rows and 0 <= nx < self.cols:
                    if self.grid[ny][nx] == 1:
                        continue
                else:
                    continue
                    
                tentative_g_score = g_score[current] + 1
                
                if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score = tentative_g_score + self.heuristic(neighbor, self.goal)
                    heapq.heappush(open_set, (f_score, neighbor))
                    
        # No path found
        time_taken = (time.time() - start_time) * 1000
        return {
            'path': [], 
            'visited': visited_nodes, 
            'timeTaken': round(time_taken, 2), 
            'steps': 0, 
            'success': False
        }

    def _reconstruct_path(self, came_from, current):
        """Reconstructs the optimal path from goal to start"""
        path = []
        while current in came_from:
            path.insert(0, {'x': current[0], 'y': current[1]})
            current = came_from[current]
        return path