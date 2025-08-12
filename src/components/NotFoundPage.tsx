import React, { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { House, ArrowLeft, BookOpen } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotFoundPage(): ReactElement {
  const navigate = useNavigate();

  const handleGoHome = (): void => {
    navigate('/home');
  };

  const handleGoBack = (): void => {
    navigate(-1);
  };

  const handleViewCourses = (): void => {
    navigate('/courses');
  };

  return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-muted-foreground">404</span>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground mb-2">
              Page Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              <p className="mb-4">
                We're sorry, but we couldn't find the page you're looking for.
              </p>
              <p>
                This might happen if you clicked on an old link or typed the web address incorrectly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={handleGoHome}
                size="lg"
                className="min-h-[48px] text-base font-medium"
                aria-label="Go to home page"
              >
                <House className="w-5 h-5 mr-2" />
                Go to Home
              </Button>
              
              <Button
                onClick={handleViewCourses}
                variant="outline"
                size="lg"
                className="min-h-[48px] text-base font-medium"
                aria-label="View available courses"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Courses
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="ghost"
                size="lg"
                className="min-h-[48px] text-base font-medium"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team if you continue to have problems.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}