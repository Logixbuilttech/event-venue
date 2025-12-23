'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import StageSelector from '@components/StageSelector';
import EventSelector from '@components/EventSelector';
import type { StageConfig } from '@config/stages';
import type { EventConfig } from '@config/events';
import { getVenueConfig } from '@config/venues';
import { useHallStore } from '@store/hallStore';

const HallCanvas2D = dynamic(() => import('@components/Canvas/HallCanvas2D'), { ssr: false });

export default function HallPage() {
  const searchParams = useSearchParams();
  const venueId = searchParams.get('venue') || 'infinity-ballroom';
  
  const [selectedStage, setSelectedStage] = useState<StageConfig | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventConfig | null>(null);
  const [guestCount, setGuestCount] = useState<number>(0);
  const [venueConfig, setVenueConfig] = useState<any>(null);
  const [currentFloorPlan, setCurrentFloorPlan] = useState<any>(null);
  
  // Get selected table area, seating mode setter, and manual controls from store
  const { selectedTableArea, setSeatingMode, manualTableCount, manualChairCount, setManualTableCount, setManualChairCount, getTableStats } = useHallStore();
  const { totalGuests } = getTableStats(guestCount);

  // Load venue configuration
  useEffect(() => {
    const venue = getVenueConfig(venueId);
    if (venue) {
      setVenueConfig(venue);
      const floorPlan = venue.floorPlans.find(plan => plan.id === venue.defaultFloorPlanId);
      setCurrentFloorPlan(floorPlan);
    }
  }, [venueId]);

  const handleStageSelect = (stage: StageConfig | null) => {
    setSelectedStage(stage);
  };

  const handleStageUpdate = (updatedStage: StageConfig) => {
    setSelectedStage(updatedStage);
  };

  const handleEventSelect = (event: EventConfig | null) => {
    setSelectedEvent(event);
  };

  if (!venueConfig || !currentFloorPlan) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading venue configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Controls Sidebar */}
      <div className="w-80 bg-gray-800 text-white overflow-y-auto">
        {/* Venue Info */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">{venueConfig.name}</h2>
          <p className="text-sm text-gray-400 mt-1">{venueConfig.description}</p>
          <p className="text-xs text-gray-500 mt-2">Floor Plan: {currentFloorPlan.name}</p>
        </div>

        {/* Event Selector */}
        <EventSelector 
          onEventSelect={handleEventSelect}
          selectedEvent={selectedEvent}
        />

        {/* Stage Selector */}
        <StageSelector 
          onStageSelect={handleStageSelect}
          selectedStage={selectedStage}
          onStageUpdate={handleStageUpdate}
          availableStages={currentFloorPlan.stages}
          currentFloorPlan={currentFloorPlan}
        />
        
        {/* Table Controls */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-lg font-semibold border-b border-gray-700 pb-2 mb-4">Table Setup</h3>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Total Guests:</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              min="1"
              max={selectedTableArea?.maxCapacity || 10000}
            />
            {/* {selectedTableArea?.maxCapacity && (
              <p className="text-xs text-gray-400 mt-1">
                Max table capacity: {selectedTableArea.maxCapacity} guests
              </p>
            )} */}
          </div>
          <div className="text-gray-400 mb-2">
            {guestCount > totalGuests && (
              <p className="text-red-400 text-xs">
                🚨 Guest count ({guestCount}) exceeds total seating capacity ({totalGuests}).
              </p>
            )}
          </div>
          {/* Seating Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-2">Seating Mode:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSeatingMode('auto');
                }}
                className={`px-3 py-2 rounded text-xs ${
                  (selectedTableArea?.seatingMode || 'auto') === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🤖 Smart Mix
              </button>
              <button
                onClick={() => {
                  setSeatingMode('tables-only');
                }}
                className={`px-3 py-2 rounded text-xs ${
                  selectedTableArea?.seatingMode === 'tables-only'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                🪑 Tables Only
              </button>
              <button
                onClick={() => {
                  setSeatingMode('chairs-only');
                }}
                className={`px-3 py-2 rounded text-xs ${
                  selectedTableArea?.seatingMode === 'chairs-only'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                💺 Chairs Only
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {(selectedTableArea?.seatingMode || 'auto') === 'auto' && '🤖 Smart: Max tables + single chairs to match exact guest count'}
              {selectedTableArea?.seatingMode === 'tables-only' && '🪑 Only round tables with chairs (up to max capacity)'}
              {selectedTableArea?.seatingMode === 'chairs-only' && '💺 Only single chairs arranged in rows'}
            </p>
          </div>

          <div className="text-sm text-gray-400">
            <p>Seating will be automatically calculated based on guest count and mode.</p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-100">
        <HallCanvas2D 
          selectedStage={selectedStage}
          selectedEvent={selectedEvent}
          guestCount={guestCount}
          venueConfig={venueConfig}
          floorPlan={currentFloorPlan}
          onStageUpdate={handleStageUpdate}
        />
      </div>
    </div>
  );
}