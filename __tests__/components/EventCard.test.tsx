import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventCard from '@/components/EventCard';
import { Event } from '@/types';

// Mock SpotlightCard component
jest.mock('@/components/SpotlightCard', () => {
  return function SpotlightCard({ children, className }: any) {
    return <div className={className}>{children}</div>;
  };
});

// Mock AvatarCircles component
jest.mock('@/components/ui/avatar-circles', () => {
  return {
    AvatarCircles: ({ avatarUrls, numPeople }: any) => (
      <div data-testid="avatar-circles">
        {avatarUrls.length} avatars, +{numPeople} more
      </div>
    ),
  };
});

// Mock EventFeedStatusBadge component
jest.mock('@/components/EventFeedStatusBadge', () => {
  return function EventFeedStatusBadge({ status }: any) {
    return <div data-testid={`badge-${status}`}>{status}</div>;
  };
});

describe('EventCard', () => {
  const mockOnView = jest.fn();
  const mockOnJoin = jest.fn();
  const mockOnLeave = jest.fn();

  const baseEvent: Event = {
    id: 'test-event-1',
    title: 'Test Event',
    description: 'Test Description',
    host_id: 'host-1',
    host_name: 'Test Host',
    participant_ids: ['p1', 'p2', 'p3'],
    participant_count: 3,
    participant_limit: 10,
    participant_avatars: ['https://example.com/avatar1.jpg', 'https://example.com/avatar2.jpg'],
    meeting_time: new Date('2025-12-25T15:00:00Z').toISOString(),
    location_area: 'Downtown',
    location_type: 'collaborative',
    category: 'food',
    visibility: 'public',
    allow_vote: true,
    venue_count: 5,
    average_rating: 4.5,
    distance_km: 2.3,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render event title', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    it('should render location area for collaborative events', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText(/Downtown/)).toBeInTheDocument();
      expect(screen.getByText(/Finding location/)).toBeInTheDocument();
    });

    it('should render fixed venue name for fixed location events', () => {
      const fixedEvent: Event = {
        ...baseEvent,
        location_type: 'fixed',
        fixed_venue_name: 'Blue Bottle Coffee',
      };
      render(<EventCard event={fixedEvent} onView={mockOnView} />);
      expect(screen.getByText(/Blue Bottle Coffee/)).toBeInTheDocument();
    });

    it('should show "In Progress" with participant count for active events', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText(/In Progress 3/)).toBeInTheDocument();
    });

    it('should display participant limit when available', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText(/\/10/)).toBeInTheDocument();
    });

    it('should display infinity symbol when no participant limit', () => {
      const eventNoLimit: Event = { ...baseEvent, participant_limit: undefined };
      render(<EventCard event={eventNoLimit} onView={mockOnView} />);
      expect(screen.getByText(/\/∞/)).toBeInTheDocument();
    });

    it('should render avatars when available', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByTestId('avatar-circles')).toBeInTheDocument();
    });

    it('should display category emoji and name', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      // Check that category is displayed (emoji may appear multiple times)
      expect(screen.getByText(/☕ food/)).toBeInTheDocument();
    });

    it('should display average rating when available', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText(/⭐ 4.5/)).toBeInTheDocument();
    });

    it('should display distance when available', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText(/2.3 km/)).toBeInTheDocument();
    });

    it('should render background image when provided', () => {
      const eventWithBg: Event = {
        ...baseEvent,
        background_image: 'https://example.com/bg.jpg',
      };
      const { container } = render(<EventCard event={eventWithBg} onView={mockOnView} />);
      const bgElement = container.querySelector('[style*="background-image"]');
      expect(bgElement).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should show host badge when user is host', () => {
      render(<EventCard event={baseEvent} userRole="host" onView={mockOnView} />);
      expect(screen.getByTestId('badge-host')).toBeInTheDocument();
    });

    it('should show joined badge when user is participant', () => {
      render(<EventCard event={baseEvent} userRole="participant" onView={mockOnView} />);
      expect(screen.getByTestId('badge-joined')).toBeInTheDocument();
    });

    it('should show full badge when event is at capacity', () => {
      const fullEvent: Event = {
        ...baseEvent,
        participant_count: 10,
        participant_limit: 10,
        status: 'full'
      };
      render(<EventCard event={fullEvent} onView={mockOnView} />);
      expect(screen.getByTestId('badge-full')).toBeInTheDocument();
    });

    it('should show closed badge when event is closed', () => {
      const closedEvent: Event = { ...baseEvent, status: 'closed' };
      render(<EventCard event={closedEvent} onView={mockOnView} />);
      expect(screen.getByTestId('badge-closed')).toBeInTheDocument();
    });

    it('should show past badge when event is past', () => {
      const pastEvent: Event = { ...baseEvent, status: 'past' };
      render(<EventCard event={pastEvent} onView={mockOnView} />);
      expect(screen.getByTestId('badge-past')).toBeInTheDocument();
    });
  });

  describe('User Interactions - Host', () => {
    it('should show View and Manage buttons for host', () => {
      render(<EventCard event={baseEvent} userRole="host" onView={mockOnView} />);
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Manage')).toBeInTheDocument();
    });

    it('should call onView when host clicks View button', () => {
      render(<EventCard event={baseEvent} userRole="host" onView={mockOnView} />);
      fireEvent.click(screen.getByText('View'));
      expect(mockOnView).toHaveBeenCalledWith('test-event-1');
    });

    it('should call onView when host clicks Manage button', () => {
      render(<EventCard event={baseEvent} userRole="host" onView={mockOnView} />);
      fireEvent.click(screen.getByText('Manage'));
      expect(mockOnView).toHaveBeenCalledWith('test-event-1');
    });
  });

  describe('User Interactions - Participant', () => {
    it('should show View Event and Leave buttons for participant', () => {
      render(<EventCard event={baseEvent} userRole="participant" onView={mockOnView} onLeave={mockOnLeave} />);
      expect(screen.getByText('View Event')).toBeInTheDocument();
      expect(screen.getByText('Leave')).toBeInTheDocument();
    });

    it('should call onView when participant clicks View Event button', () => {
      render(<EventCard event={baseEvent} userRole="participant" onView={mockOnView} onLeave={mockOnLeave} />);
      fireEvent.click(screen.getByText('View Event'));
      expect(mockOnView).toHaveBeenCalledWith('test-event-1');
    });

    it('should call onLeave when participant clicks Leave button', async () => {
      mockOnLeave.mockResolvedValue(undefined);
      render(<EventCard event={baseEvent} userRole="participant" onView={mockOnView} onLeave={mockOnLeave} />);
      fireEvent.click(screen.getByText('Leave'));
      await waitFor(() => {
        expect(mockOnLeave).toHaveBeenCalledWith('test-event-1');
      });
    });

    it('should disable Leave button while leaving', async () => {
      const slowLeave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<EventCard event={baseEvent} userRole="participant" onView={mockOnView} onLeave={slowLeave} />);

      const leaveButton = screen.getByText('Leave');
      fireEvent.click(leaveButton);

      expect(leaveButton).toBeDisabled();
    });
  });

  describe('User Interactions - Guest', () => {
    it('should show View and Join buttons for guest', () => {
      render(<EventCard event={baseEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText(/Join/)).toBeInTheDocument();
    });

    it('should call onView when guest clicks View button', () => {
      render(<EventCard event={baseEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      fireEvent.click(screen.getByText('View'));
      expect(mockOnView).toHaveBeenCalledWith('test-event-1');
    });

    it('should call onJoin when guest clicks Join button', async () => {
      mockOnJoin.mockResolvedValue(undefined);
      render(<EventCard event={baseEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      fireEvent.click(screen.getByText('Join to Vote'));
      await waitFor(() => {
        expect(mockOnJoin).toHaveBeenCalledWith('test-event-1');
      });
    });

    it('should show "Join" for fixed location events', () => {
      const fixedEvent: Event = { ...baseEvent, location_type: 'fixed' };
      render(<EventCard event={fixedEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      expect(screen.getByText('Join')).toBeInTheDocument();
    });

    it('should show "Join to Vote" for collaborative events', () => {
      render(<EventCard event={baseEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      expect(screen.getByText('Join to Vote')).toBeInTheDocument();
    });

    it('should not show Join button for full events', () => {
      const fullEvent: Event = {
        ...baseEvent,
        participant_count: 10,
        participant_limit: 10,
        status: 'full'
      };
      render(<EventCard event={fullEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      expect(screen.queryByText(/Join/)).not.toBeInTheDocument();
    });

    it('should not show Join button for closed events', () => {
      const closedEvent: Event = { ...baseEvent, status: 'closed' };
      render(<EventCard event={closedEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      expect(screen.queryByText(/Join/)).not.toBeInTheDocument();
    });

    it('should not show Join button for past events', () => {
      const pastEvent: Event = { ...baseEvent, status: 'past' };
      render(<EventCard event={pastEvent} userRole="guest" onView={mockOnView} onJoin={mockOnJoin} />);
      expect(screen.queryByText(/Join/)).not.toBeInTheDocument();
    });

    it('should disable Join button while joining', () => {
      const slowJoin = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<EventCard event={baseEvent} userRole="guest" onView={mockOnView} onJoin={slowJoin} />);

      const joinButton = screen.getByText('Join to Vote');
      fireEvent.click(joinButton);

      expect(joinButton).toBeDisabled();
    });
  });

  describe('Time Formatting', () => {
    it('should format time as "Today at" for today', () => {
      const today = new Date();
      today.setHours(15, 0, 0, 0);
      const todayEvent: Event = { ...baseEvent, meeting_time: today.toISOString() };

      render(<EventCard event={todayEvent} onView={mockOnView} />);
      expect(screen.getByText(/Today at/)).toBeInTheDocument();
    });

    it('should format time as "Tomorrow at" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(15, 0, 0, 0);
      const tomorrowEvent: Event = { ...baseEvent, meeting_time: tomorrow.toISOString() };

      render(<EventCard event={tomorrowEvent} onView={mockOnView} />);
      expect(screen.getByText(/Tomorrow at/)).toBeInTheDocument();
    });
  });

  describe('Venue Count Display', () => {
    it('should show venue count for collaborative events', () => {
      render(<EventCard event={baseEvent} onView={mockOnView} />);
      expect(screen.getByText(/5 venues/)).toBeInTheDocument();
    });

    it('should show singular "venue" for one venue', () => {
      const singleVenueEvent: Event = { ...baseEvent, venue_count: 1 };
      render(<EventCard event={singleVenueEvent} onView={mockOnView} />);
      expect(screen.getByText(/1 venue/)).toBeInTheDocument();
    });

    it('should not show venue count for fixed location events', () => {
      const fixedEvent: Event = { ...baseEvent, location_type: 'fixed', venue_count: 0 };
      render(<EventCard event={fixedEvent} onView={mockOnView} />);
      expect(screen.queryByText(/venues/)).not.toBeInTheDocument();
    });
  });
});
