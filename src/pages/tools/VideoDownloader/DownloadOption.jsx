import { Download, FileVideo, HardDrive } from 'lucide-react';

const DownloadOption = ({ format }) => {
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="download-option">
      <div className="format-info">
        <div className="format-quality">
          <FileVideo size={20} className="format-icon" />
          <span className="quality-text">{format.quality}</span>
          <span className="format-badge">{format.format.toUpperCase()}</span>
        </div>
        <div className="format-size">
          <HardDrive size={14} />
          <span>{formatSize(format.size)}</span>
        </div>
      </div>
      <a 
        href={format.downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary download-btn"
        download
      >
        <Download size={16} />
        Download
      </a>
    </div>
  );
};

export default DownloadOption;
