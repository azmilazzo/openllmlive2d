# Changelog

## [Unreleased] - YYYY-MM-DD


### Architectural Shift to Client-Side

-   **Converted to Fully Client-Side Application:**
    -   Removed the Python backend server and all associated Python code (`run_server.py`, `src/open_llm_vtuber/`, `pyproject.toml`, etc.).
    -   The application now runs entirely in the user's browser.
-   **Direct OpenRouter API Calls:**
    -   Frontend (`main.tsx`) now makes API calls directly to the OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`).
    -   Removed all frontend dependencies and assumptions related to a local backend.
-   **Project Structure Simplification:**
    -   Removed backend-specific files and directories from the project root.
    -   The root `.gitignore` file was updated to remove Python-specific entries.
-   **Build and Deployment:**
    -   The application is now built as a set of static assets using Vite (`npm run build` in the `frontend` directory).
    -   Deployment instructions updated in `README.md` for static hosting (e.g., GitHub Pages, Netlify, Vercel).
-   **Security Note:**
    -   Added explicit warnings in the UI and `README.md` regarding the client-side handling of the OpenRouter API key.

### Features Adapted/Retained from Previous Version (Now Client-Side)

-   **Mobile Webapp Focus:**
    -   Frontend setup for web deployment (Vite-based).
    -   Implemented a responsive UI shell suitable for mobile devices, including a collapsible settings panel, main content area for Live2D and chat, and header/footer.
-   **OpenRouter AI Integration:**
    -   Frontend: UI elements in settings for users to input their OpenRouter API Key and Model Name.
    -   (Backend logic for this is now client-side logic within `main.tsx`).
-   **Local Live2D Model Loading:**
    -   Frontend: Implemented functionality to allow users to select a local directory containing a Live2D model.
    -   Frontend: Added logic to read model files (`.model3.json`, textures, motions, physics, moc3) from the selected directory.
    -   Frontend: Integrated with PIXI.js and `pixi-live2d-display` (or a compatible library) to load and render the user-provided Live2D model on a canvas.
    -   Frontend: Added basic user feedback for the model loading process (status messages).
-   **Initial Project Scaffolding (Conceptual Basis):**
    -   The client-side application builds upon the UI and some structural ideas from the initial scaffolding phase which included backend simulation.
    -   Core frontend components (`package.json`, `vite.config.ts`, `tsconfig.json`) were established and refined.

### Key Changes (Reflecting Client-Side Shift)

-   **Frontend Architecture:** Now fully standalone, with Vite as the build tool.
-   **API Communication:** Shifted from backend-proxied/mediated API calls to direct client-to-OpenRouter API calls.
-   **UI:** Maintained and enhanced the responsive layout in `frontend/src/main.tsx` and `frontend/src/main.css`.
-   **Configuration:** All user-configurable settings (API keys, model names) are now managed and utilized client-side.

### Removed (Reflecting Client-Side Shift)

-   All Python backend code, server (`run_server.py`), and related configuration (`pyproject.toml`, Python-specific `src/` contents, `config_templates/`, etc.).
-   Electron-specific build configurations and scripts from the frontend's `package.json`.

### Fixed

-   (Focus of this phase was architectural shift; specific bug fixes from a pre-existing client-side state are not applicable. Previous backend "fixes" are now part of the removed backend.)

### Security Considerations (Client-Side Specific)

-   User-provided OpenRouter API keys are handled directly in the browser and transmitted with each API request. Users are warned about this.
-   Loading Live2D models from local storage is handled via standard browser file input mechanisms. No files are uploaded to any server.

---
*This changelog reflects the evolution towards a fully client-side application.*

This changelog documents the transformation of the Open-LLM-VTuber project into a mobile-focused web application with specific enhancements.

### Added

-   **Mobile Webapp Focus:**
    -   Restructured frontend setup for web deployment (Vite-based).
    -   Implemented a responsive UI shell suitable for mobile devices, including a collapsible settings panel, main content area for Live2D and chat, and header/footer.
-   **OpenRouter AI Integration:**
    -   Frontend: Added UI elements in settings for users to input their OpenRouter API Key and Model Name.
    -   Backend: Modified `LLMClientManager` to use user-provided OpenRouter credentials (API Key and dynamically set base URL to OpenRouter endpoint) for LLM calls.
    -   Backend: Ensured `conf.yaml` can be configured for a default OpenRouter setup without a pre-stored API key, relying on user input.
-   **Local Live2D Model Loading:**
    -   Frontend: Implemented functionality to allow users to select a local directory containing a Live2D model.
    -   Frontend: Added logic to read model files (`.model3.json`, textures, motions, physics, moc3) from the selected directory.
    -   Frontend: Integrated with PIXI.js and `pixi-live2d-display` (or a compatible library) to load and render the user-provided Live2D model on a canvas. This includes creating Object URLs for local resources and modifying model JSON paths.
    -   Frontend: Added basic user feedback for the model loading process (status messages).
-   **Project Scaffolding:**
    -   Simulated cloning of the original `Open-LLM-VTuber` and `Open-LLM-VTuber-Web` repositories by creating essential directory structures and populating key files for both backend (Python) and frontend (React/TypeScript).
    -   Added core backend modules for LLM and character management (`llm_config_manager.py`, `character_manager.py`).
    -   Set up frontend with `package.json`, `vite.config.ts`, `tsconfig.json`, and placeholder components.
-   **Configuration:**
    -   Backend `OpenAICompatibleConfig` now supports an optional API key, allowing for default LLM configurations that expect user-provided keys (e.g., for OpenRouter).

### Changed

-   **Frontend Architecture:** Shifted from an Electron-focused build to a standard Vite web build for `Open-LLM-VTuber-Web` components.
-   **Backend LLM Handling:** `LLMClientManager` in `llm_config_manager.py` was significantly enhanced to dynamically configure the LLM client based on frontend inputs (for OpenRouter) or fallback to `conf.yaml` defaults.
-   **UI:** Introduced a new responsive layout in `frontend/src/main.tsx` and `frontend/src/main.css`.

### Removed

-   Electron-specific build configurations and scripts from the frontend's `package.json` (conceptually, as part of focusing on a web build).

### Fixed

-   (No specific bug fixes from a pre-existing state, as this was new development based on an existing project).

### Security

-   User-provided OpenRouter API keys are handled on the client-side for input and transmitted to the backend per request; they are not stored long-term by the application in this version.
-   Loading Live2D models from local storage is handled via standard browser file input mechanisms.

