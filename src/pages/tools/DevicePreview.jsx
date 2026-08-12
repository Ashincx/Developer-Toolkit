import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout';
import { Monitor, Smartphone, Tablet, ExternalLink, RefreshCw } from 'lucide-react';
import './DevicePreview.css';

const devices = [
  { id: 'mobile', name: 'Mobile', width: 375, height: 667, icon: Smartphone },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900, icon: Monitor },
];

const DevicePreview = () => {
  const [url, setUrl] = useState('https://example.com');
  const [width, setWidth] = useState(375);
  const [height, setHeight] = useState(667);
  const [scale, setScale] = useState(100);
  const [activeDevice, setActiveDevice] = useState('mobile');
  
  const formatUrl = (inputStr) => {
    if (!inputStr) return '';
    if (!/^https?:\/\//i.test(inputStr)) {
      return 'https://' + inputStr;
    }
    return inputStr;
  }

  const handleUrlBlur = (e) => {
    setUrl(formatUrl(e.target.value));
  }

  const handleDeviceChange = (device) => {
    setActiveDevice(device.id);
    setWidth(device.width);
    setHeight(device.height);
  };

  const handleReset = () => {
    setUrl('https://example.com');
    handleDeviceChange(devices[0]);
    setScale(100);
  };

  return (
    <ToolLayout 
      id="device-preview" 
      title="Device Preview" 
      description="Test your responsive designs across different screen sizes."
      onReset={handleReset}
    >
      <div className="device-preview-tool">
        <div className="generator-sidebar">
          <div className="control-group">
            <label>Website URL</label>
            <div className="url-input-wrapper">
              <input 
                type="url" 
                className="input" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://your-website.com"
              />
              <a href={url} target="_blank" rel="noopener noreferrer" className="external-link" title="Open in new tab">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div className="control-group">
            <label>Device Presets</label>
            <div className="device-presets">
              {devices.map(device => {
                const Icon = device.icon;
                return (
                  <button
                    key={device.id}
                    className={`device-btn ${activeDevice === device.id ? 'active' : ''}`}
                    onClick={() => handleDeviceChange(device)}
                  >
                    <Icon size={20} />
                    <span>{device.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>Width (px)</label>
              <input 
                type="number" 
                className="input" 
                value={width} 
                onChange={(e) => {
                  setWidth(Number(e.target.value));
                  setActiveDevice('custom');
                }} 
              />
            </div>
            <div className="control-group">
              <label>Height (px)</label>
              <input 
                type="number" 
                className="input" 
                value={height} 
                onChange={(e) => {
                  setHeight(Number(e.target.value));
                  setActiveDevice('custom');
                }} 
              />
            </div>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label>Zoom Scale</label>
              <span>{scale}%</span>
            </div>
            <input 
              type="range" 
              min="25" 
              max="150" 
              value={scale} 
              onChange={(e) => setScale(Number(e.target.value))} 
            />
          </div>

          <button onClick={handleReset} className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }}>
            <RefreshCw size={14} /> Reset
          </button>
        </div>

        <div className="generator-preview-area device-preview-area">
          <div className="preview-container device-preview-container">
            <div className="preview-frame-wrapper" style={{ 
                width: `${width}px`, 
                height: `${height}px`,
                transform: `scale(${scale / 100})`
              }}>
              <iframe 
                src={url} 
                title="Device Preview" 
                className="preview-iframe"
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default DevicePreview;
