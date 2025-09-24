import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, LanguageOption, PredictionData, GroundwaterData } from '../types';
import { getChatbotResponse, startChat, getPredictionFromGemini } from '../services/geminiService';
import { groundwaterData } from '../data/groundwaterData';
import { LANGUAGES, BOT_NAME } from '../constants';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import DataVisualizer from './DataVisualizer';
import MicrophoneIcon from './icons/MicrophoneIcon';
import SendIcon from './icons/SendIcon';
import VolumeUpIcon from './icons/VolumeUpIcon';
import VolumeOffIcon from './icons/VolumeOffIcon';


const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<LanguageOption>(LANGUAGES[0]);
    
    const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition(language.code);
    const { isMuted, speak, toggleMute, hasSynthesisSupport } = useSpeechSynthesis(language.code, language.voiceName);

    const messageListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startChat();
        setMessages([
            { id: Date.now().toString(), text: `Hello! I am ${BOT_NAME}. How can I help you analyze groundwater data today? You can ask me for suggestions, predictions, or to visualize data for a district.`, sender: 'bot', type: 'text' }
        ]);
    }, []);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;
        
        const userMessage: Message = { id: Date.now().toString(), text, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const responseText = await getChatbotResponse(userMessage, messages, language.name);
        setIsLoading(false);

        // Command parsing
        if (responseText.startsWith('[SHOW_GRAPH:')) {
            const district = responseText.substring(responseText.indexOf(':') + 1, responseText.indexOf(']')).trim();
            const districtData = groundwaterData.filter(d => d.District.toLowerCase() === district.toLowerCase());
            if(districtData.length > 0) {
                 const botMessage: Message = { id: (Date.now() + 1).toString(), text: `Visualizing data for ${district}`, sender: 'bot', type: 'graph', data: { districtData } };
                 setMessages(prev => [...prev, botMessage]);
                 speak(botMessage.text);
            } else {
                 const botMessage: Message = { id: (Date.now() + 1).toString(), text: `Sorry, I couldn't find data for ${district}.`, sender: 'bot', type: 'text' };
                 setMessages(prev => [...prev, botMessage]);
                 speak(botMessage.text);
            }
        } else if (responseText.startsWith('[PREDICT:')) {
            const district = responseText.substring(responseText.indexOf(':') + 1, responseText.indexOf(']')).trim();
            const predictionText = `Hold on, I am running a forecast for ${district} for the year 2026...`;
            const thinkingMessage: Message = { id: (Date.now() + 1).toString(), text: predictionText, sender: 'bot', type: 'text' };
            setMessages(prev => [...prev, thinkingMessage]);
            speak(predictionText);

            const predictionJsonString = await getPredictionFromGemini(district, language.name);
            try {
                // FIX: Update type assertion to handle potential error property in the JSON response.
                const predictionResult = JSON.parse(predictionJsonString) as (Omit<PredictionData, 'District' | 'Year'> & { error?: string });
                if(predictionResult.error) throw new Error(predictionResult.error);

                const predictionData: PredictionData = { ...predictionResult, District: district, Year: 2026 };
                const districtData = groundwaterData.filter(d => d.District.toLowerCase() === district.toLowerCase());
                
                const resultText = `Here is the forecast for ${district} for 2026. My confidence in this forecast is **${predictionData.confidence}**.`;
                const predictionMessage: Message = { id: (Date.now() + 2).toString(), text: resultText, sender: 'bot', type: 'prediction', data: { districtData, predictionData }};
                setMessages(prev => [...prev, predictionMessage]);
                speak(`${resultText} My rationale is: ${predictionData.rationale}`);

            } catch (e) {
                console.error("Failed to parse prediction", e);
                const errorMessage: Message = { id: (Date.now() + 2).toString(), text: "I'm sorry, I couldn't generate a reliable forecast at this time.", sender: 'bot', type: 'text' };
                setMessages(prev => [...prev, errorMessage]);
                speak(errorMessage.text);
            }
        } else {
            const botMessage: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot', type: 'text' };
            setMessages(prev => [...prev, botMessage]);
            speak(responseText);
        }

    }, [isLoading, messages, language, speak]);

    return (
        <div className="flex flex-col h-full bg-gray-900">
             {/* Controls */}
            <div className="p-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div>
                    <label htmlFor="language-select" className="text-sm mr-2 text-gray-400">Language:</label>
                    <select
                        id="language-select"
                        value={language.code}
                        onChange={(e) => setLanguage(LANGUAGES.find(l => l.code === e.target.value) || LANGUAGES[0])}
                        className="bg-gray-700 text-white rounded-md p-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                    </select>
                </div>
                 {hasSynthesisSupport && (
                    <button onClick={toggleMute} className="p-2 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </button>
                )}
            </div>

            {/* Message List */}
            <div ref={messageListRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xl lg:max-w-2xl rounded-lg px-4 py-2 shadow-md ${msg.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            {msg.type === 'text' && <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>}
                            {msg.type === 'graph' && <DataVisualizer districtData={msg.data.districtData} />}
                            {msg.type === 'prediction' && (
                                <>
                                    <p className="whitespace-pre-wrap mb-4" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                                    <DataVisualizer districtData={msg.data.districtData} predictionData={msg.data.predictionData} />
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-200 rounded-lg px-4 py-3 shadow-md flex items-center space-x-2">
                             <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></span>
                            <span>{BOT_NAME} is thinking...</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center bg-gray-700 rounded-full p-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
                        placeholder={isListening ? "Listening..." : "Ask me anything..."}
                        className="flex-1 bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                    />
                    {hasRecognitionSupport && (
                         <button onClick={isListening ? stopListening : startListening} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'hover:bg-gray-600'}`}>
                            <MicrophoneIcon />
                        </button>
                    )}
                    <button onClick={() => handleSendMessage(input)} disabled={!input.trim() || isLoading} className="p-2 ml-2 bg-cyan-600 rounded-full hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;