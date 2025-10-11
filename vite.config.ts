import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = env.VITE_SUPABASE_PROJECT_ID;
  const supabaseUrl = env.VITE_SUPABASE_URL || (projectId ? `https://${projectId}.supabase.co` : "https://jfgcwwlorwvdthadjtye.supabase.co");
  const supabaseAnon = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2N3d2xvcnd2ZHRoYWRqdHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTM1MzYsImV4cCI6MjA3NDkyOTUzNn0.HMd6vFDzQTTS89D1naPg2J9_J33_VFQ4XN_-X6Jzz0I";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseAnon),
    },
  };
});
