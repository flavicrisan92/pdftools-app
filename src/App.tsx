import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { MergePdf } from './pages/MergePdf';
import { SplitPdf } from './pages/SplitPdf';
import { CompressPdf } from './pages/CompressPdf';
import { ConvertPdf } from './pages/ConvertPdf';
import { Pricing } from './pages/Pricing';
import { Login } from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<MergePdf />} />
            <Route path="/split" element={<SplitPdf />} />
            <Route path="/compress" element={<CompressPdf />} />
            <Route path="/convert" element={<ConvertPdf />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
