'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (transcript: string) => void;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ isOpen, onClose, onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          setIsListening(false);
          handleTranscriptComplete(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}`);
        toast.error('Voice recognition failed. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } else {
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTranscriptComplete = async (finalTranscript: string) => {
    if (!finalTranscript.trim()) return;

    setIsProcessing(true);
    try {
      // Process the voice search with AI
      const response = await fetch('/api/voice-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: finalTranscript }),
      });

      const data = await response.json();

      if (data.success) {
        // Speak the response if available
        if (data.data.responseText) {
          speakText(data.data.responseText);
        }
        
        // Pass the result back to parent
        onResult(finalTranscript);
        toast.success('Voice search completed!');
      } else {
        throw new Error(data.message || 'Voice search failed');
      }
    } catch (error) {
      console.error('Voice search error:', error);
      toast.error('Failed to process voice search');
      setError('Failed to process voice search');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      
      // Auto-stop after 10 seconds
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 10000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClose = () => {
    stopListening();
    setTranscript('');
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Voice Search</h2>
            <p className="text-gray-400">
              {isListening ? 'Listening...' : 'Click the microphone to start'}
            </p>
          </div>

          {/* Microphone Button */}
          <div className="flex justify-center mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`
                relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
                ${isListening 
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                  : 'bg-gray-700 hover:bg-gray-600'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}

              {/* Pulse animation when listening */}
              {isListening && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-red-400 opacity-30"
                />
              )}
            </motion.button>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="glass rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">You said:</p>
                <p className="text-white">{transcript}</p>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="glass rounded-lg p-4 border border-red-500/30">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Instructions */}
          <div className="text-center">
            <div className="text-sm text-gray-400 space-y-1">
              <p>Try saying:</p>
              <p className="text-gray-300">"Show me action movies"</p>
              <p className="text-gray-300">"Find movies with Tom Hanks"</p>
              <p className="text-gray-300">"I want something funny"</p>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gray-900/80 rounded-2xl flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Processing your request...</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceSearch;
