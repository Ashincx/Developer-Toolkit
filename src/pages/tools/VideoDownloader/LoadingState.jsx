import { Loader2 } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="loading-state">
      <Loader2 size={40} className="spinner" />
      <p>Resolving video information...</p>
      <div className="skeleton-container">
        <div className="skeleton skeleton-thumbnail"></div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-meta"></div>
        <div className="skeleton skeleton-formats"></div>
      </div>
    </div>
  );
};

export default LoadingState;
