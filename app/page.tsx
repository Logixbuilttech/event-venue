'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { venueConfigs } from '@config/venues';

export default function HomePage() {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenue(venueId);
    router.push(`/hall?venue=${venueId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Event Venue Setup</h1>
          <p className="text-gray-400 mt-2">Select a venue to start planning your event</p>
        </div>
      </div>

      {/* Venue Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold mb-4">Choose Your Venue</h2>
          <p className="text-gray-400">Select from our available venues to begin setting up your event</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {venueConfigs.map((venue) => (
            <div
              key={venue.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">{venue.name.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{venue.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{venue.description}</p>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Floor Plans: {venue.floorPlans.length}</p>
                  <p>Default: {venue.floorPlans.find(p => p.id === venue.defaultFloorPlanId)?.name}</p>
                </div>

                <button onClick={() => handleVenueSelect(venue.id)} className="mt-4 w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                  Select Venue
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}