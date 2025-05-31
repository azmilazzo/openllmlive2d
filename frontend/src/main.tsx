import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import ReactDOM from 'react-dom/client';
import './main.css';
import { useLive2D } from './hooks/useLive2D'; // Assuming this path

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Live2DResources { [path: string]: File; }

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModelName, setOpenRouterModelName] = useState('openrouter/anthropic/claude-3-haiku-20240307'); // Default model

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { loadModel, isLoading: isModelLoading, error: modelError, modelLoaded } = useLive2D(canvasRef);
  const live2DFileRef = useRef<HTMLInputElement>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null); // For scrolling chat

  useEffect(() => {
    // Scroll to bottom of chat on new message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleChatSubmit = async () => {
    if (!userInput.trim() || isLoading) return;
    if (!openRouterApiKey) {
        setChatError("OpenRouter API Key is missing. Please set it in Settings.");
        // Also add to chat history for visibility if settings panel is closed
        setChatHistory(prev => [...prev, {role: 'system', content: "OpenRouter API Key is missing. Please set it in Settings."}]);
        return;
    }
    if (!openRouterModelName) {
        setChatError("OpenRouter Model Name is missing. Please set it in Settings.");
        setChatHistory(prev => [...prev, {role: 'system', content: "OpenRouter Model Name is missing. Please set it in Settings."}]);
        return;
    }

    const newUserMessage: Message = { role: 'user', content: userInput };
    // Add user message to chat history immediately for responsiveness
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);
    const currentInput = userInput; // Capture userInput before clearing
    setUserInput(''); // Clear input field
    setIsLoading(true);
    setChatError(null);

    // Prepare messages for API, including the new user message
    const messagesToSent = [...chatHistory, newUserMessage]; // chatHistory here will not have the latest newUserMessage yet due to state update batching

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173', // Replace with your actual site URL in production
          'X-Title': 'Open-LLM-VTuber Client-Side', // Replace with your app name
        },
        body: JSON.stringify({
          model: openRouterModelName,
          messages: messagesToSent, // Send the constructed list
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
        console.error("OpenRouter API Error:", errorData);
        const errorMessage = `API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}`;
        setChatError(errorMessage);
        setChatHistory(prev => [...prev, {role: 'system', content: errorMessage}]);
      } else {
        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
          const aiMessage: Message = data.choices[0].message;
          setChatHistory(prevHistory => [...prevHistory, aiMessage]);
        } else {
           const emptyResponseMessage = "Received an empty or unexpected response from AI.";
           setChatError(emptyResponseMessage);
           setChatHistory(prev => [...prev, {role: 'system', content: emptyResponseMessage}]);
        }
      }
    } catch (error: any) {
      console.error("Failed to send chat message:", error);
      const networkErrorMessage = `Network or other error: ${error.message || "Failed to connect to API."}`;
      setChatError(networkErrorMessage);
      setChatHistory(prev => [...prev, {role: 'system', content: networkErrorMessage}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLive2DModelLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
        // setLive2DModelStatus('No files selected.'); // Or use modelError from useLive2D
        return;
    }

    // Find .model3.json file
    const modelJsonFile = Array.from(files).find(file => file.name.endsWith('.model3.json'));
    if (!modelJsonFile) {
        alert("No .model3.json file found in the selected folder. Please ensure the folder contains a .model3.json file.");
        return;
    }

    // Determine the base directory of the model from the path of the .model3.json file
    const modelFileFullPath = modelJsonFile.webkitRelativePath || modelJsonFile.name;
    const modelBaseDir = modelFileFullPath.substring(0, modelFileFullPath.lastIndexOf('/') + 1);

    const resources: Live2DResources = {};
    for (const file of Array.from(files)) {
        // Store resources with keys relative to the model's base directory
        const relativePath = (file.webkitRelativePath || file.name).substring(modelBaseDir.length);
        resources[relativePath] = file;
    }

    try {
        const modelJsonText = await modelJsonFile.text();
        const modelJson = JSON.parse(modelJsonText);
        await loadModel(modelJson, resources); // loadModel is from useLive2D hook
    } catch (e: any) {
        alert(`Error loading model: ${e.message}`); // Simple alert for now
        console.error(e);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Open-LLM-VTuber (Client-Side)</h1>
        <button onClick={() => setSettingsOpen(!settingsOpen)} className="settings-button">
          {settingsOpen ? 'Close Settings' : 'Settings'}
        </button>
      </header>

      {settingsOpen && (
        <aside className="settings-panel">
          <h2>Settings</h2>
          <div style={{color: 'orange', marginBottom: '15px', padding: '10px', border: '1px solid orange', borderRadius: '4px', background: '#fff3e0'}}>
            <strong>Security Warning:</strong> Your OpenRouter API Key is used directly from your browser.
            Ensure you understand the implications. Do not use this on public or untrusted computers.
          </div>
          <div>
            <label htmlFor="apiKey">OpenRouter API Key:</label>
            <input
              type="password"
              id="apiKey"
              value={openRouterApiKey}
              onChange={(e) => { setOpenRouterApiKey(e.target.value); setChatError(null); }}
              placeholder="Enter your OpenRouter API Key"
            />
          </div>
          <div>
            <label htmlFor="modelName">OpenRouter Model Name:</label>
            <input
              type="text"
              id="modelName"
              value={openRouterModelName}
              onChange={(e) => { setOpenRouterModelName(e.target.value); setChatError(null); }}
              placeholder="e.g., openrouter/anthropic/claude-3-haiku"
            />
          </div>
          <div>
            <label htmlFor="live2dFile">Load Live2D Model Folder:</label>
            <input
                type="file"
                id="live2dFile"
                webkitdirectory=""
                directory=""
                multiple
                ref={live2DFileRef}
                onChange={handleLive2DModelLoad}
                style={{marginTop: '5px'}}
            />
            {isModelLoading && <p>Loading Live2D model...</p>}
            {modelError && <p style={{color: 'red'}}>Model Error: {modelError}</p>}
            {modelLoaded && <p style={{color: 'green'}}>Model loaded successfully!</p>}
          </div>
        </aside>
      )}

      <main className="main-content">
        <div className="live2d-canvas-area">
          <canvas ref={canvasRef} style={{width: '100%', height: '100%'}}></canvas>
          {!modelLoaded && !isModelLoading && <p>Live2D Model Area - Load a model from settings.</p>}
        </div>
        <div className="chat-area">
          <div className="chat-history" ref={chatContainerRef}>
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-message chat-${msg.role}`}>
                <strong>{msg.role === 'assistant' ? (openRouterModelName.split('/').pop() || 'AI') : msg.role}:</strong> {msg.content}
              </div>
            ))}
            {isLoading && <div className="chat-message chat-system"><em>AI is thinking...</em></div>}
            {/* Display chatError directly in history if needed, or rely on the separate error display area */}
            {/* {chatError && <div className="chat-message chat-system" style={{color: 'red'}}>{chatError}</div>} */}
          </div>
          {chatError && <div className="chat-error-display" style={{color: 'red', padding: '10px', textAlign: 'center'}}>{chatError}</div>}
          <div className="chat-input-area">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleChatSubmit()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button onClick={handleChatSubmit} disabled={isLoading || !userInput.trim()}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Mic / Input Area (Mic not implemented in this version)</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
