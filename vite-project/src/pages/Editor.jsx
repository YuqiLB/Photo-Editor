import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const uploadedImages = location.state?.uploadedImages || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        if (currentIndex < uploadedImages.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else if (currentIndex === uploadedImages.length - 1) {
          setIsFinished(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, uploadedImages.length]);

  if (uploadedImages.length === 0) {
    return (
      <div className="editor-container">
        <div className="no-images">
          <h1>No images uploaded yet.</h1>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="editor-container">
        <div className="all-done">
          <h1>All Done!</h1>
          <p>You've viewed all {uploadedImages.length} images</p>
        </div>
      </div>
    );
  }

  const currentImage = uploadedImages[currentIndex];

  return (
    <div className="editor-container">
      <div className="slideshow-counter">
        {currentIndex + 1} / {uploadedImages.length}
      </div>
      <div className="fullscreen-image">
        <img src={currentImage.url} alt={currentImage.originalName} />
      </div>
      <div className="image-info">
        <p className="image-name">{currentImage.originalName}</p>
        <p className="instruction">Press Enter to continue</p>
      </div>
    </div>
  );
};

export default Editor;
