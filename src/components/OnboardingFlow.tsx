import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errors';

interface OnboardingFlowProps {
  onComplete: (allowAutoInstall: boolean) => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'auto' | 'manual' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Smooth entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setFadeIn(true), 100);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOptionSelect = (option: 'auto' | 'manual') => {
    setSelectedOption(option);
    logger.info(`User selected installation option: ${option}`, 'onboarding');
  };

  const handleConsentChange = (checked: boolean) => {
    setConsentGiven(checked);
    logger.info(`User consent changed: ${checked}`, 'onboarding');
  };

  const handleContinue = async () => {
    if (!selectedOption || !consentGiven) return;

    setIsProcessing(true);
    
    try {
      if (selectedOption === 'auto') {
        logger.info('User chose automatic tool installation', 'onboarding');
        // Trigger automatic installation process
        // TODO: Implement autoInstall in ElectronAPI
        // await window.electronAPI?.prerequisites?.autoInstall?.();
        logger.info('Automatic installation would be triggered here', 'onboarding');
      } else {
        logger.info('User chose manual tool installation', 'onboarding');
      }
      
      // Smooth transition out
      setFadeIn(false);
      setTimeout(() => {
        onComplete(selectedOption === 'auto');
      }, 300);
    } catch (error) {
      const appError = ErrorHandler.handle(error, 'onboarding');
      logger.error('Failed during onboarding process', 'onboarding', {
        error: appError.message,
        selectedOption
      });
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    logger.info('User skipped onboarding', 'onboarding');
    setFadeIn(false);
    setTimeout(() => {
      onSkip?.();
    }, 300);
  };

  const steps = [
    {
      title: "Welcome to Focule",
      subtitle: "Professional video transcription with AI-powered content generation",
      context: "To get started, we need to install some essential tools for video processing"
    },
    {
      title: "Installation Required",
      subtitle: "FFmpeg, Whisper, and other tools are needed for video processing",
      context: "These tools are industry-standard and completely safe"
    }
  ];

  if (!isVisible) return <></>;

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      transition-all duration-1000 ease-out
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {/* Backdrop with blur */}
      <div className={`
        absolute inset-0 bg-black/60 backdrop-blur-md
        transition-all duration-700 ease-out
        ${fadeIn ? 'backdrop-blur-lg' : 'backdrop-blur-sm'}
      `} />
      
      {/* Main content */}
      <div className={`
        relative bg-gradient-to-br from-slate-900 to-slate-800
        rounded-3xl p-8 max-w-2xl w-full mx-4
        shadow-2xl border border-slate-700/50
        transition-all duration-700 ease-out transform
        ${fadeIn ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}
      `}>
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-300 text-sm transition-colors"
        >
          Skip →
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`
                h-1 flex-1 rounded-full transition-all duration-500
                ${index <= currentStep ? 'bg-cyan-400' : 'bg-slate-700'}
              `}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-xl text-cyan-400 mb-2">
              {steps[currentStep].subtitle}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {steps[currentStep].context}
            </p>
          </div>

          {/* Security notice */}
          {currentStep === 1 && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">100% Safe & Open Source</p>
                  <p className="text-slate-400 text-sm">
                    All tools are industry-standard, open-source software used by millions. 
                    No malware, no tracking, completely offline processing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Installation options */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Automatic installation option */}
              <div
                className={`
                  relative rounded-xl p-4 border-2 cursor-pointer transition-all duration-300
                  ${selectedOption === 'auto' 
                    ? 'border-cyan-400 bg-cyan-400/10' 
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }
                `}
                onClick={() => handleOptionSelect('auto')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center mt-0.5">
                    {selectedOption === 'auto' && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">
                      🚀 Automatic Installation (Recommended)
                    </h3>
                    <p className="text-slate-300 text-sm mb-3">
                      Let Focule handle everything for you. We'll download and configure all required tools automatically.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        ✓ Fastest setup
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        ✓ Auto-configuration
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        ✓ Latest versions
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual installation option */}
              <div
                className={`
                  relative rounded-xl p-4 border-2 cursor-pointer transition-all duration-300
                  ${selectedOption === 'manual' 
                    ? 'border-cyan-400 bg-cyan-400/10' 
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }
                `}
                onClick={() => handleOptionSelect('manual')}
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-400 flex items-center justify-center mt-0.5">
                    {selectedOption === 'manual' && (
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">
                      🛠️ Manual Installation
                    </h3>
                    <p className="text-slate-300 text-sm mb-3">
                      I prefer to install the required tools myself and handle downloading missing tools.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-slate-600/20 text-slate-400 text-xs rounded-full">
                        Full control
                      </span>
                      <span className="px-2 py-1 bg-slate-600/20 text-slate-400 text-xs rounded-full">
                        Custom paths
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consent checkbox */}
          {selectedOption && (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => handleConsentChange(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400 focus:ring-2 mt-0.5"
                />
                <div>
                  <p className="text-white font-medium">
                    {selectedOption === 'auto' 
                      ? "I agree to let Focule automatically install and configure the required tools (FFmpeg, Whisper, etc.) on my system."
                      : "I understand I'll need to manually install the required tools and will follow the provided instructions."
                    }
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    All tools are open-source and safe. No personal data will be transmitted.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {currentStep === 0 ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Continue →
            </button>
          ) : (
            <>
              <button
                onClick={() => setCurrentStep(0)}
                className="px-6 py-3 text-slate-400 hover:text-slate-300 transition-colors duration-200"
              >
                ← Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedOption || !consentGiven || isProcessing}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  selectedOption === 'auto' ? 'Install Tools Automatically' : 'Continue to Manual Setup'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
