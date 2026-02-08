'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface DateTimePickerProps {
    date: Date | null | undefined;
    onChange: (date: Date | null | undefined) => void;
    placeholder?: string;
}

export function DateTimePicker({
                                   date,
                                   onChange,
                                   placeholder = 'Pick date and time',
                               }: DateTimePickerProps) {
    // Convert null to undefined for useState compatibility
    const [tempDate, setTempDate] = React.useState<Date | undefined>(
        date instanceof Date ? date : undefined
    );

    const [timeValue, setTimeValue] = React.useState<string>(
        date instanceof Date ? format(date, 'HH:mm') : ''
    );

    const [open, setOpen] = React.useState(false);

    // Update tempDate when external date changes
    React.useEffect(() => {
        if (date instanceof Date) {
            setTempDate(date);
            setTimeValue(format(date, 'HH:mm'));
        } else {
            setTempDate(undefined);
            setTimeValue('');
        }
    }, [date]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            onChange(null); // Use null to match your form state
            return;
        }

        setTempDate(selectedDate);

        // If we have a time value, combine it with the selected date
        if (timeValue) {
            const [hours, minutes] = timeValue.split(':').map(Number);
            const combinedDate = new Date(selectedDate);
            combinedDate.setHours(hours || 0, minutes || 0, 0, 0);
            onChange(combinedDate);
        } else {
            // If no time is set, use current time or default to 00:00
            const now = new Date();
            const combinedDate = new Date(selectedDate);
            combinedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
            onChange(combinedDate);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTimeValue(value);

        if (tempDate && value) {
            const [hours, minutes] = value.split(':').map(Number);
            const combinedDate = new Date(tempDate);
            combinedDate.setHours(hours || 0, minutes || 0, 0, 0);
            onChange(combinedDate);
        }
    };

    const handleClear = () => {
        setTempDate(undefined);
        setTimeValue('');
        onChange(null); // Use null to match your form state
        setOpen(false);
    };

    const handleDone = () => {
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date instanceof Date ? (
                        format(date, 'PPP HH:mm')
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                    <Calendar
                        mode="single"
                        selected={tempDate}
                        onSelect={handleDateSelect}
                        initialFocus
                    />
                </div>
                <div className="p-3 flex items-center space-x-2 border-b">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="h-8"
                        placeholder="00:00"
                    />
                </div>
                <div className="p-3 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        Clear
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleDone}
                    >
                        Done
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
