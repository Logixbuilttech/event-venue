export interface StageConfig {
  id: string;
  name: string;
  fileName: string;
  x: number;
  y: number;
  width?: number; // Auto-calculated from DXF if not provided
  height?: number; // Auto-calculated from DXF if not provided
  rotation?: number; // Rotation in degrees
  description?: string;
  isCustom?: boolean; // Flag to indicate if this is a custom stage
  isSimpleStage?: boolean; // Flag to indicate if this is a simple rectangle stage (no DXF file)
  customWidth?: number; // Custom width for custom stages
  customHeight?: number; // Custom height for custom stages
  customFile?: File; // Custom DXF file uploaded by the user
  customFilePath?: string; // Path to the custom DXF file
}

export const predefinedStages: StageConfig[] = [
  {
    id: 'infinity-toifa-stage',
    name: 'Toifa Stage',
    fileName: 'toifa_stage.dxf',
    x: 950,
    y: 1520,
    rotation: 90,
    width: 1140,
    description: 'Special Toifa stage design for Infinity Ballroom'
  },
  {
    id: 'custom-stage',
    name: 'Custom Stage',
    fileName: 'stage.dxf',
    x: 950,
    y: 1520,
    rotation: 0,
    isCustom: true,
    customWidth: 200,
    customHeight: 100,
    description: 'Custom stage with user-defined dimensions'
  }
];

export const getStageConfig = (stageId: string): StageConfig | undefined => {
  return predefinedStages.find(stage => stage.id === stageId);
};
