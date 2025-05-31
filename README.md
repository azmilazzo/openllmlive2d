
# Open-LLM-VTuber (Client-Side Edition)

This project is a client-side web application that allows you to interact with an AI, powered by OpenRouter, visualized with a Live2D avatar loaded from your local device. It's designed to run directly in your browser without needing a separate backend server.

## Features

-   **AI Chat:** Converse with an AI model of your choice via OpenRouter.
-   **OpenRouter Integration:** Configure your OpenRouter API Key and desired AI model directly in the application's settings.
-   **Local Live2D Models:** Load your own Live2D avatars from your computer's local storage.
-   **Responsive UI:** The interface is designed to be usable on both desktop and mobile browsers.
-   **Client-Side Operation:** Runs entirely in your browser after initial setup. No Python backend required.

## Technologies Used

-   React
-   TypeScript
-   Vite (for frontend tooling and development server)
-   PIXI.js (for Live2D rendering)
-   `pixi-live2d-display` (or compatible library for Live2D integration with PIXI.js)
-   OpenRouter API

## Getting Started

### Prerequisites

-   Node.js (which includes npm) installed on your system. You can download it from [nodejs.org](https://nodejs.org/).
-   A modern web browser (e.g., Chrome, Firefox, Edge, Safari).

### Running the Application

1.  **Clone the repository (or download the source code):**
    ```bash
    git clone <repository_url>
    cd <repository_directory_name>
    ```

2.  **Navigate to the frontend application directory:**
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start a local development server (usually at `http://localhost:5173` or a similar address – check your terminal output).

5.  **Open in your browser:**
    Open the local address provided by the Vite development server in your web browser.

### Building for Production (Optional)

If you want to host the application as static files (e.g., on GitHub Pages, Netlify, Vercel):

1.  **Navigate to the `frontend` directory.**
2.  **Build the static assets:**
    ```bash
    npm run build
    ```
    This will create a `dist` folder inside the `frontend` directory containing the optimized static files.
3.  **Deploy the `frontend/dist` directory** to your chosen static hosting service.

## Configuration

All configuration is done directly within the web application's UI:

1.  **OpenRouter Settings:**
    *   Click on the "Settings" button in the application.
    *   Enter your **OpenRouter API Key**.
    *   Enter the **OpenRouter Model Name** you wish to use (e.g., `openrouter/anthropic/claude-3-haiku-20240307`).

    > **IMPORTANT SECURITY WARNING:** Your OpenRouter API Key is handled directly by your browser and sent with requests to OpenRouter.
    > - Ensure you are running this application in a trusted environment.
    > - Do not use this on public or untrusted computers.
    > - Be aware of the security implications of your API key being client-side.

2.  **Loading Live2D Models:**
    *   In the Settings panel, find the "Load Live2D Model Folder" input.
    *   Click the input and select the **folder** on your local device that contains your Live2D model files (including the `.model3.json` file and all associated textures, motions, etc.).
    *   The application will then attempt to load and display the model.

## License

This project is likely based on the original Open-LLM-VTuber project. Please refer to the original license if applicable, or assume MIT unless a `LICENSE` file in this repository states otherwise. (If a LICENSE file was part of the scaffolding, its original terms apply).



This README provides guidance for the client-side version of Open-LLM-VTuber.
# Open-LLM-VTuber Mobile Webapp
