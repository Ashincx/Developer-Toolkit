import { AlertCircle, RotateCcw } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className="error-state">
      <AlertCircle size={48} className="error-icon" />
      <h3 className="error-title">Unable to resolve video</h3>
      <p className="error-message">{error}</p>
      <div className="error-details">
        Possible reasons:
        <ul>
          <li>The URL is invalid or malformed</li>
          <li>The source is not supported by our platform</li>
          <li>The video is private, DRM protected, or geo-restricted</li>
        </ul>
      </div>
      <button className="btn btn-outline retry-btn" onClick={onRetry}>
        <RotateCcw size={16} /> Try Another URL
      </button>
    </div>
  );
};

export default ErrorState;
