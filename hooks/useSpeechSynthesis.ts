import { useState, useEffect, useCallback } from 'react';

export const useSpeechSynthesis = (language: string, voiceName: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const synth = window.speechSynthesis;

  const speak = useCallback((text: string) => {
    if (isMuted || !synth || !text) {
      return;
    }
    
    if (synth.speaking) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const selectedVoice = voices.find(voice => voice.name === voiceName && voice.lang === language);

    utterance.voice = selectedVoice || voices.find(voice => voice.lang === language) || voices.find(voice => voice.lang.startsWith(language.split('-')[0])) || null;
    utterance.lang = language;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
        // Log the specific error from the event object for better debugging.
        console.error("Speech synthesis error:", (e as SpeechSynthesisErrorEvent).error);
        setIsSpeaking(false);
    };
    
    synth.speak(utterance);
  }, [isMuted, synth, language, voiceName]);

  const cancel = () => {
    if (synth) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(prev => {
        if (!prev === true) { // if un-muting to mute
            cancel();
        }
        return !prev;
    });
  };

  // Ensure voices are loaded
  useEffect(() => {
    const handleVoicesChanged = () => {
      // voices loaded
    };
    if(synth) {
        synth.addEventListener('voiceschanged', handleVoicesChanged);
    }
    return () => {
       if(synth) {
         synth.removeEventListener('voiceschanged', handleVoicesChanged);
       }
    };
  }, [synth]);

  return { isSpeaking, isMuted, speak, cancel, toggleMute, hasSynthesisSupport: !!synth };
};