export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  connections: string[]; // IDs of connected rooms/waypoints
  type: "room" | "waypoint" | "entrance" | "stairs";
}

// Calculate Euclidean distance between two rooms
const calculateDistance = (room1: Room, room2: Room): number => {
  return Math.sqrt(Math.pow(room1.x - room2.x, 2) + Math.pow(room1.y - room2.y, 2));
};

// Calculate Manhattan distance (only horizontal and vertical movement)
const calculateManhattanDistance = (room1: Room, room2: Room): number => {
  return Math.abs(room1.x - room2.x) + Math.abs(room1.y - room2.y);
};

// Check if a line between two points passes through a room
const linePassesThroughRoom = (
  x1: number, y1: number,
  x2: number, y2: number,
  roomX: number, roomY: number,
  roomRadius: number = 20 // approximate room radius
): boolean => {
  // Calculate the shortest distance from a point to a line segment
  const A = x1 - x2;
  const B = y1 - y2;
  const C = x1 * y2 - y1 * x2;
  
  const distance = Math.abs(A * roomX + B * roomY + C) / Math.sqrt(A * A + B * B);
  
  // If the distance is less than the room's radius, the line passes through the room
  return distance < roomRadius;
};

// Check if path is obstructed by rooms
const isPathObstructed = (start: Room, end: Room, allRooms: Room[]): boolean => {
  for (const room of allRooms) {
    // Skip checking the start and end rooms
    if (room.id === start.id || room.id === end.id || room.type === "waypoint") continue;
    
    if (linePassesThroughRoom(start.x, start.y, end.x, end.y, room.x, room.y)) {
      return true;
    }
  }
  
  return false;
};

// Dijkstra's algorithm for finding shortest path
export const getShortestPath = (start: Room, end: Room, allRooms: Room[] = []): Room[] => {
  // If no connections available, try to create a path through waypoints
  if (!start.connections.length || !end.connections.length) {
    return createGridBasedPath(start, end, allRooms);
  }
  
  // Copy rooms to work with
  const rooms = [...allRooms];
  
  // Ensure start and end are in the rooms array
  if (!rooms.some(r => r.id === start.id)) rooms.push(start);
  if (!rooms.some(r => r.id === end.id)) rooms.push(end);
  
  // Initialize distances and previous nodes
  const distances: {[id: string]: number} = {};
  const previous: {[id: string]: string | null} = {};
  const unvisited = new Set<string>();
  
  // Set all initial distances to infinity except start
  rooms.forEach(room => {
    distances[room.id] = room.id === start.id ? 0 : Infinity;
    previous[room.id] = null;
    unvisited.add(room.id);
  });
  
  while (unvisited.size > 0) {
    // Find room with minimum distance
    let currentId: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(id => {
      if (distances[id] < minDistance) {
        currentId = id;
        minDistance = distances[id];
      }
    });
    
    // If we can't find a next room or we've reached the end, break
    if (currentId === null || currentId === end.id) break;
    
    unvisited.delete(currentId);
    
    const currentRoom = rooms.find(r => r.id === currentId)!;
    
    // Process all connections of the current room
    currentRoom.connections.forEach(neighborId => {
      if (!unvisited.has(neighborId)) return;
      
      const neighbor = rooms.find(r => r.id === neighborId);
      if (!neighbor) return; // Skip if connection points to non-existent room
      
      const distance = distances[currentId!] + calculateDistance(currentRoom, neighbor);
      
      if (distance < distances[neighborId]) {
        distances[neighborId] = distance;
        previous[neighborId] = currentId;
      }
    });
  }
  
  // Reconstruct path
  const path: Room[] = [];
  let currentId: string | null = end.id;
  
  while (currentId) {
    const room = rooms.find(r => r.id === currentId);
    if (!room) break;
    
    path.unshift(room);
    currentId = previous[currentId];
  }
  
  // If path doesn't start with the start room, it means there's no valid path
  if (path.length === 0 || path[0].id !== start.id) {
    // Try to create a grid-based path
    return createGridBasedPath(start, end, allRooms);
  }
  
  return path;
};

