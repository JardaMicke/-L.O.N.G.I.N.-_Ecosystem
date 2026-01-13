import { Logger } from './logger';

/**
 * Interface representing a point in 2D space (grid coordinates).
 */
export interface Point {
  /** Grid X coordinate */
  x: number;
  /** Grid Y coordinate */
  y: number;
}

/**
 * Internal node structure for A* pathfinding.
 */
export interface Node {
  /** Grid X coordinate */
  x: number;
  /** Grid Y coordinate */
  y: number;
  /** Cost from start node (g-score) */
  cost: number;
  /** Heuristic cost to end node (h-score) */
  heuristic: number;
  /** Parent node in the path */
  parent?: Node;
  /** Whether the node is walkable */
  walkable: boolean;
}

/**
 * Utility class providing pathfinding and geometric algorithms.
 */
export class PathfindingUtils {
  /**
   * Finds a path using A* algorithm.
   * 
   * @param {Point} start - Start position (grid coordinates).
   * @param {Point} end - End position (grid coordinates).
   * @param {boolean[][]} grid - 2D array of walkable flags (true = walkable, false = blocked).
   * @returns {Point[]} Array of points representing the path, or empty array if no path found.
   */
  public static findPathAStar(start: Point, end: Point, grid: boolean[][]): Point[] {
    const height = grid.length;
    const width = grid[0].length;

    if (
      start.x < 0 ||
      start.x >= width ||
      start.y < 0 ||
      start.y >= height ||
      end.x < 0 ||
      end.x >= width ||
      end.y < 0 ||
      end.y >= height
    ) {
      Logger.warn('Pathfinding: Start or end position out of bounds');
      return [];
    }

    if (!grid[end.y][end.x]) {
      Logger.warn('Pathfinding: End position is blocked');
      return [];
    }

    const openList: Node[] = [];
    const closedList: boolean[][] = Array(height)
      .fill(false)
      .map(() => Array(width).fill(false));
    const nodeGrid: Node[][] = Array(height)
      .fill(null)
      .map((_, y) =>
        Array(width)
          .fill(null)
          .map((_, x) => ({
            x,
            y,
            cost: 0,
            heuristic: 0,
            walkable: grid[y][x],
          })),
      );

    const startNode = nodeGrid[start.y][start.x];
    const endNode = nodeGrid[end.y][end.x];

    openList.push(startNode);

    while (openList.length > 0) {
      // Sort by f = g + h (cost + heuristic)
      openList.sort((a, b) => a.cost + a.heuristic - (b.cost + b.heuristic));
      const currentNode = openList.shift()!;

      if (currentNode === endNode) {
        return this.reconstructPath(currentNode);
      }

      closedList[currentNode.y][currentNode.x] = true;

      const neighbors = this.getNeighbors(currentNode, nodeGrid, width, height);
      for (const neighbor of neighbors) {
        if (closedList[neighbor.y][neighbor.x] || !neighbor.walkable) {
          continue;
        }

        const newCost = currentNode.cost + 1; // Assuming uniform cost for now
        const inOpen = openList.includes(neighbor);

        if (!inOpen || newCost < neighbor.cost) {
          neighbor.cost = newCost;
          neighbor.heuristic = this.manhattanDistance(neighbor, endNode);
          neighbor.parent = currentNode;

          if (!inOpen) {
            openList.push(neighbor);
          }
        }
      }
    }

    return [];
  }

  /**
   * Gets valid neighbors for a given node (up, down, left, right).
   * 
   * @param {Node} node - Current node.
   * @param {Node[][]} grid - Grid of nodes.
   * @param {number} width - Grid width.
   * @param {number} height - Grid height.
   * @returns {Node[]} Array of neighbor nodes.
   */
  private static getNeighbors(node: Node, grid: Node[][], width: number, height: number): Node[] {
    const neighbors: Node[] = [];
    const dirs = [
      { x: 0, y: -1 }, // Up
      { x: 0, y: 1 }, // Down
      { x: -1, y: 0 }, // Left
      { x: 1, y: 0 }, // Right
    ];

    for (const dir of dirs) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        neighbors.push(grid[ny][nx]);
      }
    }

    return neighbors;
  }

  /**
   * Calculates Manhattan distance heuristic between two nodes.
   * 
   * @param {Node} a - First node.
   * @param {Node} b - Second node.
   * @returns {number} Manhattan distance.
   */
  private static manhattanDistance(a: Node, b: Node): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Reconstructs path from end node to start node by following parents.
   * 
   * @param {Node} node - End node.
   * @returns {Point[]} Path from start to end.
   */
  private static reconstructPath(node: Node): Point[] {
    const path: Point[] = [];
    let current: Node | undefined = node;
    while (current) {
      path.push({ x: current.x, y: current.y });
      current = current.parent;
    }
    return path.reverse();
  }

  /**
   * Checks if a point is inside a polygon using ray casting algorithm.
   * 
   * @param {Point} point - Point to check.
   * @param {Point[]} polygon - Array of points defining the polygon vertices.
   * @returns {boolean} True if point is inside polygon.
   */
  public static isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
