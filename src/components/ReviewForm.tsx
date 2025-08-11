import React, { useState, type ReactElement } from 'react';
import { Star } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  submitTestimonial,
  hasUserSubmittedTestimonial,
} from '@/lib/analytics';
import { useSubscription } from '@/lib/subscription';

interface ReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  onSuccess,
  onCancel,
}: ReviewFormProps): ReactElement {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Form state
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [courseTier, setCourseTier] = useState<'free' | 'advanced' | 'expert'>(
    subscription?.planId ?? user?.tier ?? 'free',
  );

  // Check if user has already submitted a review
  React.useEffect(() => {
    async function checkExisting(): Promise<void> {
      if (!user) {
        setCheckingExisting(false);
        return;
      }

      const hasReview = await hasUserSubmittedTestimonial(user.id);
      setHasExistingReview(hasReview);
      setCheckingExisting(false);
    }

    void checkExisting();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (content.length < 20) {
      setError('Please write at least 20 characters in your review');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await submitTestimonial(user.id, {
      userName: user.name || 'Anonymous',
      userLocation: location || undefined,
      courseTier,
      rating,
      content,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } else {
      setError(result.error || 'Failed to submit review');
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Share Your Experience</CardTitle>
          <CardDescription>Please log in to submit a review</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (checkingExisting) {
    return (
      <Card>
        <CardContent className='py-8 text-center'>
          <p className='text-muted-foreground'>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasExistingReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
          <CardDescription>
            You have already submitted a review. We appreciate your feedback!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent className='py-8 text-center'>
          <div className='text-green-600 mb-4'>
            <Star className='w-12 h-12 mx-auto' weight='fill' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>Thank You!</h3>
          <p className='text-muted-foreground'>
            Your review has been submitted and will be displayed after approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Learning Experience</CardTitle>
        <CardDescription>
          Help others by sharing your experience with AI for Elders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className='space-y-6'>
          {/* Rating */}
          <div>
            <Label>Your Rating</Label>
            <div className='flex gap-1 mt-2'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className='p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded'
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className='w-8 h-8'
                    weight={
                      (hoveredRating || rating) >= star ? 'fill' : 'regular'
                    }
                    color={
                      (hoveredRating || rating) >= star ? '#facc15' : '#9ca3af'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Course Type */}
          <div>
            <Label htmlFor='course'>Course Type</Label>
            <Select
              value={courseTier}
              onValueChange={(value) =>
                setCourseTier(value as 'free' | 'advanced' | 'expert')
              }
            >
              <SelectTrigger id='course' className='mt-2'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='free'>Free Course</SelectItem>
                <SelectItem value='advanced'>Advanced Course</SelectItem>
                <SelectItem value='expert'>Expert Course</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location (optional) */}
          <div>
            <Label htmlFor='location'>Location (Optional)</Label>
            <Input
              id='location'
              type='text'
              placeholder='e.g., Phoenix, AZ'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className='mt-2'
              maxLength={50}
            />
          </div>

          {/* Review Content */}
          <div>
            <Label htmlFor='content'>Your Review</Label>
            <Textarea
              id='content'
              placeholder='Share your experience with the course...'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className='mt-2 min-h-[120px]'
              maxLength={500}
              required
            />
            <p className='text-sm text-muted-foreground mt-1'>
              {content.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className='flex gap-3'>
            <Button type='submit' disabled={isSubmitting} className='flex-1'>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
