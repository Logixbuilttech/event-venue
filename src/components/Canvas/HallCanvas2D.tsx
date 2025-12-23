'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useHallStore } from '@store/hallStore';
import type { HallObject } from '@models/objects';
import { AdvancedDXFModel } from '@utils/advancedDxfRenderer';
import { SimpleDxfOverlay } from './SimpleDxfOverlay';
import { defaultTableConfigs, getVenueConfig, updateTableAreaPoints, getCornerPoints, positionStageFromCorners, calculateTableAreaAfterStage, isPositionWithinBounds, constrainPositionToBounds } from '@config/venues';
import type { StageConfig } from '@config/stages';
import type { DoorArea } from '@config/venues';
import DXFTableRenderer from './DXFTableRenderer';
import { handleStageSelection } from '@utils/simpleStageTablePoints';
import { getStageDXFData } from '@utils/stageDXFHelper';

interface DraggableObjectProps {
  object: HallObject;
  onDrag: (id: string, newPosition: { x: number; y: number }) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  controlsRef: React.RefObject<any>;
  isDraggable?: boolean; // Optional prop to control if object can be dragged (default: true)
}

function DraggableObject({ object, onDrag, isSelected, onSelect, controlsRef, isDraggable = true }: DraggableObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Memoize colors
  const colors = useMemo(() => ({
    normal: object.type === 'stage' ? '#ff0000' : object.type === 'table' ? '#8B4513' : '#0000ff',
    selected: object.type === 'stage' ? '#ff3333' : object.type === 'table' ? '#A0522D' : '#3333ff',
    dragging: object.type === 'stage' ? '#ff6666' : object.type === 'table' ? '#CD853F' : '#6666ff',
    hovered: object.type === 'stage' ? '#ff4444' : object.type === 'table' ? '#9A5A23' : '#4444ff'
  }), [object.type]);

  const currentColor = isDragging ? colors.dragging : isSelected ? colors.selected : hovered ? colors.hovered : colors.normal;

  const handlePointerDown = useCallback((event: any) => {
    if (!isDraggable) return; // Don't allow dragging if not draggable

    event.stopPropagation();
    setIsDragging(true);
    onSelect(object.id);

    // Disable OrbitControls while dragging
    if (controlsRef.current) controlsRef.current.enabled = false;

    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
    document.body.style.cursor = 'grabbing';
  }, [object.id, onSelect, isDraggable]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isDragging) return;

    event.stopPropagation();

    // Use the event point directly for position
    if (groupRef.current) {
      groupRef.current.position.x = event.point.x;
      groupRef.current.position.y = event.point.y;
    }
  }, [isDragging, object.id]);


  const handlePointerUp = useCallback((event: any) => {
    if (!isDragging) return;
    event.stopPropagation();
    setIsDragging(false);

    // Re-enable OrbitControls after dragging
    if (controlsRef.current) controlsRef.current.enabled = true;

    if (event.target.releasePointerCapture) {
      event.target.releasePointerCapture(event.pointerId);
    }

    if (groupRef.current) {
      onDrag(object.id, {
        x: groupRef.current.position.x,
        y: groupRef.current.position.y
      });
    }

    document.body.style.cursor = 'default';
    // }, [isDragging, object.id, onDrag, object.type]);
  }, [isDragging, object.id, onDrag]);

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    if (!isDragging && isDraggable) {
      document.body.style.cursor = 'grab';
    }
  }, [isDragging, isDraggable, object.type, object.id]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    if (!isDragging) {
      document.body.style.cursor = 'default';
    }
  }, [isDragging]);

  return (
    <group
      ref={groupRef}
      position={[object.x, object.y, 0]}
      rotation={[0, 0, (object.rotation ?? 0) * (Math.PI / 180)]}
    >
      {/* Use DXF renderer for tables and chairs, fallback to basic geometry for others */}
      {(object.type === 'table' || object.type === 'chair') ? (
        <group
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <DXFTableRenderer object={object} />
        </group>
      ) : (
        <mesh
          position={[0, 0, 0.1]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          {/* <boxGeometry args={[object.width, object.height, 0.2]} />
          <meshBasicMaterial
            color={currentColor}
            transparent
            opacity={isDragging ? 0.8 : hovered ? 0.9 : 1}
          /> */}
        </mesh>
      )}

      {/* Selection border */}
      {isSelected && (
        <mesh position={[0, 0, 0.2]}>
          <ringGeometry args={[Math.max(object.width, object.height) / 2 + 0.2, Math.max(object.width, object.height) / 2 + 0.4, 16]} />
          <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Boundary constraint indicator for stages */}
      {object.type === 'stage' && isSelected && (
        <mesh position={[0, 0, 0.1]}>
          <ringGeometry args={[Math.max(object.width, object.height) / 2 + 0.5, Math.max(object.width, object.height) / 2 + 0.7, 16]} />
          <meshBasicMaterial color="#ff6b35" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Object label */}
      <mesh position={[0, 0, 0.25]}>
        <planeGeometry args={[Math.min(object.width * 0.8, 2), Math.min(object.height * 0.3, 0.5)]} />
        <meshBasicMaterial color="#1A1A1A" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

interface EventConfig {
  id: string;
  name: string;
  description?: string;
  objects: Array<{
    id: string;
    name: string;
    fileName: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    color?: string;
    description?: string;
  }>;
}

interface HallCanvas2DProps {
  selectedStage?: StageConfig | null;
  selectedEvent?: EventConfig | null;
  guestCount: number;
  venueConfig?: any;
  floorPlan?: any;
  onStageUpdate?: (stage: StageConfig) => void;
}

export default function HallCanvas2D({ selectedStage, selectedEvent, guestCount, venueConfig, floorPlan, onStageUpdate }: HallCanvas2DProps) {
  const {
    objects,
    updateObject,
    selectedObjectId,
    selectObject,
    setTableArrangement,
    getTableStats,
    currentTableConfig,
    selectedTableArea,
    hoverCoordinates,
    selectTableArea,
    setHoverCoordinates,
    customAreaPoints,
    isSelectingCustomArea,
    startCustomAreaSelection,
    addCustomAreaPoint,
    finishCustomAreaSelection,
    clearCustomAreaSelection,
    addStage,
    updateStage,
    removeStage,
    clearStages
  } = useHallStore();
  const [progress, setProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const [areaBoundsByLayer, setAreaBoundsByLayer] = useState<Record<string, { minX: number; maxX: number; minY: number; maxY: number }>>({});

  // Use provided venue configuration or fallback to default
  const currentVenueConfig = venueConfig || getVenueConfig('infinity-ballroom');
  const currentFloorPlan = floorPlan || currentVenueConfig?.floorPlans.find((plan: any) => plan.id === currentVenueConfig.defaultFloorPlanId);

  // Calculate dynamic bounds from floor plan
  const floorPlanBounds = useMemo(() => {
    const allLayers = Object.values(areaBoundsByLayer);
    if (allLayers.length === 0) {
      // Default bounds if no floor plan loaded yet
      return {
        minX: -3000, maxX: 3000, minY: -2000, maxY: 2000,
        centerX: 0, centerY: 0,
        width: 6000, height: 4000
      };
    }

    const minX = Math.min(...allLayers.map(b => b.minX));
    const maxX = Math.max(...allLayers.map(b => b.maxX));
    const minY = Math.min(...allLayers.map(b => b.minY));
    const maxY = Math.max(...allLayers.map(b => b.maxY));

    // Calculate center and dimensions
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    // Add 20% padding to dimensions
    const paddedWidth = width * 1.2;
    const paddedHeight = height * 1.2;

    return {
      minX,
      maxX,
      minY,
      maxY,
      centerX,
      centerY,
      width: paddedWidth,
      height: paddedHeight
    };
  }, [areaBoundsByLayer]);
  // Configure camera frustum and position dynamically based on floor plan bounds
  useEffect(() => {
    if (cameraRef.current && !selectedEvent) { // Only center on floor plan if no event is selected
      const camera = cameraRef.current;
      // Position camera at the center of the floor plan
      camera.position.set(floorPlanBounds.centerX, floorPlanBounds.centerY, 400);

      // Set frustum relative to camera position (symmetric around center)
      const halfWidth = floorPlanBounds.width / 2;
      const halfHeight = floorPlanBounds.height / 2;

      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    }

    // Update OrbitControls target to the center of the floor plan
    if (controlsRef.current && !selectedEvent) {
      controlsRef.current.target.set(floorPlanBounds.centerX, floorPlanBounds.centerY, 0);
      controlsRef.current.update();
    }
  }, [floorPlanBounds, selectedEvent]);

  // Move and zoom camera to focus on selected event object
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) {
      return;
    }

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // If no event is selected, zoom back out to show full floor plan
    if (!selectedEvent || !selectedEvent.objects || selectedEvent.objects.length === 0) {
      // Smooth transition back to floor plan view
      const duration = 1000;
      const startTime = Date.now();
      const startZoom = camera.zoom;
      const startTarget = controls.target.clone();
      const startPosition = camera.position.clone();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate zoom back to default (1)
        camera.zoom = startZoom + (1 - startZoom) * eased;
        camera.updateProjectionMatrix();

        // Move camera position back to floor plan center
        camera.position.x = startPosition.x + (floorPlanBounds.centerX - startPosition.x) * eased;
        camera.position.y = startPosition.y + (floorPlanBounds.centerY - startPosition.y) * eased;

        // Interpolate target back to floor plan center
        controls.target.x = startTarget.x + (floorPlanBounds.centerX - startTarget.x) * eased;
        controls.target.y = startTarget.y + (floorPlanBounds.centerY - startTarget.y) * eased;
        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
      return;
    }

    // Focus on the first object
    const firstObject = selectedEvent.objects[0];

    // Estimate object size (default to 500 if not provided)
    const objectWidth = firstObject.width || 500;
    const objectHeight = firstObject.height || 500;

    // Calculate appropriate zoom level based on object size
    // Smaller objects need more zoom, larger objects need less
    const maxDimension = Math.max(objectWidth, objectHeight);

    // Zoom factor: show object with some padding (2x the object size for better view)
    const targetViewSize = maxDimension * 2;

    // Calculate zoom relative to current frustum
    const currentViewSize = Math.max(
      Math.abs(camera.right - camera.left),
      Math.abs(camera.top - camera.bottom)
    );

    const zoomFactor = currentViewSize / targetViewSize;

    // Apply zoom (minimum 1, maximum 5 for reasonable limits)
    const newZoom = Math.max(1, Math.min(5, zoomFactor));

    // Smooth transition to new position and zoom
    const duration = 1000; // 1 second animation
    const startTime = Date.now();
    const startZoom = camera.zoom;
    const startTarget = controls.target.clone();
    const startPosition = camera.position.clone();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate zoom while maintaining orthographic projection
      camera.zoom = startZoom + (newZoom - startZoom) * eased;
      camera.updateProjectionMatrix();

      // Move camera position to follow target (maintain same Z height)
      camera.position.x = startPosition.x + (firstObject.x - startPosition.x) * eased;
      camera.position.y = startPosition.y + (firstObject.y - startPosition.y) * eased;

      // Interpolate target position (OrbitControls target)
      controls.target.x = startTarget.x + (firstObject.x - startTarget.x) * eased;
      controls.target.y = startTarget.y + (firstObject.y - startTarget.y) * eased;
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [selectedEvent, floorPlanBounds.centerX, floorPlanBounds.centerY]);

  // Smooth loading progress
  useEffect(() => {
    if (smoothProgress < progress) {
      const id = requestAnimationFrame(() =>
        setSmoothProgress(prev => Math.min(prev + 1, progress))
      );
      return () => cancelAnimationFrame(id);
    }
  }, [progress, smoothProgress]);

  // Auto-select first table area when floor plan loads
  useEffect(() => {
    if (currentFloorPlan?.tableAreas && currentFloorPlan.tableAreas.length > 0 && !selectedTableArea) {
      selectTableArea(currentFloorPlan.tableAreas[0]);
    }
  }, [currentFloorPlan, selectedTableArea, selectTableArea]);

  // Update table arrangement when guest count or selected table area changes
  useEffect(() => {
    if (guestCount > 0) {
      // Use selected table area if available, otherwise use default (first table area)
      const tableConfig = selectedTableArea || currentFloorPlan?.tableAreas[0];

      if (selectedStage) {
        // Check if it's a custom stage
        if (selectedStage.isCustom) {
          // For custom stages, position table area 15 feet after the stage
          const updatedTableConfig = calculateTableAreaAfterStage(selectedStage, tableConfig, 15);
          setTableArrangement(guestCount, updatedTableConfig, currentFloorPlan?.doorAreas);
        } else {
          // For predefined stages, use existing logic
          (async () => {
            try {
              // Get DXF data for stage calculations
              const dxfData = await getStageDXFData(selectedStage, currentFloorPlan?.fileName);
              
              if (dxfData) {
                // Calculate table area points with DXF data
                const tableAreaPoints = handleStageSelection(
                  selectedStage, 
                  tableConfig, 
                  // dxfData.dxfUnits, 
                  'inches',
                  dxfData.stageDxf
                );
                const updatedTableConfig = updateTableAreaPoints(tableConfig, tableAreaPoints);
                setTableArrangement(guestCount, updatedTableConfig, currentFloorPlan?.doorAreas);
              } else {
              // Fallback to basic calculation without DXF
              const tableAreaPoints = handleStageSelection(selectedStage, tableConfig, 'inches');
              const updatedTableConfig = updateTableAreaPoints(tableConfig, tableAreaPoints);
              setTableArrangement(guestCount, updatedTableConfig, currentFloorPlan?.doorAreas);
              }
            } catch (error) {
              console.error('Error calculating tables:', error);
              // Fallback to basic calculation without DXF
              const tableAreaPoints = handleStageSelection(selectedStage, tableConfig, 'inches');
              const updatedTableConfig = updateTableAreaPoints(tableConfig, tableAreaPoints);
              setTableArrangement(guestCount, updatedTableConfig, currentFloorPlan?.doorAreas);
            }
          })();
        }
      } else {
        if (tableConfig) {
          setTableArrangement(guestCount, tableConfig, currentFloorPlan?.doorAreas);
        }
      }
    } else {
      // Clear tables if no guests
      setTableArrangement(0, selectedTableArea || currentFloorPlan?.tableAreas[0] || {} as any, currentFloorPlan?.doorAreas);
    }
  }, [guestCount, selectedTableArea, setTableArrangement, currentFloorPlan, selectedStage]);

  // Handle stage selection and positioning
  useEffect(() => {
    if (selectedStage && currentFloorPlan) {
      // Get corner points from floor plan
      const cornerPoints = getCornerPoints(currentFloorPlan);
      
      if (cornerPoints && !selectedStage.isCustom) {
        // Position predefined stage based on corner points (default to topLeft & bottomLeft as start)
        const positionedStage = positionStageFromCorners(selectedStage, cornerPoints, 'topLeft');
        addStage(positionedStage);
      } else {
        // For custom stages or when no corner points, use the stage as-is
        addStage(selectedStage);
      }
    } else if (!selectedStage) {
      // Clear stages when no stage is selected
      clearStages();
    }
  }, [selectedStage, currentFloorPlan, addStage, clearStages]);

  // Get current table stats
  const tableStats = getTableStats(guestCount);

  const handleObjectDrag = useCallback((id: string, newPosition: { x: number; y: number }) => {
    // Get the object being dragged
    const draggedObject = objects.find(obj => obj.id === id);
    if (!draggedObject) return;

    // If it's a stage, apply boundary constraints
    if (draggedObject.type === 'stage' && currentFloorPlan) {
      const cornerPoints = getCornerPoints(currentFloorPlan);
      if (cornerPoints) {
        // Constrain position to stay within bounds
        const constrainedPosition = constrainPositionToBounds(
          newPosition.x,
          newPosition.y,
          draggedObject.width,
          draggedObject.height,
          cornerPoints
        );
        
        // Update the object with constrained position
        updateObject(id, constrainedPosition);
        
        // If it's a custom stage, also update the stage config
        if (selectedStage && selectedStage.isCustom) {
          // Update the selected stage coordinates
          const updatedStage = { ...selectedStage, x: constrainedPosition.x, y: constrainedPosition.y };
          // This will trigger the stage update callback
          if (onStageUpdate) {
            onStageUpdate(updatedStage);
          }
        }
      } else {
        // No boundary constraints, update normally
        updateObject(id, newPosition);
      }
    } else {
      // For non-stage objects, update normally
      updateObject(id, newPosition);
    }
  }, [updateObject, objects, currentFloorPlan, selectedStage]);

  const handleCanvasClick = useCallback((event: any) => {

    if (isSelectingCustomArea && event.point) {
      // Add point for custom area selection
      const point = {
        x: Math.round(event.point.x * 100) / 100,
        y: Math.round(event.point.y * 100) / 100
      };
      addCustomAreaPoint(point);
    } else {
      selectObject(null);
    }
  }, [selectObject, isSelectingCustomArea, addCustomAreaPoint]);

  // Handle mouse move for hover coordinates
  const handleMouseMove = useCallback((event: any) => {
    if (event.point) {
      const coords = {
        x: Math.round(event.point.x * 100) / 100,
        y: Math.round(event.point.y * 100) / 100
      };
      setHoverCoordinates(coords);
    }
  }, [setHoverCoordinates]);

  // Handle mouse leave to clear coordinates
  const handleMouseLeave = useCallback(() => {
    setHoverCoordinates(null);
  }, [setHoverCoordinates]);

  // Handle table area selection
  // const handleTableAreaClick = useCallback((tableArea: any) => {
  //   selectTableArea(tableArea);
  // }, [selectTableArea]);

  // // Handle custom area selection start
  // const handleStartCustomArea = useCallback(() => {
  //   startCustomAreaSelection();
  // }, [startCustomAreaSelection]);

  // Handle clear custom area
  // const handleClearCustomArea = useCallback(() => {
  //   clearCustomAreaSelection();
  // }, [clearCustomAreaSelection]);

  /** ✅ UI Handlers */
  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.zoom *= 1.2;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.zoom /= 1.2;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // const handlePan = (dx: number, dy: number) => {
  //   if (cameraRef.current) {
  //     cameraRef.current.position.x += dx;
  //     cameraRef.current.position.y += dy;
  //     controlsRef.current?.update();
  //   }
  // };

  return (
    <div className="relative w-full h-screen">

      {/* Loading Bar */}
      {smoothProgress < 100 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3/4 h-4 bg-gray-300 rounded z-50">
          <div
            className="h-full bg-blue-500 rounded transition-all duration-150"
            style={{ width: `${smoothProgress}%` }}
          />
        </div>
      )}

      {/* ✅ UI Controls */}
      <div className="absolute bottom-10 right-9 z-50 flex flex-col gap-2">
        <button onClick={handleZoomIn} className="bg-gray-700 shadow px-2 py-1 rounded">➕</button>
        <button onClick={handleZoomOut} className="bg-gray-700 shadow px-2 py-1 rounded">➖</button>
      </div>

      {/* Hover Coordinates Display */}
      {/* <div className="absolute top-4 right-4 z-50 bg-blue-900 text-white p-2 rounded shadow-lg">
        <div className="text-xs">
          <p>X: {hoverCoordinates?.x?.toFixed(2) || '--'}</p>
          <p>Y: {hoverCoordinates?.y?.toFixed(2) || '--'}</p>
        </div>
      </div> */}

      {/* Table Stats Display */}
      {(tableStats.tables > 0 || tableStats.singleChairs > 0) && (
        <div className="absolute top-16 right-4 z-50 bg-gray-800 text-white p-3 rounded shadow-lg">
          <h4 className="text-sm font-semibold mb-2">Seating Arrangement</h4>
          <div className="text-xs space-y-1">
            {tableStats.tables > 0 && (
              <>
                <p>Tables: {tableStats.tables}</p>
                <p>Seats at Tables: {tableStats.chairs}</p>
              </>
            )}
            {tableStats.singleChairs > 0 && (
              <p>Single Chairs: {tableStats.singleChairs}</p>
            )}
            <p className="font-semibold text-green-400 pt-1">Total Guests: {tableStats.totalGuests}</p>
            {currentTableConfig && (
              <p className="text-gray-400 mt-2">
                Area: {currentTableConfig.name}
              </p>
            )}
            {selectedTableArea?.seatingMode && (
              <p className="text-blue-300 mt-1">
                Mode: {selectedTableArea.seatingMode}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Table Area Selection */}
      {/* <div className="absolute top-4 left-4 z-50 bg-gray-800 text-white p-3 rounded shadow-lg">
        <h4 className="text-sm font-semibold mb-2">Select Table Area</h4> */}

      {/* Custom Area Selection */}
      {/* <div className="mb-3">
          <button
            onClick={handleStartCustomArea}
            className={`w-full text-left px-2 py-1 rounded text-xs mb-2 ${
              isSelectingCustomArea ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {isSelectingCustomArea ? `Select Point ${customAreaPoints.length + 1}/4` : 'Custom Area (4 Points)'}
          </button>
          
          {isSelectingCustomArea && (
            <div className="text-xs text-yellow-300 mb-2">
              Click 4 points on canvas to define area
            </div>
          )}
          
          {customAreaPoints.length > 0 && (
            <button
              onClick={handleClearCustomArea}
              className="w-full text-left px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-500"
            >
              Clear Custom Area
            </button>
          )}
        </div> */}

      {/* Predefined Areas */}
      {/* {currentFloorPlan?.tableAreas && (
          <>
            <div className="text-xs text-gray-300 mb-2">
              Predefined Areas: {currentFloorPlan.tableAreas.length}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => handleTableAreaClick(null)}
                className={`w-full text-left px-2 py-1 rounded text-xs ${
                  !selectedTableArea ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                Default (First Area)
              </button>
              {currentFloorPlan.tableAreas.map((area: any) => (
                <button
                  key={area.id}
                  onClick={() => handleTableAreaClick(area)}
                  className={`w-full text-left px-2 py-1 rounded text-xs ${
                    selectedTableArea?.id === area.id ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {area.name}
                </button>
              ))}
            </div>
          </>
        )} */}
      {/* </div> */}

      {/* Canvas */}
      <Canvas
        orthographic
        camera={{ zoom: 5, position: [floorPlanBounds.centerX, floorPlanBounds.centerY, 400] }}
        onPointerMissed={handleCanvasClick}
        onPointerMove={handleMouseMove}
        onPointerLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      >
        <OrthographicCamera makeDefault ref={cameraRef} position={[floorPlanBounds.centerX, floorPlanBounds.centerY, 400]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />

        <OrbitControls
          ref={controlsRef}
          enableRotate={false}
          enablePan={true}
          enableZoom={true}
          zoomSpeed={1.2}
          panSpeed={1.2}
          target={[floorPlanBounds.centerX, floorPlanBounds.centerY, 0]}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
          enableDamping={true}
          dampingFactor={0.05}
        />

        {/* <group position={[floorPlanBounds.centerX, floorPlanBounds.centerY, 0]}>
          <primitive
          object={
            new THREE.GridHelper(
              Math.max(
                floorPlanBounds.maxX - floorPlanBounds.minX,
                floorPlanBounds.maxY - floorPlanBounds.minY
              ),
              20,
              'red',
              '#222'
            )
          }
          rotation={[Math.PI / 2, 0, 0]}
        />
        </group> */}

        {/* Background plane for click detection */}
        {/* Invisible plane for mouse interaction - dynamically sized based on floor plan */}
        <mesh
          position={[
            (floorPlanBounds.minX + floorPlanBounds.maxX) / 2,
            (floorPlanBounds.minY + floorPlanBounds.maxY) / 2,
            -0.1
          ]}
          onClick={handleCanvasClick}
          onPointerMove={handleMouseMove}
        >
          <planeGeometry args={[
            floorPlanBounds.maxX - floorPlanBounds.minX,
            floorPlanBounds.maxY - floorPlanBounds.minY
          ]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Floor Plan */}
        <AdvancedDXFModel
          url={`/${currentFloorPlan?.fileName || 'floor-plan.dxf'}`}
          onProgress={p => setProgress(p)}
          onAreaBounds={setAreaBoundsByLayer}
          position={[floorPlanBounds.centerX, floorPlanBounds.centerY, 0]}
          stageConfig={{
            rotation: currentFloorPlan?.rotation ?? 0
          }}
        />

        {/* Render selected stage DXF */}
        {selectedStage && (
          selectedStage.isSimpleStage ? (
            // Render simple rectangle stage
            <group 
              key={`stage-${selectedStage.id}`} 
              position={[selectedStage.x, selectedStage.y, 0.2]}
              rotation={[0, 0, (selectedStage.rotation ?? 0) * (Math.PI / 180)]}
            >
              {/* Stage platform */}
              <mesh>
                <boxGeometry args={[selectedStage.customWidth || 200, selectedStage.customHeight || 100, 2]} />
                <meshStandardMaterial 
                  color="#8B4513" 
                  roughness={0.6} 
                  metalness={0.1}
                />
              </mesh>
              {/* Stage outline */}
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(selectedStage.customWidth || 200, selectedStage.customHeight || 100, 2)]} />
                <lineBasicMaterial color="#000000" linewidth={2} />
              </lineSegments>
              {/* Stage grid pattern */}
                {/* <gridHelper 
                  args={[
                    Math.max(selectedStage.customWidth || 200, selectedStage.customHeight || 100), 
                    10, 
                    '#666666', 
                    '#444444'
                  ]} 
                  rotation={[Math.PI / 2, 0, 0]}
                  position={[0, 0, 1.1]}
                /> */}
            </group>
          ) : (
            // Render DXF model stage
            <AdvancedDXFModel
              key={`stage-${selectedStage.id}`}
              url={`/${selectedStage.fileName}`}
              onProgress={() => { }}
              position={[selectedStage.x, selectedStage.y, 0.2]}
              isStage={true}
              stageConfig={selectedStage}
            />
          )
        )}

        {/* Render selected event objects */}
        {selectedEvent && selectedEvent.objects.map((eventObject) => {
          // Use SimpleDxfOverlay for models-photoshoot and camera_man (simpler, more reliable rendering)
          if (eventObject.fileName === 'camera_man.dxf' || eventObject.fileName === 'female_model.dxf') {
            return (
              <SimpleDxfOverlay
                key={`event-${selectedEvent.id}-${eventObject.id}`}
                dxfUrl={`/${eventObject.fileName}`}
                position={[eventObject.x, eventObject.y, 0.15]}
                color={'#000'}
                width={eventObject.width}
                height={eventObject.height}
                rotation={eventObject.rotation}
              />
            );
          }

          // Use AdvancedDXFModel for other event objects
          return (
            <AdvancedDXFModel
              key={`event-${selectedEvent.id}-${eventObject.id}`}
              url={`/${eventObject.fileName}`}
              onProgress={() => { }}
              position={[eventObject.x, eventObject.y, 0.15]}
              isStage={true}
              highlightColor={eventObject.color}
              stageConfig={{
                id: eventObject.id,
                name: eventObject.name,
                fileName: eventObject.fileName,
                x: eventObject.x,
                y: eventObject.y,
                width: eventObject.width,
                height: eventObject.height,
                rotation: eventObject.rotation || 0,
                description: eventObject.description
              }}
            />
          );
        })}

        {/* Render custom area selection points */}
        {customAreaPoints.map((point, index) => (
          <mesh key={`custom-point-${index}`} position={[point.x, point.y, 0.1]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        ))}

        {/* Render custom area polygon */}
        {customAreaPoints.length === 4 && (
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial
              color="#00ff00"
              transparent
              opacity={0.1}
            />
          </mesh>
        )}

        {/* Render door areas */}
        {/* {currentFloorPlan?.doorAreas?.map((doorArea: DoorArea) => {
          const bounds = {
            minX: Math.min(doorArea.topLeft.x, doorArea.topRight.x, doorArea.bottomRight.x, doorArea.bottomLeft.x),
            maxX: Math.max(doorArea.topLeft.x, doorArea.topRight.x, doorArea.bottomRight.x, doorArea.bottomLeft.x),
            minY: Math.min(doorArea.topLeft.y, doorArea.topRight.y, doorArea.bottomRight.y, doorArea.bottomLeft.y),
            maxY: Math.max(doorArea.topLeft.y, doorArea.topRight.y, doorArea.bottomRight.y, doorArea.bottomLeft.y)
          };
          
          const width = bounds.maxX - bounds.minX;
          const height = bounds.maxY - bounds.minY;
          const centerX = (bounds.minX + bounds.maxX) / 2;
          const centerY = (bounds.minY + bounds.maxY) / 2;

          // Color based on door type
          const doorColor = doorArea.type === 'emergency' ? '#FF0000' 
            : doorArea.type === 'entrance' ? '#00FF00'
            : doorArea.type === 'exit' ? '#FFA500'
            : '#FFFF00';

          return (
            <group key={`door-${doorArea.id}`}>
              <mesh position={[centerX, centerY, 0.05]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color={doorColor} transparent opacity={0.15} />
              </mesh>
              <lineSegments position={[centerX, centerY, 0.06]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
                <lineBasicMaterial color={doorColor} linewidth={2} />
              </lineSegments>
            </group>
          );
        })} */}

        {/* Render custom area polygon outline */}
        {/* {customAreaPoints.length === 4 && (
          <primitive
            object={new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([
                ...customAreaPoints.map(p => new THREE.Vector3(p.x, p.y, 0.1)),
                new THREE.Vector3(customAreaPoints[0].x, customAreaPoints[0].y, 0.1) // Close the polygon
              ]),
              new THREE.LineBasicMaterial({ color: '#00ff00', linewidth: 2 })
            )}
          />
        )} */}

        {/* Render venue boundary for stage constraints */}
        {/* {currentFloorPlan?.cornerPoints && (
          <primitive
            object={new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(currentFloorPlan.cornerPoints.topLeft.x, currentFloorPlan.cornerPoints.topLeft.y, 0.02),
                new THREE.Vector3(currentFloorPlan.cornerPoints.topRight.x, currentFloorPlan.cornerPoints.topRight.y, 0.02),
                new THREE.Vector3(currentFloorPlan.cornerPoints.bottomRight.x, currentFloorPlan.cornerPoints.bottomRight.y, 0.02),
                new THREE.Vector3(currentFloorPlan.cornerPoints.bottomLeft.x, currentFloorPlan.cornerPoints.bottomLeft.y, 0.02),
                new THREE.Vector3(currentFloorPlan.cornerPoints.topLeft.x, currentFloorPlan.cornerPoints.topLeft.y, 0.02) // Close the rectangle
              ]),
              new THREE.LineBasicMaterial({ color: '#ff6b35', linewidth: 3, transparent: true, opacity: 0.6 })
            )}
          />
        )} */}

        {/* Render selected table area outline */}
        {/* {currentTableConfig && currentTableConfig.namedPoints && (
          <primitive
            object={new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(currentTableConfig.namedPoints.topLeft.x, currentTableConfig.namedPoints.topLeft.y, 0.15),
                new THREE.Vector3(currentTableConfig.namedPoints.topRight.x, currentTableConfig.namedPoints.topRight.y, 0.15),
                new THREE.Vector3(currentTableConfig.namedPoints.bottomRight.x, currentTableConfig.namedPoints.bottomRight.y, 0.15),
                new THREE.Vector3(currentTableConfig.namedPoints.bottomLeft.x, currentTableConfig.namedPoints.bottomLeft.y, 0.15),
                new THREE.Vector3(currentTableConfig.namedPoints.topLeft.x, currentTableConfig.namedPoints.topLeft.y, 0.15) // Close the polygon
              ]),
              new THREE.LineBasicMaterial({ color: '#ffff00', linewidth: 3 })
            )}
          />
        )} */}

        {/* Render selected table area bounds (for non-polygon areas) */}
        {currentTableConfig && !currentTableConfig.namedPoints && (
          <primitive
            object={new THREE.Line(
              new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(currentTableConfig.startX, currentTableConfig.startY, 0.15),
                new THREE.Vector3(currentTableConfig.endX, currentTableConfig.startY, 0.15),
                new THREE.Vector3(currentTableConfig.endX, currentTableConfig.endY, 0.15),
                new THREE.Vector3(currentTableConfig.startX, currentTableConfig.endY, 0.15),
                new THREE.Vector3(currentTableConfig.startX, currentTableConfig.startY, 0.15) // Close the rectangle
              ]),
              new THREE.LineBasicMaterial({ color: '#ffff00', linewidth: 3 })
            )}
          />
        )}

        {/* Render objects - tables and chairs are fixed (non-draggable), others are draggable */}
        {objects.map((object: HallObject) => {
          // Tables and chairs are fixed from calculation - render without drag functionality
          if (object.type === 'table' || object.type === 'chair') {
            return (
              <group
                key={object.id}
                position={[object.x, object.y, 0]}
                rotation={[0, 0, (object.rotation ?? 0) * (Math.PI / 180)]}
              >
                <DXFTableRenderer object={object} />
              </group>
            );
          }

          // Other objects (stages, etc.) - can be made draggable or not
          return (
            <DraggableObject
              key={object.id}
              object={object}
              onDrag={handleObjectDrag}
              isSelected={selectedObjectId === object.id}
              onSelect={selectObject}
              controlsRef={controlsRef}
              isDraggable={true} // Set to true to enable dragging, false to disable
            />
          );
        })}
      </Canvas>
    </div>
  );
}