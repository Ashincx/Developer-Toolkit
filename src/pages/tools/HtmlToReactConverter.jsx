import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import './HtmlToReactConverter.css';

const HtmlToReactConverter = () => {
  const [inputHtml, setInputHtml] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [framework, setFramework] = useState('react'); // 'react' or 'nextjs'
  const [imports, setImports] = useState(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    convertHtml();
  }, [inputHtml, framework]);

  const toCamelCase = (str) => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  };

  const parseStyles = (styleStr) => {
    if (!styleStr) return '{}';
    const styleObj = {};
    const rules = styleStr.split(';');
    rules.forEach((rule) => {
      const [key, value] = rule.split(':');
      if (key && value) {
        const camelKey = toCamelCase(key.trim());
        styleObj[camelKey] = value.trim();
      }
    });
    return JSON.stringify(styleObj, null, 2).replace(/"([^"]+)":/g, '$1:');
  };

  const convertNodeToJsx = (node, currentImports) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text.trim()) return text; // preserve whitespace
      return text;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      return `{/* ${node.textContent} */}`;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    let tagName = node.tagName.toLowerCase();
    
    // Framework specific conversions
    if (framework === 'nextjs') {
      if (tagName === 'img') {
        tagName = 'Image';
        currentImports.add('import Image from "next/image";');
      } else if (tagName === 'a') {
        tagName = 'Link';
        currentImports.add('import Link from "next/link";');
      }
    }

    let attrs = [];
    let styleAttr = null;

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      let name = attr.name;
      let value = attr.value;

      if (name === 'class') name = 'className';
      if (name === 'for') name = 'htmlFor';
      if (name === 'tabindex') name = 'tabIndex';
      if (name === 'readonly') name = 'readOnly';
      if (name === 'maxlength') name = 'maxLength';
      
      // Convert event handlers (onclick -> onClick)
      if (name.startsWith('on')) {
        name = 'on' + name.charAt(2).toUpperCase() + name.slice(3);
        // Usually event handlers have string values in HTML, we should ideally put them in {}
        // but simple mapping for MVP
        attrs.push(`${name}={(e) => { ${value} }}`);
        continue;
      }

      // SVG specific camelCasing (stroke-width -> strokeWidth)
      const svgAttrs = ['stroke-width', 'fill-rule', 'clip-path', 'stroke-linecap', 'stroke-linejoin'];
      if (svgAttrs.includes(name)) {
        name = toCamelCase(name);
      }

      if (name === 'style') {
        styleAttr = parseStyles(value);
      } else {
        // Handle boolean attributes
        if (value === '' && ['disabled', 'checked', 'required', 'readonly'].includes(name.toLowerCase())) {
          attrs.push(name);
        } else if (framework === 'nextjs' && tagName === 'Image' && name === 'src' && !value.startsWith('/')) {
            attrs.push(`${name}="/${value}"`);
        } else {
          attrs.push(`${name}="${value}"`);
        }
      }
    }

    if (framework === 'nextjs' && tagName === 'Image') {
      if (!node.hasAttribute('width')) attrs.push('width={400}');
      if (!node.hasAttribute('height')) attrs.push('height={300}');
      if (!node.hasAttribute('alt')) attrs.push('alt=""');
    }

    if (styleAttr) {
      attrs.push(`style={${styleAttr}}`);
    }

    const attrsString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link', 'Image'];
    
    if (selfClosingTags.includes(tagName)) {
      return `<${tagName}${attrsString} />`;
    }

    let childrenJsx = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      childrenJsx += convertNodeToJsx(node.childNodes[i], currentImports);
    }

    return `<${tagName}${attrsString}>${childrenJsx}</${tagName}>`;
  };

  const convertHtml = () => {
    if (!inputHtml.trim()) {
      setOutputCode('');
      setImports(new Set());
      return;
    }

    try {
      const parser = new DOMParser();
      // Using a wrapper div to handle multiple root elements or plain text without root
      const doc = parser.parseFromString(`<div>${inputHtml}</div>`, 'text/html');
      const wrapper = doc.body.firstChild;
      
      let newImports = new Set();
      let jsxOutput = '';
      
      // Convert children of the wrapper to avoid outputting the wrapper itself
      for (let i = 0; i < wrapper.childNodes.length; i++) {
         jsxOutput += convertNodeToJsx(wrapper.childNodes[i], newImports);
      }
      
      // Format the output slightly (very basic formatting for MVP)
      jsxOutput = jsxOutput.replace(/></g, '>\\n<');
      
      setImports(newImports);
      
      // Construct final output with imports
      let finalCode = '';
      if (newImports.size > 0) {
        finalCode += Array.from(newImports).join('\\n') + '\\n\\n';
      }
      finalCode += jsxOutput;
      
      setOutputCode(finalCode);
    } catch (error) {
      setOutputCode(`// Error parsing HTML: ${error.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertExample = () => {
    setInputHtml(`<div class="container" style="background-color: #f0f0f0; padding: 20px;">
  <header>
    <img src="logo.png" alt="Company Logo" class="logo">
    <nav>
      <a href="/about">About Us</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>
  <main>
    <h1 class="title">Welcome to our site</h1>
    <p>Please enter your email below:</p>
    <label for="emailInput">Email:</label>
    <input type="email" id="emailInput" required>
    <button onclick="submitForm()">Submit</button>
    <br>
    <hr>
    <svg width="24" height="24" stroke-width="2" fill-rule="evenodd">
       <path d="M12 2L2 22h20L12 2z"/>
    </svg>
  </main>
</div>`);
  };

  return (
    <div className="converter-container">
      <div className="converter-header">
        <h2>HTML to React & Next.js Converter</h2>
        <p>Convert your HTML snippets into valid JSX for React or Next.js App Router.</p>
        
        <div className="converter-controls">
          <div className="framework-selector">
            <button 
              className={`selector-btn ${framework === 'react' ? 'active' : ''}`}
              onClick={() => setFramework('react')}
            >
              React
            </button>
            <button 
              className={`selector-btn ${framework === 'nextjs' ? 'active' : ''}`}
              onClick={() => setFramework('nextjs')}
            >
              Next.js
            </button>
          </div>
          <button className="example-btn" onClick={insertExample}>
            <Icons.Wand2 size={16} />
            Load Example
          </button>
        </div>
      </div>

      <div className="converter-workspace">
        <div className="editor-pane input-pane">
          <div className="pane-header">
            <h3>HTML Input</h3>
          </div>
          <textarea
            className="code-editor"
            value={inputHtml}
            onChange={(e) => setInputHtml(e.target.value)}
            placeholder="Paste your HTML code here..."
            spellCheck="false"
          />
        </div>

        <div className="editor-pane output-pane">
          <div className="pane-header">
            <h3>JSX Output</h3>
            <button className="copy-btn" onClick={handleCopy} disabled={!outputCode}>
              {copied ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <textarea
            className="code-editor result-editor"
            value={outputCode}
            readOnly
            spellCheck="false"
            placeholder="Generated JSX will appear here..."
          />
        </div>
      </div>
    </div>
  );
};

export default HtmlToReactConverter;
