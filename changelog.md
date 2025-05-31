# Changelog

## [Unreleased] - YYYY-MM-DD

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
