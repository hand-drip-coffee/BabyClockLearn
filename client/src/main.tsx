import { createRoot } from "react-dom/client";
import App from "./App";
// Bundled Korean font (split by unicode range) so text looks the same on every device and works offline
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
