import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        watch: {
            usePolling: true, // Enables polling for file changes
        },
        host: true, // Allows access from networked devices
        strictPort: true,
        port: 5173, // Default Vite port; adjust if necessary
    },
});
