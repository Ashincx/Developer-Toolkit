import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import CSSFilterGenerator from './pages/tools/CSSFilterGenerator';
import ColorFilterGenerator from './pages/tools/ColorFilterGenerator';
import BoxShadowGenerator from './pages/tools/BoxShadowGenerator';
import GradientGenerator from './pages/tools/GradientGenerator';
import GlassmorphismGenerator from './pages/tools/GlassmorphismGenerator';
import AnimationBuilder from './pages/tools/AnimationBuilder';
import GridLayoutBuilder from './pages/tools/GridLayoutBuilder';
import DevicePreview from './pages/tools/DevicePreview';
import HtmlToReactConverter from './pages/tools/HtmlToReactConverter';
import IconCreator from './pages/tools/IconCreator';
import CSSRootGenerator from './pages/tools/CSSRootGenerator';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="main-content">
        <Topbar toggleSidebar={toggleSidebar} />
        
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/css-filter" element={<CSSFilterGenerator />} />
            <Route path="/color-filter" element={<ColorFilterGenerator />} />
            <Route path="/box-shadow" element={<BoxShadowGenerator />} />
            <Route path="/gradient-generator" element={<GradientGenerator />} />
            <Route path="/glassmorphism" element={<GlassmorphismGenerator />} />
            <Route path="/animation-builder" element={<AnimationBuilder />} />
            <Route path="/grid-builder" element={<GridLayoutBuilder />} />
            <Route path="/device-preview" element={<DevicePreview />} />
            <Route path="/html-to-react" element={<HtmlToReactConverter />} />
            <Route path="/icon-creator" element={<IconCreator />} />
            <Route path="/css-root-generator" element={<CSSRootGenerator />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
