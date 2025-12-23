export interface EventObjectConfig {
    id: string;
    name: string;
    fileName: string;
    x: number;
    y: number;
    width?: number; // Auto-calculated from DXF if not provided
    height?: number; // Auto-calculated from DXF if not provided
    rotation?: number; // Rotation in degrees
    color?: string; // OPTIONAL: Override ALL colors in DXF with single color (e.g., '#FFD700')
    // WARNING: Leave undefined to preserve original DXF colors and designs
    // Only use if you want a single-color highlight effect
    description?: string;
}

export interface EventConfig {
    id: string;
    name: string;
    description?: string;
    objects: EventObjectConfig[]; // Multiple objects can be part of an event
}

export const predefinedEvents: EventConfig[] = [
    {
        id: 'toifa',
        name: 'Toifa',
        description: 'Toifa event with custom decorative elements',
        objects: [
            {
                id: 'toifa-main',
                name: 'Toifa Brand Logo',
                fileName: 'toifa.dxf',
                x: 1070,
                y: 850,
                rotation: 0,
                color: '#FFD700', // Gold color for Toifa branding
                description: 'Toifa Brand Logo'
            },
            {
                id: 'toifa-car',
                name: 'Toifa Car',
                fileName: 'toifa_car.dxf',
                x: 700,
                y: 760,
                rotation: 0,
                width: 15,
                height: 15,
                description: 'Toifa Car'
            },
            // {
            //     id: 'models-photoshoot',
            //     name: 'Models Photoshoot',
            //     fileName: 'models-photoshoot.dxf',
            //     x: -245.31, // Actual position from DXF file
            //     y: 2391.18, // Actual position from DXF file  
            //     rotation: 0,
            //     // color: '#00FF00', // Bright green for high visibility
            //     width: 200, // Moderate size with 50x scale (85 * 50)
            //     height: 500, // Moderate size with 50x scale (167 * 50)
            //     description: 'Models Photoshoot - 2 Cameras + 1 Model'
            // },
            {
                id: 'console',
                name: 'Console',
                fileName: 'console.dxf',
                x: 3150,
                y: 1500,
                rotation: -90,
                description: 'Console'
            },
            {
                id: 'stall-1',
                name: 'Stall 1',
                fileName: 'stall_2.dxf',
                x: 648,
                y: 2030,
                rotation: -90,
                // color: 'yellow',
                width: 108,
                height: 108,
                description: 'Stall 1'
            },
            {
                id: 'stall-2',
                name: 'Stall 2',
                fileName: 'stall_2.dxf',
                x: 648,
                y: 1858,
                rotation: -90,
                width: 108,
                height: 108,
                description: 'Stall 2'
            },
            {
                id: 'stall-3',
                name: 'Stall 3',
                fileName: 'stall_2.dxf',
                x: 648,
                y: 1697,
                rotation: -90,
                width: 108,
                height: 108,
                description: 'Stall 3'
            },
            {
                id: 'stall-4',
                name: 'Stall 4',
                fileName: 'stall_2.dxf',
                x: 648,
                y: 1540,
                rotation: -90,
                width: 108,
                height: 108,
                description: 'Stall 4'
            },
            {
                id: 'stall-5',
                name: 'Stall 5',
                fileName: 'stall_1.dxf',
                x: 455,
                y: 1850,
                rotation: 90,
                width: 108,
                height: 108,
                description: 'Stall 5'
            },
            {
                id: 'stall-6',
                name: 'Stall 6',
                fileName: 'stall_2.dxf',
                x: 455,
                y: 1697,
                rotation: 0,
                width: 108,
                height: 108,
                description: 'Stall 6'
            },
            {
                id: 'back-stall-1',
                name: 'Back Stall 1',
                fileName: 'bar_stool.dxf',
                x: -305,
                y: 1940,
                rotation: 0,
                description: 'Back Stall 1'
            },
            {
                id: 'back-stall-2',
                name: 'Back Stall 2',
                fileName: 'bar_stool.dxf',
                x: -177,
                y: 1940,
                rotation: 0,
                description: 'Back Stall 2'
            },
            {
                id: 'back-stall-3',
                name: 'Back Stall 3',
                fileName: 'bar_stool.dxf',
                x: -355,
                y: 1870,
                rotation: 0,
                description: 'Back Stall 3'
            },
            {
                id: 'back-stall-4',
                name: 'Back Stall 4',
                fileName: 'bar_stool.dxf',
                x: -245,
                y: 1870,
                rotation: 0,
                description: 'Back Stall 4'
            },
            {
                id: 'back-stall-5',
                name: 'Back Stall 5',
                fileName: 'bar_stool.dxf',
                x: -135,
                y: 1870,
                rotation: 0,
                description: 'Back Stall 5'
            },
            {
                id: 'back-stall-6',
                name: 'Back Stall 6',
                fileName: 'bar_stool.dxf',
                x: -305,
                y: 1790,
                rotation: 0,
                description: 'Back Stall 6'
            },
            {
                id: 'back-stall-7',
                name: 'Back Stall 7',
                fileName: 'bar_stool.dxf',
                x: -177,
                y: 1790,
                rotation: 0,
                description: 'Back Stall 7'
            },
            {
                id: 'cameraman-1',
                name: 'Cameraman 1',
                fileName: 'camera_man.dxf',
                x: -350,
                y: 2300,
                rotation: 180,
                width: 70,
                height: 140,
                description: 'Cameraman 1'
            },
            {
                id: 'cameraman-2',
                name: 'Cameraman 2',
                fileName: 'camera_man.dxf',
                x: -115,
                y: 2300,
                rotation: 180,
                width: 70,
                height: 140,
                description: 'Cameraman 2'
            },
            {
                id: 'female-model',
                name: 'Female Model',
                fileName: 'female_model.dxf',
                x: -238,
                y: 2562,
                rotation: 0,
                width: 40,
                height: 80,
                description: 'Female Model'
            },
            {
                id: 'console-camera-man-1',
                name: 'Console Camera Man 1',
                fileName: 'camera_man.dxf',
                x: 3130,
                y: 1584,
                rotation: -90,
                width: 40,
                height: 80,
                description: 'Console Camera Man 1'
            },
            {
                id: 'console-camera-man-2',
                name: 'Console Camera Man 2',
                fileName: 'camera_man.dxf',
                x: 3130,
                y: 1550,
                rotation: -90,
                width: 40,
                height: 80,
                description: 'Console Camera Man 2'
            },
            {
                id: 'console-camera-man-3',
                name: 'Console Camera Man 3',
                fileName: 'camera_man.dxf',
                x: 3130,
                y: 1515,
                rotation: -90,
                width: 40,
                height: 80,
                description: 'Console Camera Man 3'
            }
        ]
    }
];

export const getEventConfig = (eventId: string): EventConfig | undefined => {
    return predefinedEvents.find(event => event.id === eventId);
};

