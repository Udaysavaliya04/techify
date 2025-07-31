import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';
import config from './config';
import './App.css';

const languages = [
  { label: 'Python', value: 'python3' },
  { label: 'JavaScript', value: 'nodejs' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp17' },
  { label: 'Java', value: 'java' }
];

function App() {
  const [code, setCode] = useState('// Welcome to Techify\n// Start typing your code here...\n\nfunction hello() {\n  console.log("Hello, World!");\n}\n\nhello();');
  const [language, setLanguage] = useState('nodejs');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await axios.post(
        `${config.API_BASE_URL}/api/code/execute`,
        { code, language }
      );
      setOutput(res.data.output || res.data.error || 'Code executed successfully.');
    } catch (err) {
      setOutput('Error: Could not execute code. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const saveSnippet = async () => {
    try {
      await axios.post(
        `${config.API_BASE_URL}/api/code/save`,
        { code, language, output }
      );
      alert('✅ Code snippet saved successfully!');
    } catch {
      alert('❌ Failed to save code snippet. Please try again.');
    }
  };

  return (
    <div className="app-root">
      <div className="editor-header">
        <h2>Code Editor</h2>
        <div className="dropdown-wrapper">
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="language-select"
          >
            {languages.map(l => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <div className="dropdown-icon">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="editor-container">
        <MonacoEditor
          height="60vh"
          theme="vs-dark"
          language={
            language === 'python3'
              ? 'python'
              : language === 'nodejs'
              ? 'javascript'
              : language === 'cpp17'
              ? 'cpp'
              : language
          }
          value={code}
          onChange={v => setCode(v || '')}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            contextmenu: true,
            lineNumbers: 'on',
            folding: true,
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnType: true,
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            tabCompletion: 'on',
            quickSuggestions: true,
            codeLens: true,
            lightbulb: { enabled: true },
            links: true,
            mouseWheelZoom: true,
            renderWhitespace: 'selection',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            inlineSuggest: { enabled: true },
            fontSize: 14,
            fontFamily: "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
            padding: { top: 16, bottom: 16 },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
      
      <div className="button-row">
        <button
          onClick={runCode}
          disabled={loading}
          className={`action-btn run-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Running' : 'Run Code'}
        </button>
        <button
          onClick={saveSnippet}
          className="action-btn save-btn"
        >
          Save Snippet
        </button>
      </div>
      
      <div className="output-container">
        <span className="output-label">Output</span>
        <pre className="output-area">{output || 'No output yet. Run your code to see results here.'}</pre>
      </div>
    </div>
  );
}

export default App;