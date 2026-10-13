import React from "react";
import { createRoot } from "react-dom/client";
import Router from "./Router";
import "./pages/index.css";
import "./layout.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container missing in index.html");
}

createRoot(container).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
