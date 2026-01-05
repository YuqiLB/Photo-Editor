import React from 'react';
import { useLocation } from 'react-router-dom';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const uploadedImages = location.state?.uploadedImages || [];

  return (
    <div className="editor-container">
      <h1>Photo Editor</h1>
      <p>Your images have been uploaded successfully!</p>
      <div className="editor-content">
        {uploadedImages.length > 0 ? (
          <div className="uploaded-images">
            {uploadedImages.map((image, index) => (
              <div key={index} className="uploaded-image">
                <img src={image.url} alt={image.originalName} />
                <p className="image-name">{image.originalName}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No images uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default Editor;
