// Conceptual content for frontend/src/lib/live2d.ts
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'; // Using the lipsync patch version
// Ensure window.PIXI is available or manage PIXI instance correctly.
// (window as any).PIXI = PIXI; // Sometimes needed for older plugins
// NOTE: @pixi/live2d-cubism-core is usually a peer dependency or automatically handled
// by pixi-live2d-display. If direct interaction is needed, it would be imported here.

let pixiApp: PIXI.Application | null = null;
let currentModel: Live2DModel<any> | null = null; // Specify generic type for Live2DModel

export interface ModelResources {
  [path: string]: Blob; // Assuming resources are Blobs (e.g., from file inputs)
}

// Function to get the base path from a file path (not strictly needed if keys are full)
// function getBasePath(filePath: string): string {
//     return filePath.substring(0, filePath.lastIndexOf('/') + 1);
// }

export async function loadModelOnCanvas(
    modelJson: any, // Parsed .model3.json content
    resources: ModelResources,
    canvasElement: HTMLCanvasElement
): Promise<void> {
    if (!pixiApp) {
        pixiApp = new PIXI.Application();
        await pixiApp.init({
            view: canvasElement,
            width: canvasElement.clientWidth,
            height: canvasElement.clientHeight,
            autoStart: true,
            backgroundAlpha: 0, // Transparent background
            resizeTo: canvasElement.parentElement || window, // Resize to parent or window
        });
    } else {
        // If reusing, ensure canvas dimensions are updated
        // pixiApp.renderer.resize(canvasElement.clientWidth, canvasElement.clientHeight);
        // For PIXI v7+, use pixiApp.resize() or handle it via resizeTo
        if (pixiApp.view.width !== canvasElement.clientWidth || pixiApp.view.height !== canvasElement.clientHeight) {
             pixiApp.renderer.resize(canvasElement.clientWidth, canvasElement.clientHeight);
        }
    }

    if (currentModel && pixiApp.stage.children.includes(currentModel)) {
        pixiApp.stage.removeChild(currentModel);
        currentModel.destroy();
        currentModel = null;
    }

    const objectUrls = new Map<string, string>(); // To keep track of created URLs for later revocation

    // Create Object URLs for resources and modify modelJson paths
    const modifiedModelJson = JSON.parse(JSON.stringify(modelJson));

    const modelFileDir = modelJson.FileReferences?.File?.substring(0, modelJson.FileReferences.File.lastIndexOf('/') + 1) || '';


    if (modifiedModelJson.FileReferences?.Moc) {
        const mocPath = modifiedModelJson.FileReferences.Moc;
        const resource = resources[mocPath];
        if (resource) {
            const url = URL.createObjectURL(resource);
            objectUrls.set(mocPath, url);
            modifiedModelJson.FileReferences.Moc = url;
        } else {
            console.warn(`Moc resource not found: ${mocPath}`);
            // If Moc is essential and not found, might need to throw error
        }
    }


    if (modifiedModelJson.FileReferences && modifiedModelJson.FileReferences.Textures) {
        modifiedModelJson.FileReferences.Textures.forEach((textureFile: string, index: number) => {
            const resource = resources[textureFile];
            if (resource) {
                const url = URL.createObjectURL(resource);
                objectUrls.set(textureFile, url); // Store for potential cleanup
                modifiedModelJson.FileReferences.Textures[index] = url;
            } else {
                console.warn(`Texture resource not found: ${textureFile}`);
            }
        });
    }

    if (modifiedModelJson.FileReferences && modifiedModelJson.FileReferences.Motions) {
        for (const group in modifiedModelJson.FileReferences.Motions) {
            if (Array.isArray(modifiedModelJson.FileReferences.Motions[group])) {
                modifiedModelJson.FileReferences.Motions[group].forEach((motion: any) => { // motion can be an object
                    if (motion && motion.File) {
                        const motionFilePath = motion.File;
                        const resource = resources[motionFilePath];
                        if (resource) {
                            const url = URL.createObjectURL(resource);
                            objectUrls.set(motionFilePath, url);
                            motion.File = url;
                        } else {
                            console.warn(`Motion resource not found: ${motionFilePath}`);
                        }
                    }
                });
            }
        }
    }

    if (modifiedModelJson.FileReferences && modifiedModelJson.FileReferences.Physics) {
        const physicsFile = modifiedModelJson.FileReferences.Physics;
        const resource = resources[physicsFile];
        if (resource) {
            const url = URL.createObjectURL(resource);
            objectUrls.set(physicsFile, url);
            modifiedModelJson.FileReferences.Physics = url;
        } else {
            console.warn(`Physics resource not found: ${physicsFile}`);
        }
    }

    try {
        currentModel = await Live2DModel.from(modifiedModelJson as any, {
             autoInteract: true,
             autoUpdate: true,
        });

        if (currentModel) {
            pixiApp.stage.addChild(currentModel);
            const canvas = pixiApp.view as HTMLCanvasElement; // Added type assertion
            currentModel.anchor.set(0.5, 0.5);
            currentModel.position.set(canvas.width / 2, canvas.height / 2);

            const modelHeight = currentModel.height;
            const scale = (canvas.height / modelHeight) * 0.8;
            currentModel.scale.set(scale);

            // Play idle animation
            const idleMotionKeys = Object.keys(modelJson.FileReferences?.Motions || {}).filter(key => key.toLowerCase().includes('idle'));
            if (idleMotionKeys.length > 0) {
                 const firstIdleGroupName = idleMotionKeys[0];
                 // Check if the motion group exists and has motions
                 if (modelJson.FileReferences.Motions[firstIdleGroupName] && modelJson.FileReferences.Motions[firstIdleGroupName].length > 0) {
                    currentModel.motion(firstIdleGroupName);
                 } else {
                    console.warn(`Idle motion group '${firstIdleGroupName}' is empty or does not exist.`);
                 }
            } else {
                 console.warn("No motion group with 'idle' in its name found.");
            }
        }
    } catch (error) {
        console.error('Error loading Live2D model:', error);
        // Revoke URLs in case of error too
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        throw error;
    }
    // Consider when to revoke object URLs. If the model loads successfully,
    // these URLs might need to persist if the Live2D library fetches them on demand.
    // If they are loaded upfront, they can be revoked. For simplicity, not revoking immediately.
    // Example: setTimeout(() => objectUrls.forEach(url => URL.revokeObjectURL(url)), 5000);
}

export function cleanupLive2D() {
    if (currentModel) {
        // Make sure to remove from stage before destroying
        if (pixiApp && pixiApp.stage.children.includes(currentModel)) {
            pixiApp.stage.removeChild(currentModel);
        }
        currentModel.destroy({ children: true, texture: true, baseTexture: true });
        currentModel = null;
    }
    if (pixiApp) {
        pixiApp.destroy(true); // true to remove view from DOM and destroy renderer
        pixiApp = null;
    }
    // Here you might also want to revoke any remaining object URLs if you have a global list
}
