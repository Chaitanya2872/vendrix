import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes.tsx";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
