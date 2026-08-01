import { BrowserRouter } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import { AppRoutes } from "@/routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <VendorProvider>
        <AppRoutes />
      </VendorProvider>
    </BrowserRouter>
  );
}

export default App;