import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Copy, Download, Check } from 'lucide-react';
import { rgbArrayToHex, clusterColors, shade, tint, getAccessibleTextColor, extractColorsFromImage } from '../../utils/colorUtils';
import './CSSRootGenerator.css';

const defaultNeutrals = {
  white: '#FFFFFF',
  black: '#000000',
  bg: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  bgTertiary: '#F1F5F9',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB'
};

const CSSRootGenerator = () => {
  const [logoSrc, setLogoSrc] = useState(null);
  const [extractedColors, setExtractedColors] = useState([]);
  const [colorRoles, setColorRoles] = useState({
    primary: '#2457D6',
    secondary: '#16A085',
    accent: '#F39C12'
  });
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoSrc(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const extractColors = () => {
    if (!imgRef.current) return;
    
    try {
      // Wait for image to load completely
      if (imgRef.current.complete) {
        processImage();
      } else {
        imgRef.current.addEventListener('load', function() {
          processImage();
        });
      }
    } catch (error) {
      console.error("Error extracting colors:", error);
    }
  };

  const processImage = () => {
    try {
      const paletteRgb = extractColorsFromImage(imgRef.current, 8);
      if (paletteRgb.length === 0) return;
      
      const dominantHex = rgbArrayToHex(paletteRgb[0]);
      const paletteHex = paletteRgb.map(rgbArrayToHex);
      
      // Filter out grays/whites/blacks for brand colors
      const isColorful = (rgb) => {
        const [r, g, b] = rgb;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        // Ignore colors with low saturation
        return diff > 30;
      };

      const colorfulPalette = paletteRgb.filter(isColorful).map(rgbArrayToHex);
      
      let newRoles = { ...colorRoles };
      
      // Assign primary
      if (colorfulPalette.length > 0) {
        newRoles.primary = colorfulPalette[0];
      } else {
        newRoles.primary = dominantHex;
      }

      // Assign secondary
      if (colorfulPalette.length > 1) {
        newRoles.secondary = colorfulPalette[1];
      }
      
      // Assign accent
      if (colorfulPalette.length > 2) {
        newRoles.accent = colorfulPalette[2];
      }

      const allExtracted = [dominantHex, ...paletteHex];
      const uniqueColors = Array.from(new Set(allExtracted));
      
      setExtractedColors(uniqueColors);
      setColorRoles(newRoles);
    } catch (err) {
      console.error("Image process error", err);
    }
  };

  // Run extraction when image source changes
  useEffect(() => {
    if (logoSrc) {
      // Need a small timeout to ensure img renders before extraction
      const timer = setTimeout(() => {
        extractColors();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [logoSrc]);

  const updateRoleColor = (role, color) => {
    setColorRoles(prev => ({ ...prev, [role]: color }));
  };

  const generateCSSVariables = () => {
    const primaryHover = shade(colorRoles.primary, 20);
    const primaryActive = shade(colorRoles.primary, 35);
    const primaryLight = tint(colorRoles.primary, 80);
    const primaryDark = shade(colorRoles.primary, 40);

    const secondaryHover = shade(colorRoles.secondary, 20);
    const secondaryLight = tint(colorRoles.secondary, 80);

    const accentLight = tint(colorRoles.accent, 80);

    const primaryText = getAccessibleTextColor(colorRoles.primary);
    const secondaryText = getAccessibleTextColor(colorRoles.secondary);

    return `:root {
  /* Brand */
  --color-primary: ${colorRoles.primary};
  --color-primary-hover: ${primaryHover};
  --color-primary-active: ${primaryActive};
  --color-primary-light: ${primaryLight};
  --color-primary-dark: ${primaryDark};

  --color-secondary: ${colorRoles.secondary};
  --color-secondary-hover: ${secondaryHover};
  --color-secondary-light: ${secondaryLight};

  --color-accent: ${colorRoles.accent};
  --color-accent-light: ${accentLight};

  /* Background */
  --color-bg: ${defaultNeutrals.bg};
  --color-bg-secondary: ${defaultNeutrals.bgSecondary};
  --color-bg-tertiary: ${defaultNeutrals.bgTertiary};

  /* Text */
  --color-text: ${defaultNeutrals.text};
  --color-text-secondary: ${defaultNeutrals.textSecondary};
  --color-text-muted: ${defaultNeutrals.textMuted};

  /* Border */
  --color-border: ${defaultNeutrals.border};
  --color-border-light: ${defaultNeutrals.borderLight};

  /* Status */
  --color-success: ${defaultNeutrals.success};
  --color-warning: ${defaultNeutrals.warning};
  --color-danger: ${defaultNeutrals.danger};
  --color-info: ${defaultNeutrals.info};

  /* Buttons */
  --button-primary-bg: var(--color-primary);
  --button-primary-hover: var(--color-primary-hover);
  --button-primary-text: ${primaryText};

  --button-secondary-bg: var(--color-secondary);
  --button-secondary-hover: var(--color-secondary-hover);
  --button-secondary-text: ${secondaryText};

  /* Links */
  --link-color: var(--color-primary);
  --link-hover: var(--color-primary-hover);
}`;
  };

  const cssString = generateCSSVariables();

  const handleCopy = () => {
    navigator.clipboard.writeText(cssString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([cssString], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="css-root-generator">
      <div className="tool-header">
        <h1>CSS Root Generator</h1>
        <p>Automatically generate a production-ready CSS :root color system from an uploaded logo.</p>
      </div>

      <div className="top-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
        <div className="upload-section">
            <h3>1. Upload Logo</h3>
            {!logoSrc ? (
              <div 
                className={`upload-dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="upload-icon" />
                <p>Drag & drop your logo here</p>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>or click to browse (PNG, JPG, SVG)</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileInput} 
                  accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                  style={{ display: 'none' }} 
                />
              </div>
            ) : (
              <div className="uploaded-logo-preview">
                <img 
                  ref={imgRef}
                  src={logoSrc} 
                  alt="Uploaded Logo" 
                  crossOrigin="anonymous"
                />
                <div>
                  <button className="remove-logo-btn" onClick={() => {
                    setLogoSrc(null);
                    setExtractedColors([]);
                  }}>
                    Remove Logo
                  </button>
                </div>
              </div>
            )}
          </div>

          {extractedColors.length > 0 && (
          <div className="roles-section">
              <h3>2. Extracted Palette</h3>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                Click a color to use it.
              </p>
              <div className="color-swatches">
                {extractedColors.map((color, idx) => (
                  <div key={idx} className="color-swatch-item">
                    <div 
                      className="color-circle" 
                      style={{ backgroundColor: color }}
                      onClick={() => navigator.clipboard.writeText(color)}
                      title="Click to copy Hex"
                    ></div>
                    <span className="color-hex">{color}</span>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: '24px' }}>Color Roles</h3>
              <div className="roles-list">
                {Object.keys(colorRoles).map(role => (
                  <div key={role} className="role-item">
                    <div className="role-info">
                      <div className="role-color-preview" style={{ backgroundColor: colorRoles[role] }}></div>
                      <span className="role-name">{role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="role-hex">{colorRoles[role]}</span>
                      <input 
                        type="color" 
                        value={colorRoles[role]}
                        onChange={(e) => updateRoleColor(role, e.target.value)}
                        className="color-picker-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      <div className="generator-grid">
        {/* Left Column */}
        <div className="left-col">
          <div className="preview-section">
            <h3>Component Preview</h3>
            
            {/* Injecting a style tag just for previewing in this component */}
            <style dangerouslySetInnerHTML={{ __html: `.css-root-preview-container { ${cssString.replace(':root {', '').replace('}', '')} }` }} />
            
            <div className="css-root-preview-container">
              <div className="preview-row">
                <button className="preview-btn primary">Primary Button</button>
                <button className="preview-btn secondary">Secondary Button</button>
              </div>
              
              <div className="preview-row">
                <a href="#" className="preview-link" onClick={e=>e.preventDefault()}>Learn More &rarr;</a>
                <span className="preview-badge">New</span>
              </div>
              
              <div className="preview-row">
                <input type="email" placeholder="Enter your email" className="preview-input" />
              </div>

              <div className="preview-card">
                <h3>Card Title</h3>
                <p>This is a description text demonstrating the neutral text colors applied by default to maintain readability and contrast.</p>
                <button className="preview-btn primary" style={{ width: '100%' }}>View Details</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          <div className="code-section">
            <div className="code-header">
              <h3>Generated CSS :root</h3>
              <div className="code-actions">
                <button className="code-btn" onClick={handleCopy}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy CSS'}
                </button>
                <button className="code-btn primary" onClick={handleDownload}>
                  <Download size={16} />
                  Download CSS
                </button>
              </div>
            </div>
            
            <div className="code-block-container">
              <pre>{cssString}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSSRootGenerator;
