'use client';

import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ selected, onChange, className = '', placeholder = 'Select date and time', disabled = false }, ref) => {
    return (
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MM/dd/yyyy, h:mm aa"
        placeholderText={placeholder}
        className={`w-full px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400 ${className}`}
        calendarClassName="techno-datepicker"
        wrapperClassName="w-full"
        popperClassName="techno-datepicker-popper"
        disabled={disabled}
        minDate={new Date()}
        ref={ref}
      />
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;
