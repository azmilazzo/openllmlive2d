import React, { useState, useEffect, useRef, ChangeEvent } from 'react'; // Added useRef, ChangeEvent
import ReactDOM from 'react-dom/client';
import './main.css';
import { useLive2D } from './hooks/useLive2D'; // Import the hook

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [openRouterModelName, setOpenRouterModelName] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for the Live2D canvas
  const { loadModel, isLoading: live2DLoading, error: live2DError, modelLoaded } = useLive2D(canvasRef);
  const [live2DModelStatus, setLive2DModelStatus] = useState<string>('');

  useEffect(() => {
    if (live2DLoading) {
      setLive2DModelStatus('Loading Live2D model...');
    } else if (live2DError) {
      setLive2DModelStatus(`Error: ${live2DError}`);
    } else if (modelLoaded) {
      setLive2DModelStatus('Live2D model loaded successfully!');
    } else {
      setLive2DModelStatus('Load a Live2D model using the settings panel.');
    }
  }, [live2DLoading, live2DError, modelLoaded]);

  const handleLive2DModelLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setLive2DModelStatus('No files selected.');
      return;
    }

    setLive2DModelStatus('Processing files...');

    let modelJsonFile: File | null = null;
    const resources: { [path: string]: Blob } = {};
    let modelJsonPath: string = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = file.webkitRelativePath || file.name; // webkitRelativePath includes the folder structure

      if (filePath.endsWith('.model3.json')) {
        modelJsonFile = file;
        modelJsonPath = filePath; // Capture the full path of model3.json
      }
      // Store all files as blobs, keyed by their relative path from the root of selection
      resources[filePath] = file;
    }

    if (!modelJsonFile) {
      setLive2DModelStatus('Error: No .model3.json file found in the selected folder.');
      return;
    }

    try {
      const modelJsonText = await modelJsonFile.text();
      const modelJson = JSON.parse(modelJsonText);

      // The `resources` object should have keys that match paths in model3.json
      // The paths in model3.json are relative to the model3.json file itself.
      // We need to adjust the keys in `resources` or how we look them up.
      // For simplicity, we'll assume paths in model3.json are relative to the *root* of the selected folder.
      // This means `resources` keys (which are like `Shizuku/Shizuku.model3.json`, `Shizuku/textures/texture_00.png`)
      // should be directly usable if the modelJson refers to "textures/texture_00.png".

      // If modelJson paths are relative to its own directory, we need to prefix them.
      // Example: if modelJsonPath is "Shizuku/Shizuku.model3.json" and a texture is "textures/texture_00.png",
      // the key in `resources` would be "Shizuku/textures/texture_00.png".
      const modelDir = modelJsonPath.substring(0, modelJsonPath.lastIndexOf('/') + 1);
      const remappedResources: { [path: string]: Blob } = {};

      // Remap resource keys to be relative to modelJson file, if necessary for live2d.ts logic
      // The current live2d.ts expects keys to be exactly as they appear in model3.json's FileReferences
      // if those are relative to the model file itself.
      // However, our `resources` keys are full paths from the selected folder's root.

      // The `live2d.ts` provided expects resource keys to match the paths *inside* the model3.json.
      // So, if model3.json says "texture_00.png", it expects `resources["texture_00.png"]`.
      // But our current `resources` keys are `model_folder/texture_00.png`.
      // We need to create a new resources map for `loadModel` where keys are relative to the model3.json's folder.

      const resourcesForLoader: { [path: string]: Blob } = {};
      for (const key in resources) {
        if (key.startsWith(modelDir)) {
          const relativeKey = key.substring(modelDir.length);
          resourcesForLoader[relativeKey] = resources[key];
        } else {
           // This case might happen if files are outside the model's immediate directory but still selected.
           // Or if modelDir is empty (model3.json at root of selection)
           if (modelDir === "") {
             resourcesForLoader[key] = resources[key];
           }
        }
      }

      await loadModel(modelJson, resourcesForLoader); // Pass the remapped resources

    } catch (error: any) {
      console.error('Error processing Live2D model:', error);
      setLive2DModelStatus(`Error: ${error.message}`);
    }
  };


  // Simulate sending settings to backend (conceptual)
  const handleChatSend = async (message: string) => {
    console.log("Attempting to send chat message:", message);
    console.log("Using OpenRouter API Key:", openRouterApiKey);
    console.log("Using OpenRouter Model:", openRouterModelName);
    // ... (rest of conceptual backend call)
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Open-LLM-VTuber</h1>
        <button onClick={() => setSettingsOpen(!settingsOpen)} className="settings-button">
          {settingsOpen ? 'Close Settings' : 'Settings'}
        </button>
      </header>

      {settingsOpen && (
        <aside className="settings-panel">
          <h2>Settings</h2>
          <div>
            <label htmlFor="apiKey">OpenRouter API Key:</label>
            <input
              type="password"
              id="apiKey"
              value={openRouterApiKey}
              onChange={(e) => setOpenRouterApiKey(e.target.value)}
              placeholder="Enter your OpenRouter API Key"
            />
          </div>
          <div>
            <label htmlFor="modelName">OpenRouter Model Name:</label>
            <input
              type="text"
              id="modelName"
              value={openRouterModelName}
              onChange={(e) => setOpenRouterModelName(e.target.value)}
              placeholder="e.g., openrouter/anthropic/claude-3-haiku"
            />
          </div>
          <div>
            <label htmlFor="live2dModel">Load Live2D Model (Folder):</label>
            <input
              type="file"
              id="live2dModel"
              // @ts-ignore: webkitdirectory is non-standard but widely supported
              webkitdirectory="" directory="" multiple // multiple is useful with directory
              onChange={handleLive2DModelLoad}
            />
             <p style={{fontSize: "0.8em", marginTop: "0.25em"}}>{live2DModelStatus}</p>
          </div>
        </aside>
      )}

      <main className="main-content">
        <div className="live2d-canvas-area">
          <canvas ref={canvasRef} style={{width: "100%", height: "100%"}} />
          {!modelLoaded && !live2DLoading && <p>Live2D Model Area</p>} {/* Show placeholder if no model is loaded/loading */}
        </div>
        <div className="chat-area">
          <p>Chat Interface Area</p>
          <button onClick={() => handleChatSend("Hello AI!")} style={{marginTop: "10px"}}>
            Send Test Message
          </button>
        </div>
      </main>

      <footer className="app-footer">
        <p>Mic / Input Area</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
