// Conceptual content for frontend/src/hooks/useLive2D.ts
import { useRef, useEffect, useCallback, useState } from 'react';
import { loadModelOnCanvas as loadModelUtil, cleanupLive2D as cleanupLive2DUtil, ModelResources } from '../lib/live2d'; // Added ModelResources import

export function useLive2D(canvasRef: React.RefObject<HTMLCanvasElement>) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelLoaded, setModelLoaded] = useState(false); // Added state to track if a model is loaded

    const loadModel = useCallback(async (modelJson: any, resources: ModelResources) => {
        if (!canvasRef.current) {
            const msg = "Canvas element not available.";
            console.error("useLive2D: " + msg);
            setError(msg);
            setModelLoaded(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setModelLoaded(false); // Reset model loaded state
        try {
            // Ensure previous model is cleaned up before loading a new one
            cleanupLive2DUtil(); // Call cleanup before loading a new model
            await loadModelUtil(modelJson, resources, canvasRef.current);
            setModelLoaded(true); // Set model loaded state to true on success
        } catch (e: any) {
            console.error("useLive2D: Error loading model", e);
            setError(e.message || "Failed to load model.");
            setModelLoaded(false); // Ensure model loaded is false on error
        } finally {
            setIsLoading(false);
        }
    }, [canvasRef]);

    // Cleanup effect when the component using the hook unmounts or canvasRef changes
    useEffect(() => {
        // Return a cleanup function
        return () => {
            console.log("useLive2D: Cleaning up Live2D instance on unmount or canvasRef change.");
            cleanupLive2DUtil();
            setModelLoaded(false); // Reset model loaded state on cleanup
        };
    }, [canvasRef]); // Include canvasRef in dependencies if its change should trigger cleanup/re-init.

    return { loadModel, isLoading, error, modelLoaded }; // Added modelLoaded to return
}
