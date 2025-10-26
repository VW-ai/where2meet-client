'use client';

import { useState, useEffect } from 'react';
import { EventCategory, EventVisibility, LocationType } from '@/types';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import DateTimePicker from './DateTimePicker';
import CityAutocomplete from './CityAutocomplete';
import { Trophy, Film, X, MapPin, Map, Info, Check, Sparkles, Search, Shuffle } from 'lucide-react';

interface PostEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    meeting_time: string;
    location_area: string;
    location_coords?: { lat: number; lng: number };
    category?: EventCategory;
    participant_limit?: number;
    visibility: EventVisibility;
    location_type: LocationType;
    fixed_venue_name?: string;
    fixed_venue_address?: string;
    fixed_venue_lat?: number;
    fixed_venue_lng?: number;
    contact_number?: string;
    background_image?: string;
  }) => Promise<void>;
}

const categoryOptions: { id: EventCategory; icon: React.ReactElement; label: string }[] = [
  { id: 'sports', icon: <Trophy className="w-5 h-5" />, label: 'Sports' },
  { id: 'entertainment', icon: <Film className="w-5 h-5" />, label: 'Entertainment' },
];

// Subcategories for each main category
const subCategoryOptions: Record<string, string[]> = {
  sports: ['Basketball', 'Soccer', 'Tennis', 'Running', 'Gym', 'Cycling', 'Volleyball', 'Badminton'],
  entertainment: ['Movies', 'Theater', 'Concerts', 'Museums', 'Gaming', 'Comedy', 'Karaoke', 'Festival'],
};

// Curated collection of background images from Unsplash
const backgroundImages = [
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop', // Brunch food
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop', // Basketball
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop', // Movie theater
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&h=600&fit=crop', // Coffee shop
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop', // Pizza
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop', // Gym/fitness
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop', // Concert
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop', // Hiking
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Restaurant
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=600&fit=crop', // Coworking
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop', // Beach
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop', // Park
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop', // Mountains
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop', // Fine dining
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop', // Running
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop', // Bar/nightlife
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop', // Art gallery
  'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&h=600&fit=crop', // Museum
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop', // Soccer
  'https://images.unsplash.com/photo-1554941068-a252680d25d9?w=800&h=600&fit=crop', // Picnic
];

