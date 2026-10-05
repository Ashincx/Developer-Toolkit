import { Link2, ArrowRight } from 'lucide-react';

const VideoUrlInput = ({ url, setUrl, onSubmit, isLoading }) => {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  return (
    <div className="url-input-container">
      <div className="input-wrapper">
        <Link2 className="input-icon" size={20} />
        <input
          type="url"
          className="input url-input"
          placeholder="Paste video URL here (e.g., https://example.com/video)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <button 
          className="btn btn-outline paste-btn" 
          onClick={handlePaste}
          disabled={isLoading}
          type="button"
        >
          Paste
        </button>
      </div>
      <button 
        className="btn btn-primary submit-btn" 
        onClick={onSubmit}
        disabled={isLoading || !url}
      >
        Get Video <ArrowRight size={18} />
      </button>
    </div>
  );
};

export default VideoUrlInput;
