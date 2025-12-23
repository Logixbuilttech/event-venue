import type { DoorArea } from '@config/venues';

/**
 * Check if a point is inside a rectangular door area (with optional clearance)
 */
export function isPointInDoorArea(
  point: { x: number; y: number },
  doorArea: DoorArea
): boolean {
  const clearance = doorArea.clearance || 0;

  // Get bounding box of door area with clearance
  const minX = Math.min(
    doorArea.topLeft.x,
    doorArea.topRight.x,
    doorArea.bottomRight.x,
    doorArea.bottomLeft.x
  ) - clearance;

  const maxX = Math.max(
    doorArea.topLeft.x,
    doorArea.topRight.x,
    doorArea.bottomRight.x,
    doorArea.bottomLeft.x
  ) + clearance;

  const minY = Math.min(
    doorArea.topLeft.y,
    doorArea.topRight.y,
    doorArea.bottomRight.y,
    doorArea.bottomLeft.y
  ) - clearance;

  const maxY = Math.max(
    doorArea.topLeft.y,
    doorArea.topRight.y,
    doorArea.bottomRight.y,
    doorArea.bottomLeft.y
  ) + clearance;

  // Check if point is within bounding box
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
}

/**
 * Check if a rectangular object overlaps with any door area
 */
export function isObjectInDoorArea(
  object: {
    x: number; // Center X
    y: number; // Center Y
    width: number;
    height: number;
    rotation?: number;
  },
  doorArea: DoorArea
): boolean {
  const clearance = doorArea.clearance || 0;

  // Get bounding box of door area with clearance
  const doorMinX = Math.min(
    doorArea.topLeft.x,
    doorArea.topRight.x,
    doorArea.bottomRight.x,
    doorArea.bottomLeft.x
  ) - clearance;

  const doorMaxX = Math.max(
    doorArea.topLeft.x,
    doorArea.topRight.x,
    doorArea.bottomRight.x,
    doorArea.bottomLeft.x
  ) + clearance;

  const doorMinY = Math.min(
    doorArea.topLeft.y,
    doorArea.topRight.y,
    doorArea.bottomRight.y,
    doorArea.bottomLeft.y
  ) - clearance;

  const doorMaxY = Math.max(
    doorArea.topLeft.y,
    doorArea.topRight.y,
    doorArea.bottomRight.y,
    doorArea.bottomLeft.y
  ) + clearance;

  // Get object bounding box (simple AABB check)
  const halfWidth = object.width / 2;
  const halfHeight = object.height / 2;

  const objMinX = object.x - halfWidth;
  const objMaxX = object.x + halfWidth;
  const objMinY = object.y - halfHeight;
  const objMaxY = object.y + halfHeight;

  // Check AABB intersection
  const overlaps = !(
    objMaxX < doorMinX || // Object is left of door
    objMinX > doorMaxX || // Object is right of door
    objMaxY < doorMinY || // Object is above door
    objMinY > doorMaxY    // Object is below door
  );

  return overlaps;
}

/**
 * Check if an object overlaps with ANY door area in the list
 */
export function isObjectInAnyDoorArea(
  object: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  },
  doorAreas: DoorArea[] = []
): boolean {
  return doorAreas.some(doorArea => isObjectInDoorArea(object, doorArea));
}

/**
 * Check if a point is in ANY door area in the list
 */
export function isPointInAnyDoorArea(
  point: { x: number; y: number },
  doorAreas: DoorArea[] = []
): boolean {
  return doorAreas.some(doorArea => isPointInDoorArea(point, doorArea));
}

/**
 * Get all door areas that overlap with a given object
 */
export function getDoorAreasOverlappingObject(
  object: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  },
  doorAreas: DoorArea[] = []
): DoorArea[] {
  return doorAreas.filter(doorArea => isObjectInDoorArea(object, doorArea));
}

/**
 * Calculate the expanded bounding box for a door area including clearance
 */
export function getDoorAreaBounds(doorArea: DoorArea): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const clearance = doorArea.clearance || 0;

  const minX = Math.min(
    doorArea.topLeft.x,
    doorArea.topRight.x,
    doorArea.bottomRight.x,
    doorArea.bottomLeft.x
  ) - clearance;

  const maxX = Math.max(
    doorArea.topLeft.x,
    doorArea.topRight.x,
    doorArea.bottomRight.x,
    doorArea.bottomLeft.x
  ) + clearance;

  const minY = Math.min(
    doorArea.topLeft.y,
    doorArea.topRight.y,
    doorArea.bottomRight.y,
    doorArea.bottomLeft.y
  ) - clearance;

  const maxY = Math.max(
    doorArea.topLeft.y,
    doorArea.topRight.y,
    doorArea.bottomRight.y,
    doorArea.bottomLeft.y
  ) + clearance;

  return { minX, maxX, minY, maxY };
}

/**
 * Find the nearest valid position outside all door areas
 * Useful for relocating an object that's placed in a door area
 */
export function findNearestValidPosition(
  position: { x: number; y: number },
  doorAreas: DoorArea[] = [],
  objectSize: { width: number; height: number }
): { x: number; y: number } | null {
  // If no door areas, position is valid
  if (doorAreas.length === 0) {
    return position;
  }

  // Check if current position is valid
  if (!isObjectInAnyDoorArea({ ...position, ...objectSize }, doorAreas)) {
    return position;
  }

  // Find nearest door area
  const overlappingDoors = getDoorAreasOverlappingObject({ ...position, ...objectSize }, doorAreas);
  
  if (overlappingDoors.length === 0) {
    return position;
  }

  // Get bounds of first overlapping door
  const doorBounds = getDoorAreaBounds(overlappingDoors[0]);

  // Calculate distance to each edge
  const distances = [
    { side: 'left', x: doorBounds.minX - objectSize.width / 2 - 10, y: position.y, dist: Math.abs(position.x - doorBounds.minX) },
    { side: 'right', x: doorBounds.maxX + objectSize.width / 2 + 10, y: position.y, dist: Math.abs(position.x - doorBounds.maxX) },
    { side: 'top', x: position.x, y: doorBounds.minY - objectSize.height / 2 - 10, dist: Math.abs(position.y - doorBounds.minY) },
    { side: 'bottom', x: position.x, y: doorBounds.maxY + objectSize.height / 2 + 10, dist: Math.abs(position.y - doorBounds.maxY) }
  ];

  // Sort by distance and return nearest valid position
  distances.sort((a, b) => a.dist - b.dist);

  for (const pos of distances) {
    const newPos = { x: pos.x, y: pos.y };
    if (!isObjectInAnyDoorArea({ ...newPos, ...objectSize }, doorAreas)) {
      return newPos;
    }
  }

  return null; // No valid position found
}

