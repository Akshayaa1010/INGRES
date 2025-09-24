
import { useState, useEffect, useRef } from 'react';

// A polyfill for browsers that might name it webkitSpeechRecognition
// FIX: Cast window to `any` to access experimental browser APIs without TypeScript errors.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (language: string) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // FIX: Use `any` for the ref type because the `SpeechRecognition` variable is now of type `any`
  // and cannot be used as a type annotation. This resolves all related type errors for the recognition object.
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setTranscript(currentTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return { isListening, transcript, startListening, stopListening, hasRecognitionSupport: !!SpeechRecognition };
};