// Create a path using a grid-based approach (Manhattan-style movement)
const createGridBasedPath = (start: Room, end: Room, allRooms: Room[]): Room[] => {
  // Find all waypoints
  const waypoints = allRooms.filter(r => r.type === "waypoint");
  
  // Create a path with only horizontal and vertical segments
  const path: Room[] = [start];
  
  // First, try to move horizontally
  if (Math.abs(end.x - start.x) > 20) {
    // Create or find a waypoint at the same y as start but with the x of end
    const horizontalX = end.x;
    const horizontalY = start.y;
    
    // Check if there's already a waypoint close to this position
    let horizontalWaypoint = waypoints.find(w => 
      Math.abs(w.x - horizontalX) < 15 && Math.abs(w.y - horizontalY) < 15
    );
    
    if (!horizontalWaypoint) {
      // Check if direct horizontal path is obstructed
      const obstructed = allRooms.some(room => {
        if (room.id === start.id || room.id === end.id || room.type === "waypoint") return false;
        
        // Check if this room is between the start and the horizontal point
        const minX = Math.min(start.x, horizontalX);
        const maxX = Math.max(start.x, horizontalX);
        
        return (
          room.x > minX && room.x < maxX && 
          Math.abs(room.y - horizontalY) < 20
        );
      });
      
      if (obstructed) {
        // Find the closest waypoint to use as an intermediate point
        const closestWaypoint = findNearestWaypoint(start, waypoints);
        if (closestWaypoint) {
          path.push(closestWaypoint);
        }
      } else {
        // Create a virtual waypoint
        horizontalWaypoint = {
          id: `virtual-h-${start.id}-${end.id}`,
          name: "Corridor",
          x: horizontalX,
          y: horizontalY,
          connections: [],
          type: "waypoint"
        };
        path.push(horizontalWaypoint);
      }
    } else {
      path.push(horizontalWaypoint);
    }
  }
  
  // Then, try to move vertically
  if (Math.abs(end.y - path[path.length - 1].y) > 20) {
    const verticalX = path[path.length - 1].x;
    const verticalY = end.y;
    
    // Check if there's already a waypoint close to this position
    let verticalWaypoint = waypoints.find(w => 
      Math.abs(w.x - verticalX) < 15 && Math.abs(w.y - verticalY) < 15
    );
    
    if (!verticalWaypoint) {
      // Check if direct vertical path is obstructed
      const obstructed = allRooms.some(room => {
        if (room.id === start.id || room.id === end.id || room.type === "waypoint") return false;
        
        // Check if this room is between the vertical point and the end
        const minY = Math.min(path[path.length - 1].y, verticalY);
        const maxY = Math.max(path[path.length - 1].y, verticalY);
        
        return (
          room.y > minY && room.y < maxY && 
          Math.abs(room.x - verticalX) < 20
        );
      });
      
      if (obstructed) {
        // Find another waypoint to route around the obstruction
        const remainingPath = findRouteThroughWaypoints(path[path.length - 1], end, waypoints, allRooms);
        path.push(...remainingPath.slice(1)); // Skip the first element as it's already in our path
      } else {
        // Create a virtual waypoint
        verticalWaypoint = {
          id: `virtual-v-${start.id}-${end.id}`,
          name: "Corridor",
          x: verticalX,
          y: verticalY,
          connections: [],
          type: "waypoint"
        };
        path.push(verticalWaypoint);
      }
    } else {
      path.push(verticalWaypoint);
    }
  }
  
  // Add the destination
  if (path[path.length - 1].id !== end.id) {
    path.push(end);
  }
  
  return path;
};

