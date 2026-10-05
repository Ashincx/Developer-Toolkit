import { Clock, Globe, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';

const VideoPreview = ({ videoInfo }) => {
  const [copied, setCopied] = useState(false);

  if (!videoInfo) return null;

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(videoInfo.originalUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="video-preview-card">
      <div className="video-thumbnail-container">
        {videoInfo.thumbnail ? (
          <img src={videoInfo.thumbnail} alt={videoInfo.title} className="video-thumbnail" />
        ) : (
          <div className="video-thumbnail-placeholder">
            <span className="placeholder-text">No Thumbnail Available</span>
          </div>
        )}
      </div>
      <div className="video-details">
        <h3 className="video-title" title={videoInfo.title}>{videoInfo.title}</h3>
        
        <div className="video-meta">
          <div className="meta-item">
            <Clock size={16} />
            <span>{formatDuration(videoInfo.duration)}</span>
          </div>
          <div className="meta-item">
            <Globe size={16} />
            <span>{videoInfo.source}</span>
          </div>
        </div>
        
        <button className="btn btn-outline copy-url-btn" onClick={handleCopyUrl}>
          {copied ? <CheckCheck size={16} className="text-success" /> : <Copy size={16} />}
          {copied ? 'Copied URL' : 'Copy Source URL'}
        </button>
      </div>
    </div>
  );
};

export default VideoPreview;
