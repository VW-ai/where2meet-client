import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostEventModal from '@/components/PostEventModal';

describe('PostEventModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PostEventModal isOpen={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
      expect(screen.queryByText('Post Event')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
      expect(screen.getAllByText('Post Event').length).toBeGreaterThan(0);
    });

    it('should render all required form fields', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText(/Weekend Brunch Meetup/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tell people what this event is about/)).toBeInTheDocument();
      expect(screen.getByText(/Meeting Time/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Find Location Together/)).toBeInTheDocument();
      expect(screen.getByText(/Food & Drinks/)).toBeInTheDocument();
      expect(screen.getByText(/Participant Limit/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Public/)).toBeInTheDocument();
    });

    it('should render category buttons', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/Food & Drinks/)).toBeInTheDocument();
      expect(screen.getByText(/Sports/)).toBeInTheDocument();
      expect(screen.getByText(/Entertainment/)).toBeInTheDocument();
      expect(screen.getByText(/Work & Study/)).toBeInTheDocument();
      expect(screen.getByText(/Music & Arts/)).toBeInTheDocument();
      expect(screen.getByText(/Outdoors/)).toBeInTheDocument();
    });
  });

  describe('Location Type Selection', () => {
    it('should default to collaborative location type', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const collaborativeRadio = screen.getByLabelText(/Find Location Together/);
      expect(collaborativeRadio).toBeChecked();
    });

    it('should show "General Area" field for collaborative events', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText(/Downtown SF/)).toBeInTheDocument();
    });

    it('should show venue fields when fixed location is selected', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const fixedRadio = screen.getByLabelText(/Fixed Location/);
      fireEvent.click(fixedRadio);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Sunset Park Basketball Court/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/123 Main St, San Francisco/)).toBeInTheDocument();
      });
    });
  });

  describe('Background Image Feature', () => {
    it('should render background image input field', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByPlaceholderText(/Paste image URL/)).toBeInTheDocument();
    });

    it('should render random image button', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/🎲 Random/)).toBeInTheDocument();
    });

    it('should select random image when button is clicked', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const randomButton = screen.getByText(/🎲 Random/);
      const imageInput = screen.getByPlaceholderText(/Paste image URL/) as HTMLInputElement;

      expect(imageInput.value).toBe('');

      fireEvent.click(randomButton);

      await waitFor(() => {
        expect(imageInput.value).toContain('https://images.unsplash.com');
      });
    });

    it('should show image preview when URL is entered', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const imageInput = screen.getByPlaceholderText(/Paste image URL/);
      await userEvent.type(imageInput, 'https://example.com/image.jpg');

      await waitFor(() => {
        expect(screen.getByText(/Preview:/)).toBeInTheDocument();
        expect(screen.getByText(/This is how your event card will look/)).toBeInTheDocument();
      });
    });

    it('should show remove button when image is set', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const imageInput = screen.getByPlaceholderText(/Paste image URL/);
      await userEvent.type(imageInput, 'https://example.com/image.jpg');

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });
    });

    it('should clear image when remove button is clicked', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const imageInput = screen.getByPlaceholderText(/Paste image URL/) as HTMLInputElement;
      await userEvent.type(imageInput, 'https://example.com/image.jpg');

      await waitFor(() => {
        expect(imageInput.value).toBe('https://example.com/image.jpg');
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(imageInput.value).toBe('');
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when title is missing', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getAllByText('Post Event')[1]; // Get the button, not the heading
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when meeting time is missing', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const submitButton = screen.getAllByText('Post Event')[1];
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when location area is missing for collaborative events', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when venue name is missing for fixed events', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const fixedRadio = screen.getByLabelText(/Fixed Location/);
      fireEvent.click(fixedRadio);

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      expect(submitButton).toBeDisabled();
    });

    it('should show error when meeting time is in the past', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateString = pastDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const areaInput = screen.getByPlaceholderText(/Downtown SF/);
      await userEvent.type(areaInput, 'Downtown');

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Meeting time must be in the future/)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data for collaborative event', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Brunch Meetup');

      const descInput = screen.getByPlaceholderText(/Tell people what this event is about/);
      await userEvent.type(descInput, 'Test description');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const areaInput = screen.getByPlaceholderText(/Downtown SF/);
      await userEvent.type(areaInput, 'Downtown SF');

      const foodButton = screen.getByText(/Food & Drinks/);
      fireEvent.click(foodButton);

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Brunch Meetup',
            description: 'Test description',
            location_area: 'Downtown SF',
            location_type: 'collaborative',
            category: 'food',
            visibility: 'public',
          })
        );
      });
    });

    it('should call onSubmit with background image when provided', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const areaInput = screen.getByPlaceholderText(/Downtown SF/);
      await userEvent.type(areaInput, 'Downtown');

      const imageInput = screen.getByPlaceholderText(/Paste image URL/);
      await userEvent.type(imageInput, 'https://example.com/bg.jpg');

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            background_image: 'https://example.com/bg.jpg',
          })
        );
      });
    });

    it('should reset form after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined);

      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/) as HTMLInputElement;
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const areaInput = screen.getByPlaceholderText(/Downtown SF/);
      await userEvent.type(areaInput, 'Downtown');

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error message on submission failure', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));

      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const areaInput = screen.getByPlaceholderText(/Downtown SF/);
      await userEvent.type(areaInput, 'Downtown');

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Controls', () => {
    it('should call onClose when cancel button is clicked', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when X button is clicked', () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable form controls while submitting', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test Event');

      const timeInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);
      await userEvent.type(timeInput, dateString);

      const areaInput = screen.getByPlaceholderText(/Downtown SF/);
      await userEvent.type(areaInput, 'Downtown');

      const submitButton = screen.getAllByText('Post Event')[1]; // Get button, not heading
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Posting...')).toBeInTheDocument();
      });
    });
  });

  describe('Character Limits', () => {
    it('should enforce title character limit', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/) as HTMLInputElement;
      expect(titleInput.maxLength).toBe(100);
    });

    it('should show character count for title', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const titleInput = screen.getByPlaceholderText(/Weekend Brunch Meetup/);
      await userEvent.type(titleInput, 'Test');

      expect(screen.getByText('4/100')).toBeInTheDocument();
    });

    it('should enforce description character limit', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descInput = screen.getByPlaceholderText(/Tell people what this event is about/) as HTMLTextAreaElement;
      expect(descInput.maxLength).toBe(500);
    });

    it('should show character count for description', async () => {
      render(<PostEventModal isOpen={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const descInput = screen.getByPlaceholderText(/Tell people what this event is about/);
      await userEvent.type(descInput, 'Test description');

      expect(screen.getByText('16/500')).toBeInTheDocument();
    });
  });
});