// Find a route through existing waypoints to avoid obstacles
const findRouteThroughWaypoints = (start: Room, end: Room, waypoints: Room[], allRooms: Room[]): Room[] => {
  // Find waypoints that could help create a path
  const potentialWaypoints = waypoints.filter(w => {
    // Calculate if this waypoint would help us get closer to the destination
    const distanceWithWaypoint = 
      calculateManhattanDistance(start, w) + 
      calculateManhattanDistance(w, end);
    
    const directDistance = calculateManhattanDistance(start, end);
    
    // Consider waypoints that don't take us too far out of our way
    return distanceWithWaypoint < directDistance * 1.5;
  });
  
  // Sort waypoints by total path length through them
  potentialWaypoints.sort((a, b) => {
    const distanceA = calculateManhattanDistance(start, a) + calculateManhattanDistance(a, end);
    const distanceB = calculateManhattanDistance(start, b) + calculateManhattanDistance(b, end);
    return distanceA - distanceB;
  });
  
  // Try waypoints until we find a non-obstructed path
  for (const waypoint of potentialWaypoints) {
    if (!isPathObstructed(start, waypoint, allRooms) && 
        !isPathObstructed(waypoint, end, allRooms)) {
      return [start, waypoint, end];
    }
  }
  
  // If no good waypoints found, try a simple L-shaped path
  return [
    start,
    {
      id: `corner-${start.id}-${end.id}`,
      name: "Corner",
      x: end.x,
      y: start.y,
      connections: [],
      type: "waypoint"
    },
    end
  ];
};

// Find the nearest waypoint to a room
const findNearestWaypoint = (room: Room, waypoints: Room[]): Room | null => {
  if (waypoints.length === 0) return null;
  
  let nearest = waypoints[0];
  let minDistance = calculateDistance(room, nearest);
  
  for (let i = 1; i < waypoints.length; i++) {
    const distance = calculateDistance(room, waypoints[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = waypoints[i];
    }
  }
  
  return nearest;
};

// Run Dijkstra's algorithm with enhanced connections
const runDijkstra = (start: Room, end: Room, allRooms: Room[]): Room[] => {
  const rooms = [...allRooms];
  
  // Initialize distances and previous nodes
  const distances: {[id: string]: number} = {};
  const previous: {[id: string]: string | null} = {};
  const unvisited = new Set<string>();
  
  // Set all initial distances to infinity except start
  rooms.forEach(room => {
    distances[room.id] = room.id === start.id ? 0 : Infinity;
    previous[room.id] = null;
    unvisited.add(room.id);
  });
  
  while (unvisited.size > 0) {
    // Find room with minimum distance
    let currentId: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(id => {
      if (distances[id] < minDistance) {
        currentId = id;
        minDistance = distances[id];
      }
    });
    
    // If we can't find a next room or we've reached the end, break
    if (currentId === null || currentId === end.id) break;
    
    unvisited.delete(currentId);
    
    const currentRoom = rooms.find(r => r.id === currentId)!;
    
    // Process all connections of the current room
    currentRoom.connections.forEach(neighborId => {
      if (!unvisited.has(neighborId)) return;
      
      const neighbor = rooms.find(r => r.id === neighborId);
      if (!neighbor) return; // Skip if connection points to non-existent room
      
      const distance = distances[currentId!] + calculateDistance(currentRoom, neighbor);
      
      if (distance < distances[neighborId]) {
        distances[neighborId] = distance;
        previous[neighborId] = currentId;
      }
    });
  }
  
  // Reconstruct path
  const path: Room[] = [];
  let currentId: string | null = end.id;
  
  while (currentId) {
    const room = rooms.find(r => r.id === currentId);
    if (!room) break;
    
    path.unshift(room);
    currentId = previous[currentId];
  }
  
  // If no path found, return direct path
  if (path.length === 0 || path[0].id !== start.id) {
    return [start, end];
  }
  
  return path;
};

// Check if a path crosses through a room (that is not in the connections)
export const pathCrossesRoom = (path: Room[], rooms: Room[]): boolean => {
  // Implementation would check if line segments between consecutive path points
  // intersect with room boundaries that aren't in the connections
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    
    for (const room of rooms) {
      // Skip if room is a waypoint or part of the path
      if (room.type === "waypoint" || path.some(p => p.id === room.id)) continue;
      
      // Check if this path segment passes through the room
      if (linePassesThroughRoom(p1.x, p1.y, p2.x, p2.y, room.x, room.y)) {
        return true;
      }
    }
  }
  
  return false;
};

// A* pathfinding algorithm (more efficient than Dijkstra but similar concept)
export const findPathAStar = (start: Room, end: Room, allRooms: Room[]): Room[] => {
  // We'll use our enhanced getShortestPath implementation instead
  return getShortestPath(start, end, allRooms);
};
