'use client';

import { useState, useEffect } from 'react';

interface DateTimePickerProps {
  value: string; // ISO datetime string for start time
  onChange: (value: string) => void;
  endTimeValue?: string; // Optional ISO datetime string for end time
  onEndTimeChange?: (value: string | undefined) => void;
  disabled?: boolean;
}

export default function DateTimePicker({
  value,
  onChange,
  endTimeValue,
  onEndTimeChange,
  disabled
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [hasEndTime, setHasEndTime] = useState<boolean>(false);
  const [endTime, setEndTime] = useState<string>('');

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      // Format date as YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      // Format time as HH:MM
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
    }
  }, [value]);

  // Initialize end time from prop
  useEffect(() => {
    if (endTimeValue) {
      const date = new Date(endTimeValue);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      setEndTime(timeStr);
      setHasEndTime(true);
    }
  }, [endTimeValue]);

  // Handle date change
  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (dateStr && selectedTime) {
      updateDateTime(dateStr, selectedTime);
    }
  };

  // Handle time change
  const handleTimeChange = (timeStr: string) => {
    setSelectedTime(timeStr);
    if (selectedDate && timeStr) {
      updateDateTime(selectedDate, timeStr);
    }
  };

  // Handle end time toggle
  const handleEndTimeToggle = (enabled: boolean) => {
    setHasEndTime(enabled);
    if (!enabled) {
      setEndTime('');
      onEndTimeChange?.(undefined);
    } else if (selectedDate && selectedTime) {
      // Default to 2 hours after start time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHours = (hours + 2) % 24;
      const defaultEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setEndTime(defaultEndTime);
      updateEndTime(selectedDate, defaultEndTime);
    }
  };

  // Handle end time change
  const handleEndTimeChange = (timeStr: string) => {
    setEndTime(timeStr);
    if (selectedDate && timeStr) {
      updateEndTime(selectedDate, timeStr);
    }
  };

  // Update the combined datetime value
  const updateDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const datetime = new Date(year, month - 1, day, hours, minutes);
    onChange(datetime.toISOString());
  };

  // Update end time
  const updateEndTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const datetime = new Date(year, month - 1, day, hours, minutes);
    onEndTimeChange?.(datetime.toISOString());
  };

  return (
    <div className="space-y-3">
      {/* Start Date and Time */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date Input */}
        <div>
          <label className="block text-xs font-medium text-gray-900 mb-1.5">
            Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            disabled={disabled}
            className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Start Time Input */}
        <div>
          <label className="block text-xs font-medium text-gray-900 mb-1.5">
            Start Time *
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            disabled={disabled}
            className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Add End Time Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="hasEndTime"
          checked={hasEndTime}
          onChange={(e) => handleEndTimeToggle(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 border-gray-300 focus:ring-black disabled:opacity-50"
          style={{ accentColor: '#000000' }}
        />
        <label htmlFor="hasEndTime" className="text-sm font-medium text-gray-900 cursor-pointer">
          Add end time
        </label>
      </div>

      {/* End Time Input */}
      {hasEndTime && (
        <div className="pl-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1.5">
                Same Date
              </label>
              <input
                type="date"
                value={selectedDate}
                disabled
                className="w-full px-4 py-3 text-gray-700 border border-gray-300 bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-900 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 text-black border border-gray-300 focus:border-black focus:outline-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
