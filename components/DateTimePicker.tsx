'use client';

import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
}

const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ selected, onChange, className = '', placeholder = 'Select date and time' }, ref) => {
    return (
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MM/dd/yyyy, h:mm aa"
        placeholderText={placeholder}
        className={`w-full px-4 text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400 ${className}`}
        calendarClassName="techno-datepicker"
        wrapperClassName="w-full"
        popperClassName="techno-datepicker-popper"
        ref={ref}
      />
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;
