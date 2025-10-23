'use client';

import { useEffect, useState, useCallback } from 'react';
import { Participant } from '@/lib/api';
import { Candidate } from '@/types';

interface TravelChartProps {
  participants: Participant[];
  selectedCandidate: Candidate;
  participantColors: Map<string, string>;
  travelMode: any;
  apiKey: string;
  selectedParticipantId: string | null;
  onParticipantClick: (participantId: string) => void;
}

interface TravelData {
  participantId: string;
  distance: number; // in meters
  duration: number; // in seconds
}

// Helper to format time (minutes or hours + minutes)
function formatTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}

// Helper to format distance
function formatDistance(meters: number): string {
  const miles = meters / 1609.34; // Convert meters to miles
  return `${miles.toFixed(1)} mi`;
}

export default function TravelChart({
  participants,
  selectedCandidate,
  participantColors,
  travelMode,
  apiKey,
  selectedParticipantId,
  onParticipantClick,
}: TravelChartProps) {
  const [travelData, setTravelData] = useState<TravelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredParticipantId, setHoveredParticipantId] = useState<string | null>(null);

  // Fetch travel data using Google Distance Matrix API
  const fetchTravelData = useCallback(async () => {
    if (!window.google?.maps || participants.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const service = new google.maps.DistanceMatrixService();
      const origins = participants.map(
        (p) => new google.maps.LatLng(p.fuzzy_lat || p.lat, p.fuzzy_lng || p.lng)
      );
      const destination = new google.maps.LatLng(selectedCandidate.lat, selectedCandidate.lng);

      const request = {
        origins,
        destinations: [destination],
        travelMode: travelMode || google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      };

      service.getDistanceMatrix(request, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const data: TravelData[] = [];
          response.rows.forEach((row, index) => {
            const element = row.elements[0];
            if (element.status === google.maps.DistanceMatrixElementStatus.OK) {
              data.push({
                participantId: participants[index].id,
                distance: element.distance.value,
                duration: element.duration.value,
              });
            }
          });
          setTravelData(data);
        } else {
          console.error('Distance Matrix request failed:', status);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error fetching travel data:', error);
      setLoading(false);
    }
  }, [participants, selectedCandidate, travelMode]);

  useEffect(() => {
    fetchTravelData();
  }, [fetchTravelData]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 border-2 border-black">
        <div className="text-xs text-black font-bold">Loading travel data...</div>
      </div>
    );
  }

  if (travelData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 border-2 border-black">
        <div className="text-xs text-black">No travel data available</div>
      </div>
    );
  }

  // Calculate axis limits
  const maxDuration = Math.max(...travelData.map((d) => d.duration));
  const maxDistance = Math.max(...travelData.map((d) => d.distance));

  // Time axis: max * 1.3, rounded up to nearest 5 minutes
  const maxDurationMinutes = maxDuration / 60;
  const timeLimit = Math.ceil((maxDurationMinutes * 1.3) / 5) * 5;
  const timeLimitSeconds = timeLimit * 60;

  // Distance axis: max * 1.4
  const distanceLimit = maxDistance * 1.4;

  // Chart dimensions
  const chartWidth = 320;
  const chartHeight = 180;
  const paddingLeft = 56; // Increased from 40 to move chart right by ~5%
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Draw axes
  const yAxisTicks = 5;
  const xAxisTicks = 5;

  return (
    <div className="bg-white">
      <svg width={chartWidth} height={chartHeight} className="overflow-visible">
        {/* Y-axis (Time) */}
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + plotHeight}
          stroke="black"
          strokeWidth="2"
        />

        {/* X-axis (Distance) */}
        <line
          x1={paddingLeft}
          y1={paddingTop + plotHeight}
          x2={paddingLeft + plotWidth}
          y2={paddingTop + plotHeight}
          stroke="black"
          strokeWidth="2"
        />

        {/* Y-axis ticks and labels (Time) */}
        {Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
          const seconds = (timeLimitSeconds / yAxisTicks) * i;
          const y = paddingTop + plotHeight - (plotHeight / yAxisTicks) * i;
          return (
            <g key={`y-${i}`}>
              <line
                x1={paddingLeft - 3}
                y1={y}
                x2={paddingLeft}
                y2={y}
                stroke="black"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-[8px] fill-black font-mono"
              >
                {formatTime(seconds)}
              </text>
            </g>
          );
        })}

        {/* X-axis ticks and labels (Distance) */}
        {Array.from({ length: xAxisTicks + 1 }).map((_, i) => {
          const meters = (distanceLimit / xAxisTicks) * i;
          const x = paddingLeft + (plotWidth / xAxisTicks) * i;
          return (
            <g key={`x-${i}`}>
              <line
                x1={x}
                y1={paddingTop + plotHeight}
                x2={x}
                y2={paddingTop + plotHeight + 3}
                stroke="black"
                strokeWidth="1"
              />
              <text
                x={x}
                y={paddingTop + plotHeight + 12}
                textAnchor="middle"
                className="text-[8px] fill-black font-mono"
              >
                {formatDistance(meters)}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={paddingLeft / 2}
          y={paddingTop + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 16, ${paddingTop + plotHeight / 2})`}
          className="text-[9px] fill-black font-bold uppercase"
        >
          Time
        </text>
        <text
          x={paddingLeft + plotWidth / 2}
          y={chartHeight - 1}
          textAnchor="middle"
          className="text-[9px] fill-black font-bold uppercase"
        >
          Distance
        </text>

        {/* Plot data points as triangles */}
        {travelData.map((data) => {
          const participant = participants.find((p) => p.id === data.participantId);
          if (!participant) return null;

          const color = participantColors.get(data.participantId) || '#666';
          const x = paddingLeft + (data.distance / distanceLimit) * plotWidth;
          const y = paddingTop + plotHeight - (data.duration / timeLimitSeconds) * plotHeight;

          const isSelected = selectedParticipantId === data.participantId;
          const isHovered = hoveredParticipantId === data.participantId;
          const size = isSelected || isHovered ? 8 : 6;

          // Triangle path (pointing up)
          const trianglePath = `M ${x} ${y - size} L ${x - size} ${y + size} L ${x + size} ${y + size} Z`;

          return (
            <g key={data.participantId}>
              <path
                d={trianglePath}
                fill={color}
                stroke="black"
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer transition-all"
                onClick={() => onParticipantClick(data.participantId)}
                onMouseEnter={() => setHoveredParticipantId(data.participantId)}
                onMouseLeave={() => setHoveredParticipantId(null)}
              />

              {/* No tooltip - selection is handled by two-way binding with participant list */}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
