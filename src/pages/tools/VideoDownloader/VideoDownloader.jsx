import { useState } from 'react';
import ToolLayout from '../../../components/ToolLayout';
import VideoUrlInput from './VideoUrlInput';
import VideoPreview from './VideoPreview';
import FormatList from './FormatList';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { fetchVideoInfo } from '../../../services/videoDownloader';
import './VideoDownloader.css';

const VideoDownloader = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);

  const validateUrl = (urlStr) => {
    try {
      const parsedUrl = new URL(urlStr);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleReset = () => {
    setUrl('');
    setError(null);
    setVideoInfo(null);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!url) return;
    
    if (!validateUrl(url)) {
      setError('Please enter a valid HTTP or HTTPS URL.');
      setVideoInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const info = await fetchVideoInfo(url);
      setVideoInfo({ ...info, originalUrl: url });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while fetching video info.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout
      id="video-downloader"
      title="Video Downloader"
      description="Download videos from supported public sources. DRM and paywalled content are not supported."
      onReset={videoInfo || error ? handleReset : null}
    >
      <div className="video-downloader-container">
        <VideoUrlInput 
          url={url} 
          setUrl={setUrl} 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
        />
        
        <div className="downloader-result-area">
          {isLoading && <LoadingState />}
          
          {error && !isLoading && (
            <ErrorState error={error} onRetry={handleReset} />
          )}
          
          {videoInfo && !isLoading && !error && (
            <div className="result-container fade-in">
              <VideoPreview videoInfo={videoInfo} />
              <FormatList formats={videoInfo.formats} />
            </div>
          )}
          
          {!isLoading && !error && !videoInfo && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-secondary opacity-50">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <p>Paste a video URL above to see available download options.</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default VideoDownloader;
