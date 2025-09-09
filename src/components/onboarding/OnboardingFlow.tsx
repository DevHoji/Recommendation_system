'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import SignInStep from './SignInStep';
import PreferenceStep from './PreferenceStep';
import MovieSelectionStep from './MovieSelectionStep';
import SuccessScreen from './SuccessScreen';
import toast from 'react-hot-toast';

type OnboardingStep = 'signin' | 'preferences' | 'movies' | 'success';

interface OnboardingData {
  username: string;
  email?: string;
  genres: string[];
  moods: string[];
  favoriteMovies: number[];
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('signin');
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});
  const { login, completeOnboarding } = useUser();

  const handleSignIn = (userData: { username: string; email?: string }) => {
    setOnboardingData(prev => ({
      ...prev,
      username: userData.username,
      email: userData.email
    }));
    setCurrentStep('preferences');
  };

  const handlePreferences = (preferences: { genres: string[]; moods: string[] }) => {
    setOnboardingData(prev => ({
      ...prev,
      genres: preferences.genres,
      moods: preferences.moods
    }));
    setCurrentStep('movies');
  };

  const handleMovieSelection = (favoriteMovies: number[]) => {
    setOnboardingData(prev => ({
      ...prev,
      favoriteMovies
    }));
    setCurrentStep('success');
  };

  const handleComplete = async () => {
    try {
      // Create user with all collected data
      await login({
        username: onboardingData.username!,
        email: onboardingData.email,
        preferences: {
          genres: onboardingData.genres || [],
          moods: onboardingData.moods || [],
          favoriteMovies: onboardingData.favoriteMovies || []
        },
        isOnboarded: true
      });

      // Mark onboarding as complete
      completeOnboarding();

      toast.success(`Welcome to CineAI, ${onboardingData.username}!`);
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'preferences':
        setCurrentStep('signin');
        break;
      case 'movies':
        setCurrentStep('preferences');
        break;
      default:
        break;
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const getStepDirection = (step: OnboardingStep): number => {
    const steps: OnboardingStep[] = ['signin', 'preferences', 'movies', 'success'];
    return steps.indexOf(step);
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait" custom={getStepDirection(currentStep)}>
        <motion.div
          key={currentStep}
          custom={getStepDirection(currentStep)}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full"
        >
          {currentStep === 'signin' && (
            <SignInStep onNext={handleSignIn} />
          )}
          
          {currentStep === 'preferences' && (
            <PreferenceStep 
              onNext={handlePreferences}
              onBack={goBack}
            />
          )}
          
          {currentStep === 'movies' && (
            <MovieSelectionStep 
              onNext={handleMovieSelection}
              onBack={goBack}
            />
          )}
          
          {currentStep === 'success' && (
            <SuccessScreen 
              username={onboardingData.username!}
              onComplete={handleComplete}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingFlow;
