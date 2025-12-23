export type HallObjectType = 'stage' | 'table' | 'chair';

export interface HallObject {
  id: string;
  type: HallObjectType;
  x: number; // X position on canvas
  y: number; // Y position on canvas
  width: number;
  height: number;
  rotation?: number; // in degrees
  tableIndex?: number; // For table objects - which table in the arrangement
  chairIndex?: number; // For chair objects - which chair around the table
  parentTableId?: string; // For chair objects - reference to parent table
  fileName?: string; // DXF file path for rendering
  isSimpleStage?: boolean; // For stage objects - indicates if it's a simple rectangle stage
}

export interface TableArrangement {
  tableConfigId: string;
  positions: Array<{ x: number; y: number; tableIndex: number }>;
  totalTables: number;
  totalChairs: number;
  totalGuests: number;
}