import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const uploadedImages = location.state?.uploadedImages || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  //crop box state stores position as percentages to save over to next img
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 150 });
  const [savedCropPosition, setSavedCropPosition] = useState(null); // keep position for next image
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 });
  
  //storage for cropped images
  const [croppedImages, setCroppedImages] = useState([]);
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropBoxRef = useRef(cropBox);
  
  
  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);//sync cropBoxRef

  //update boundaries for image
  const updateImageBounds = useCallback(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      const imgRect = img.getBoundingClientRect();
      
      const newBounds = {
        width: imgRect.width,
        height: imgRect.height
      };
      
      setImageBounds(newBounds);
      return newBounds;
    }
    return null;
  }, []);

  const handleImageLoad = () => {
    const newBounds = updateImageBounds();
    if (newBounds) {
      // center cropbox unless there's a saved position already
      if (savedCropPosition) {
        
        setCropBox(constrainCropBox({
          x: savedCropPosition.x,
          y: savedCropPosition.y,
          width: savedCropPosition.width,
          height: savedCropPosition.height
        }, newBounds));// constrain to boundaries of image
      } else {
        //recentering crop box
        setCropBox({
          x: Math.max(0, (newBounds.width - 200) / 2),
          y: Math.max(0, (newBounds.height - 150) / 2),
          width: Math.min(200, newBounds.width),
          height: Math.min(150, newBounds.height)
        });
      }
    }
  };

// fullscreen resize handling
  useEffect(() => {
    const handleResize = () => {
      const newBounds = updateImageBounds();
      if (newBounds) {
        //constrain to new box
        setCropBox(prev => {
          const newBox = { ...prev };
          newBox.width = Math.max(50, Math.min(newBox.width, newBounds.width));
          newBox.height = Math.max(50, Math.min(newBox.height, newBounds.height));
          newBox.x = Math.max(0, Math.min(newBox.x, newBounds.width - newBox.width));
          newBox.y = Math.max(0, Math.min(newBox.y, newBounds.height - newBox.height));
          return newBox;
        });
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleResize);
    };
  }, [updateImageBounds]);

  //constrain to bounds
  const constrainCropBox = useCallback((box, bounds) => {
    const newBox = { ...box };
    newBox.width = Math.max(50, Math.min(newBox.width, bounds.width));
    newBox.height = Math.max(50, Math.min(newBox.height, bounds.height));
    newBox.x = Math.max(0, Math.min(newBox.x, bounds.width - newBox.width));
    newBox.y = Math.max(0, Math.min(newBox.y, bounds.height - newBox.height));
    return newBox;
  }, []);

  
  const cropImage = useCallback(() => {
    if (!imageRef.current) return null;
    
    const img = imageRef.current;
    const displayedWidth = img.getBoundingClientRect().width;
    const displayedHeight = img.getBoundingClientRect().height;
    
    //scale b/w natural and display
    const scaleX = img.naturalWidth / displayedWidth;
    const scaleY = img.naturalHeight / displayedHeight;
    
    
    const cropX = cropBox.x * scaleX;
    const cropY = cropBox.y * scaleY;
    const cropWidth = cropBox.width * scaleX;//crop coords
    const cropHeight = cropBox.height * scaleY;//crop coords
    
    
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d'); //drawing image onto canvas
    
    try {
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Error cropping image:', e); //error returning
      return null;
    }
  }, [cropBox]);

 
  const handleCropAndNext = useCallback(() => {
   
    const croppedDataUrl = cropImage();
    if (croppedDataUrl) {
      setCroppedImages(prev => [...prev, {
        url: croppedDataUrl,
        originalName: uploadedImages[currentIndex]?.originalName || `Image ${currentIndex + 1}`
      }]);
    }
    
    //save crop box position for next image
    setSavedCropPosition({
      x: cropBox.x,
      y: cropBox.y,
      width: cropBox.width,
      height: cropBox.height
    });
    
    if (currentIndex < uploadedImages.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (currentIndex === uploadedImages.length - 1) {
      setIsFinished(true);
    }
  }, [cropImage, cropBox, currentIndex, uploadedImages]);

  const handleMouseDown = (e, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }
  };

  // keybaord shortcut for enter
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleCropAndNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleCropAndNext]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      //get the bounds function
      const currentBounds = imageRef.current ? {
        width: imageRef.current.getBoundingClientRect().width,
        height: imageRef.current.getBoundingClientRect().height
      } : imageBounds;

      if (isDragging) {
        setCropBox(prev => constrainCropBox({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }, currentBounds));
      } else if (isResizing) {
        setCropBox(prev => {
          let newBox = { ...prev };
          
          switch (resizeHandle) {
            case 'se':
              newBox.width = prev.width + deltaX;
              newBox.height = prev.height + deltaY;
              break;
            case 'sw':
              newBox.x = prev.x + deltaX;
              newBox.width = prev.width - deltaX;
              newBox.height = prev.height + deltaY;
              break;
            case 'ne':
              newBox.y = prev.y + deltaY;
              newBox.width = prev.width + deltaX;
              newBox.height = prev.height - deltaY;
              break;
            case 'nw':
              newBox.x = prev.x + deltaX;
              newBox.y = prev.y + deltaY;
              newBox.width = prev.width - deltaX;
              newBox.height = prev.height - deltaY;
              break;
            default:
              break;
          }
          
          return constrainCropBox(newBox, currentBounds);
        });
      }
      
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeHandle, imageBounds, constrainCropBox]);

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
      <div className="editor-container finished-view">
        <div className="all-done">
          <h1>All Done!</h1>
          <p>You've cropped {croppedImages.length} images</p>
        </div>
        <div className="cropped-images-gallery">
          {croppedImages.map((image, index) => (
            <div key={index} className="cropped-image-card">
              <img src={image.url} alt={image.originalName} />
              <p className="cropped-image-name">{image.originalName}</p>
              <a 
                href={image.url} 
                download={`cropped_${image.originalName}`}
                className="download-btn"
              >
                Download
              </a>
            </div>
          ))}
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
        <div className="image-wrapper">
          <img 
            ref={imageRef}
            src={currentImage.url} 
            alt={currentImage.originalName}
            onLoad={handleImageLoad}
            draggable={false}
            crossOrigin="anonymous"
          />
          {imageBounds.width > 0 && (
            <div 
              className={`crop-box ${isDragging ? 'dragging' : ''}`}
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height
              }}
              onMouseDown={(e) => handleMouseDown(e)}
            >
              <div className="crop-handle nw" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
              <div className="crop-handle ne" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
              <div className="crop-handle sw" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
              <div className="crop-handle se" onMouseDown={(e) => handleMouseDown(e, 'se')} />
              <div className="crop-grid">
                <div className="grid-line horizontal" />
                <div className="grid-line horizontal" />
                <div className="grid-line vertical" />
                <div className="grid-line vertical" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="image-info">
        <p className="image-name">{currentImage.originalName}</p>
        <p className="instruction">Drag to move crop box • Drag corners to resize • Press Enter to continue</p>
      </div>
    </div>
  );
};

export default Editor;