export default function PostEventModal({ isOpen, onClose, onSubmit }: PostEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [locationType, setLocationType] = useState<LocationType>('collaborative');
  const [locationArea, setLocationArea] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueAdditionalDetails, setVenueAdditionalDetails] = useState('');
  const [venueCity, setVenueCity] = useState(''); // Store extracted city name
  const [venueLat, setVenueLat] = useState<number | undefined>();
  const [venueLng, setVenueLng] = useState<number | undefined>();
  const [category, setCategory] = useState<EventCategory | undefined>();
  const [subCategory, setSubCategory] = useState<string | undefined>();
  const [participantLimit, setParticipantLimit] = useState<number | undefined>();
  const [visibility, setVisibility] = useState<EventVisibility>('public');
  const [contactNumber, setContactNumber] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Places Autocomplete for venue address (new API)
  // Only initialize when locationType is 'fixed'
  const { containerRef: venueContainerRef, isLoaded: isGoogleMapsLoaded } = useGooglePlacesAutocomplete({
    onPlaceSelect: (place) => {
      console.log('Place selected:', place);

      // Auto-fill venue details when a place is selected
      // For establishments, use the name; for geocoded addresses, use the formatted address
      setVenueName(place.name || place.formatted_address.split(',')[0]);  // Fallback to first part of address
      setVenueAddress(place.formatted_address);  // Store the full address

      // Extract city and state from address components
      let city = '';
      let state = '';

      if (place.address_components) {
        for (const component of place.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name; // e.g., "CA" instead of "California"
          }
        }
      }

      // Set city area (e.g., "San Francisco, CA" or just "San Francisco")
      const cityArea = state ? `${city}, ${state}` : city;
      setVenueCity(cityArea || place.formatted_address.split(',').slice(-2).join(',').trim()); // Fallback to last 2 parts

      // Get coordinates if available
      if (place.geometry?.location) {
        setVenueLat(place.geometry.location.lat());
        setVenueLng(place.geometry.location.lng());
      }
    },
    // Allow both establishments and regular addresses
    types: undefined, // No type restriction - allows all places
  });

  // Trigger re-initialization when locationType changes to 'fixed'
  useEffect(() => {
    console.log('Location type changed to:', locationType);
  }, [locationType]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handler for city autocomplete
  const handleCitySelect = (city: string, state: string, display: string) => {
    setLocationArea(display); // Set the formatted display string (e.g., "Los Angeles, CA")
  };

  // Function to select a random background image
  const selectRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    setBackgroundImage(backgroundImages[randomIndex]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation with field ID for scrolling
    const scrollToField = (fieldId: string, errorMessage: string) => {
      setError(errorMessage);
      // Scroll to the field and highlight it
      setTimeout(() => {
        const element = document.getElementById(fieldId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Add red border highlight
          const input = element.tagName === 'INPUT' ? element : element.querySelector('input, div[contenteditable]');
          if (input) {
            input.classList.add('!border-red-600');
            setTimeout(() => {
              input.classList.remove('!border-red-600');
            }, 3000);
            (input as HTMLElement).focus();
          } else {
            // For sections without inputs (like category buttons), highlight the container
            element.classList.add('!border-red-600');
            setTimeout(() => {
              element.classList.remove('!border-red-600');
            }, 3000);
          }
        }
      }, 100);
    };

    if (!title.trim()) {
      scrollToField('event-title', 'Event title is required');
      return;
    }
    if (!meetingTime) {
      scrollToField('meeting-time', 'Meeting time is required');
      return;
    }
    if (!category) {
      scrollToField('category-section', 'Please select a category (Sports or Entertainment)');
      return;
    }
    if (!subCategory) {
      scrollToField('subcategory-section', 'Please select a specific activity type');
      return;
    }
    if (!participantLimit || participantLimit < 2 || participantLimit > 100) {
      scrollToField('participant-limit', 'Participant limit is required (2-100 people)');
      return;
    }

    // Location-specific validation
    if (locationType === 'fixed') {
      if (!venueAddress.trim()) {
        scrollToField('venue-location', 'Address is required for fixed location events');
        return;
      }
      // Auto-extract city from address if not set by autocomplete
      if (!venueCity.trim()) {
        // Try to extract city from the address (last part before zip/country)
        const addressParts = venueAddress.split(',').map(p => p.trim());
        if (addressParts.length >= 2) {
          // Use the last 2 parts as the city area (e.g., "San Francisco, CA")
          setVenueCity(addressParts.slice(-2).join(', '));
        } else {
          setVenueCity(venueAddress.trim());
        }
      }
    } else {
      if (!locationArea.trim()) {
        scrollToField('location-area', 'Location area is required for collaborative events');
        return;
      }
    }

    // Check if meeting time is in the future
    const meetingDate = new Date(meetingTime);
    if (meetingDate <= new Date()) {
      scrollToField('meeting-time', 'Meeting time must be in the future');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine address with additional details if provided
      const fullAddress = locationType === 'fixed' && venueAdditionalDetails.trim()
        ? `${venueAddress.trim()}, ${venueAdditionalDetails.trim()}`
        : venueAddress.trim();

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        meeting_time: meetingTime,
        location_area: locationType === 'fixed'
          ? venueCity.trim()  // Use city/broad area for fixed events (e.g., "San Francisco, CA")
          : locationArea.trim(),
        location_coords: locationType === 'fixed' && venueLat && venueLng
          ? { lat: venueLat, lng: venueLng }  // Store coordinates for fixed events
          : undefined,
        category: subCategory as EventCategory, // Use subcategory as the category value
        participant_limit: participantLimit,
        visibility,
        location_type: locationType,
        fixed_venue_name: locationType === 'fixed' ? venueName.trim() : undefined,
        fixed_venue_address: locationType === 'fixed' ? fullAddress : undefined,
        fixed_venue_lat: locationType === 'fixed' ? venueLat : undefined,
        fixed_venue_lng: locationType === 'fixed' ? venueLng : undefined,
        contact_number: contactNumber.trim() || undefined,
        background_image: backgroundImage.trim() || undefined,
      });

      // Reset form on success
      setTitle('');
      setDescription('');
      setMeetingTime('');
      setEndTime(undefined);
      setLocationType('collaborative');
      setLocationArea('');
      setVenueName('');
      setVenueAddress('');
      setVenueAdditionalDetails('');
      setVenueCity('');
      setVenueLat(undefined);
      setVenueLng(undefined);
      setCategory(undefined);
      setSubCategory(undefined);
      setParticipantLimit(undefined);
      setVisibility('public');
      setContactNumber('');
      setBackgroundImage('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20">
          <h2 className="text-sm font-bold uppercase">Post Event</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message - Sticky below header */}
        {error && (
          <div className="sticky top-[57px] z-10 bg-red-600 text-white px-6 py-4 border-b-4 border-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex-shrink-0 w-6 h-6 bg-white text-red-600 flex items-center justify-center font-bold border-2 border-black">
              !
            </div>
            <span className="font-bold text-sm uppercase flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Event Title */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Event Title *
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Brunch Meetup"
                maxLength={100}
                className="w-full px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what this event is about... (optional)"
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none resize-none placeholder:text-gray-400"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
            </div>

            {/* Meeting Time */}
            <div id="meeting-time">
              <label className="block text-base font-medium text-black mb-2">
                Meeting Time *
              </label>
              <DateTimePicker
                selected={meetingTime ? new Date(meetingTime) : null}
                onChange={(date) => setMeetingTime(date ? date.toISOString() : '')}
                disabled={isSubmitting}
              />
            </div>

            {/* Location Type */}
            <div className="border-2 border-black p-4 bg-white">
              <label className="block text-base font-medium text-black mb-3">
                Location Type *
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="collaborative"
                    checked={locationType === 'collaborative'}
                    onChange={() => setLocationType('collaborative')}
                    className="mt-1"
                    disabled={isSubmitting}
                    style={{ accentColor: '#000000' }}
                  />
                  <div className="flex items-start gap-2">
                    <Map className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-black">Find Location Together</div>
                      <div className="text-sm text-gray-600">
                        I have an event idea but need help finding the best venue
                      </div>
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="fixed"
                    checked={locationType === 'fixed'}
                    onChange={() => setLocationType('fixed')}
                    className="mt-1"
                    disabled={isSubmitting}
                    style={{ accentColor: '#000000' }}
                  />
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-black">Fixed Location</div>
                      <div className="text-sm text-gray-600">
                        I already know exactly where we're meeting
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional Location Fields */}
            {locationType === 'collaborative' ? (
              <div id="location-area">
                <label className="block text-base font-medium text-black mb-2">
                  General Area *
                </label>
                {/* Custom City Autocomplete */}
                <CityAutocomplete
                  value={locationArea}
                  onChange={handleCitySelect}
                  placeholder="Search for a city (e.g., San Francisco, New York)"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Start typing a city name
                </p>
                <div className="mt-2 p-3 bg-white border-2 border-black flex items-start gap-2">
                  <Info className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-black">
                    You and participants will suggest and vote on specific venues in this area
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div id="venue-location">
                  <label className="block text-base font-medium text-black mb-2">
                    Location *
                  </label>
                  {/* Google Places Autocomplete Container (new API) */}
                  <div ref={venueContainerRef} className="w-full min-h-[44px]" style={{ display: 'block', visibility: 'visible' }} />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    {isGoogleMapsLoaded ? (
                      <><Sparkles className="w-3 h-3" /> Start typing to search addresses with Google Maps autocomplete</>
                    ) : (
                      <><Search className="w-3 h-3" /> Loading Google Maps autocomplete...</>
                    )}
                  </p>
                  {venueCity && (
                    <div className="mt-2 p-2 bg-white border-2 border-black flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-black" />
                      <p className="text-xs text-black">
                        <span className="font-medium">Area:</span> {venueCity}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium text-black mb-2">
                    Additional Details (Optional)
                  </label>
                  <input
                    type="text"
                    value={venueAdditionalDetails}
                    onChange={(e) => setVenueAdditionalDetails(e.target.value)}
                    placeholder='e.g. "Floor 2, Room 201" or "Building B, Suite 300"'
                    className="w-full px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add floor number, room number, or other location details
                  </p>
                </div>
                <div className="mt-2 p-3 bg-white border-2 border-black flex items-start gap-2">
                  <Check className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-black">
                    Participants will see the exact meeting location when they join
                  </p>
                </div>
              </div>
            )}

            {/* Category */}
            <div id="category-section">
              <label className="block text-base font-medium text-black mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setSubCategory(undefined); // Reset subcategory when changing category
                    }}
                    className={`px-4 py-3 border-2 text-sm font-bold uppercase transition-colors ${
                      category === cat.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black hover:bg-gray-100'
                    }`}
                    disabled={isSubmitting}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory - Only shown when a category is selected */}
            {category && subCategoryOptions[category] && (
              <div id="subcategory-section">
                <label className="block text-base font-medium text-black mb-2">
                  Type (Select Specific Activity) *
                </label>
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                  {subCategoryOptions[category].map((subCat) => (
                    <button
                      key={subCat}
                      type="button"
                      onClick={() => setSubCategory(subCat)}
                      className={`px-3 py-2 border-2 text-xs font-bold uppercase transition-colors ${
                        subCategory === subCat
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black hover:bg-gray-100'
                      }`}
                      disabled={isSubmitting}
                    >
                      {subCat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Participant Limit */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Participant Limit *
              </label>
              <input
                id="participant-limit"
                type="number"
                value={participantLimit || ''}
                onChange={(e) => setParticipantLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g. 10"
                min={2}
                max={100}
                className="w-full px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Required (2-100 people)</p>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-1"
                    disabled={isSubmitting}
                    style={{ accentColor: '#000000' }}
                  />
                  <div>
                    <div className="font-medium text-black">Public</div>
                    <div className="text-sm text-gray-600">Anyone can see and join this event</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value="link_only"
                    checked={visibility === 'link_only'}
                    onChange={() => setVisibility('link_only')}
                    className="mt-1"
                    disabled={isSubmitting}
                    style={{ accentColor: '#000000' }}
                  />
                  <div>
                    <div className="font-medium text-black">Link Only</div>
                    <div className="text-sm text-gray-600">Only people with the link can see and join</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-base font-medium text-black mb-2">
                Contact Number (Optional)
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +1 (555) 123-4567"
                maxLength={20}
                className="w-full px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Participants can see this number on the event page
              </p>
            </div>

            {/* Background Image */}
            <div className="border-t-2 border-black pt-5">
              <label className="block text-base font-medium text-black mb-2">
                Background Image (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Add a background image to make your event card stand out
              </p>
              <div className="space-y-3">
                {/* Image URL Input with Random Button */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                    placeholder="Paste image URL (e.g. from Unsplash)"
                    className="flex-1 px-4 py-3 text-base text-black border-2 border-black focus:border-black outline-none placeholder:text-gray-400"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={selectRandomImage}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-black text-white border-2 border-black font-bold text-sm uppercase hover:bg-gray-900 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    Random
                  </button>
                </div>

                {/* Image Preview */}
                {backgroundImage && (
                  <div className="relative">
                    <div className="text-xs font-medium text-gray-700 mb-2">Preview:</div>
                    <div
                      className="relative w-full h-40 border-2 border-black overflow-hidden"
                      style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* Dark overlay preview */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/70 via-black/40 to-transparent" />

                      {/* Sample text to show readability */}
                      <div className="relative z-10 p-4">
                        <h3 className="font-semibold text-lg text-white mb-1">
                          {title || 'Your Event Title'}
                        </h3>
                        <p className="text-sm text-gray-200">
                          This is how your event card will look
                        </p>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => setBackgroundImage('')}
                        className="absolute top-2 right-2 z-20 px-3 py-2 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors text-xs font-bold uppercase"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Tip: Use high-quality images (800x600px or larger) for best results
                    </p>
                  </div>
                )}

                {!backgroundImage && (
                  <div className="p-4 bg-white border-2 border-black flex items-start gap-2">
                    <Info className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-black">
                      Click "Random" to select from our curated collection, or paste your own image URL
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 border-2 border-black text-black font-bold uppercase bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !title.trim() ||
                !meetingTime ||
                !participantLimit ||
                participantLimit < 2 ||
                participantLimit > 100 ||
                (locationType === 'fixed' ? (!venueAddress.trim() || !venueCity.trim()) : !locationArea.trim())
              }
              className="flex-1 py-3 bg-black text-white border-2 border-black font-bold uppercase hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
