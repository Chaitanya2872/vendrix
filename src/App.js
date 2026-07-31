import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes";
import React from "react";
function App() {
    return (React.createElement(BrowserRouter, null,
        React.createElement(AppRoutes, null)));
}
export default App;
