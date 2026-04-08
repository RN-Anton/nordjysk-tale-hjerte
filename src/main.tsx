import { createRoot } from "react-dom/client";
import { msalInstance } from "./authConfig";
import App from "./App.tsx";
import "./index.css";

msalInstance.initialize().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
