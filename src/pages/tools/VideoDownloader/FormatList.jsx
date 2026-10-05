import DownloadOption from './DownloadOption';

const FormatList = ({ formats }) => {
  if (!formats || formats.length === 0) {
    return <div className="no-formats">No download formats available for this video.</div>;
  }

  return (
    <div className="format-list">
      <h4 className="format-list-title">Available Formats</h4>
      <div className="formats-grid">
        {formats.map((format) => (
          <DownloadOption key={format.id} format={format} />
        ))}
      </div>
    </div>
  );
};

export default FormatList;
