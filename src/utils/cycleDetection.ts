
/**
 * Utility for detecting cyclic dependencies between tasks
 */

/**
 * Detects if adding a dependency from source to target would create a cycle
 * Uses an iterative approach to avoid excessive type instantiation
 */
export function detectCyclicDependency(
  tasks: Array<{ id: string; dependencies?: string[] }>,
  sourceId: string, 
  targetId: string
): boolean {
  // Simple adjacency list using a plain object
  const adjacencyList: Record<string, string[]> = {};
  
  // Initialize adjacency list for all tasks
  for (const task of tasks) {
    adjacencyList[task.id] = [];
  }
  
  // Build the adjacency list with existing dependencies
  for (const task of tasks) {
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        if (adjacencyList[depId]) {
          adjacencyList[depId].push(task.id);
        }
      }
    }
  }
  
  // Add the potential new dependency for checking
  if (adjacencyList[sourceId]) {
    adjacencyList[sourceId].push(targetId);
  }
  
  // Use iterative DFS with a manually managed stack
  const visited: Record<string, boolean> = {};
  const stack: string[] = [targetId];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (current === sourceId) {
      // We found a cycle
      return true;
    }
    
    if (!visited[current]) {
      visited[current] = true;
      
      // Add all dependencies to the stack
      const dependencies = adjacencyList[current] || [];
      for (let i = 0; i < dependencies.length; i++) {
        if (!visited[dependencies[i]]) {
          stack.push(dependencies[i]);
        }
      }
    }
  }
  
  // No cycle detected
  return false;
}
