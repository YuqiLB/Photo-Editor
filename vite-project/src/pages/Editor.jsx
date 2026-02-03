import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import './Editor.css';

const Editor = () => {
  const location = useLocation();
  const uploadedImages = location.state?.uploadedImages || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 150 });//crop box state stores position as percentages to save over to next img
  const [savedCropPosition, setSavedCropPosition] = useState(null); //keep position for next image
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 });
  
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchMode, setBatchMode] = useState(''); //'crop', 'filter', or 'both'
  
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  const colorFilters = [
    { id: 'none', name: 'Original', filter: 'none' },
    { id: 'grayscale', name: 'B&W', filter: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', filter: 'sepia(100%)' },
    { id: 'vintage', name: 'Vintage', filter: 'sepia(50%) contrast(90%) brightness(90%)' },
    { id: 'vivid', name: 'Vivid', filter: 'saturate(150%) contrast(110%)' },
    { id: 'muted', name: 'Muted', filter: 'saturate(60%) brightness(105%)' },
  ];
  
  const [croppedImages, setCroppedImages] = useState([]);//storage for cropped images
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cropBoxRef = useRef(cropBox);
  
  
  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);//sync cropBoxRef

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
      if (savedCropPosition) {
        
        setCropBox(constrainCropBox({
          x: savedCropPosition.x,
          y: savedCropPosition.y,
          width: savedCropPosition.width,
          height: savedCropPosition.height
        }, newBounds));//constrain to boundaries of image
      } else {
        
        setCropBox({
          x: Math.max(0, (newBounds.width - 200) / 2),
          y: Math.max(0, (newBounds.height - 150) / 2),
          width: Math.min(200, newBounds.width),
          height: Math.min(150, newBounds.height)
        });//recentering crop box
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newBounds = updateImageBounds();
      if (newBounds) { //constrain to new box for screen resize
        
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

  
  const constrainCropBox = useCallback((box, bounds) => {//constrain to bounds
    const newBox = { ...box };
    newBox.width = Math.max(50, Math.min(newBox.width, bounds.width));
    newBox.height = Math.max(50, Math.min(newBox.height, bounds.height));
    newBox.x = Math.max(0, Math.min(newBox.x, bounds.width - newBox.width));
    newBox.y = Math.max(0, Math.min(newBox.y, bounds.height - newBox.height));
    return newBox;
  }, []);

  
  const getFilterValue = useCallback((filterId) => {
    const filter = colorFilters.find(f => f.id === filterId);
    return filter ? filter.filter : 'none';
  }, []);

  const cropImage = useCallback((applyFilter = true) => {
    if (!imageRef.current) return null;
    
    const img = imageRef.current;
    const displayedWidth = img.getBoundingClientRect().width;
    const displayedHeight = img.getBoundingClientRect().height;
    
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
      
      if (applyFilter && selectedFilter !== 'none') {
        ctx.filter = getFilterValue(selectedFilter);
      }
      
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Error cropping image:', e);//error returning
      return null;
    }
  }, [cropBox, selectedFilter, getFilterValue]);

 
  const handleCropAndNext = useCallback(() => {
   
    const croppedDataUrl = cropImage();
    if (croppedDataUrl) {
      setCroppedImages(prev => [...prev, {
        url: croppedDataUrl,
        originalName: uploadedImages[currentIndex]?.originalName || `Image ${currentIndex + 1}`
      }]);
    }
    
    
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

  const handleBatchProcess = useCallback(async (mode = 'both') => {
    const remainingCount = uploadedImages.length - currentIndex;
    if (remainingCount <= 0) return;
    
    setIsBatchProcessing(true);
    setBatchMode(mode);
    setBatchProgress({ current: 0, total: remainingCount });
    
    const newCroppedImages = [];
    const applyCrop = mode === 'crop' || mode === 'both';
    const applyFilter = (mode === 'filter' || mode === 'both') && selectedFilter !== 'none';
    
    for (let i = currentIndex; i < uploadedImages.length; i++) {
      const image = uploadedImages[i];
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const maxWidth = window.innerWidth * 0.9;
          const maxHeight = window.innerHeight * 0.8;
          
          let displayedWidth = img.naturalWidth;
          let displayedHeight = img.naturalHeight;
          
          if (displayedWidth > maxWidth) {
            const ratio = maxWidth / displayedWidth;
            displayedWidth = maxWidth;
            displayedHeight *= ratio;
          }
          if (displayedHeight > maxHeight) {
            const ratio = maxHeight / displayedHeight;
            displayedHeight = maxHeight;
            displayedWidth *= ratio;
          }
          
          const scaleX = img.naturalWidth / displayedWidth;
          const scaleY = img.naturalHeight / displayedHeight;
          
          let finalCropX, finalCropY, finalCropWidth, finalCropHeight;
          
          if (applyCrop) {
            const cropX = cropBox.x * scaleX;
            const cropY = cropBox.y * scaleY;
            const cropWidth = cropBox.width * scaleX;
            const cropHeight = cropBox.height * scaleY;
            
            finalCropX = Math.max(0, Math.min(cropX, img.naturalWidth - cropWidth));
            finalCropY = Math.max(0, Math.min(cropY, img.naturalHeight - cropHeight));
            finalCropWidth = Math.min(cropWidth, img.naturalWidth - finalCropX);
            finalCropHeight = Math.min(cropHeight, img.naturalHeight - finalCropY);
          } else {
            finalCropX = 0;
            finalCropY = 0;
            finalCropWidth = img.naturalWidth;
            finalCropHeight = img.naturalHeight;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = finalCropWidth;
          canvas.height = finalCropHeight;
          const ctx = canvas.getContext('2d');
          
          try {
            if (applyFilter) {
              ctx.filter = getFilterValue(selectedFilter);
            }
            
            ctx.drawImage(
              img,
              finalCropX, finalCropY, finalCropWidth, finalCropHeight,
              0, 0, finalCropWidth, finalCropHeight
            );
            
            const croppedDataUrl = canvas.toDataURL('image/png');
            newCroppedImages.push({
              url: croppedDataUrl,
              originalName: image.originalName || `Image ${i + 1}`
            });
          } catch (e) {
            console.error('Error processing image:', e);
          }
          
          resolve();
        };
        img.onerror = reject;
        img.src = image.url;
      });
      
      setBatchProgress({ current: i - currentIndex + 1, total: remainingCount });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    setCroppedImages(prev => [...prev, ...newCroppedImages]);
    setIsBatchProcessing(false);
    setIsFinished(true);
  }, [cropBox, currentIndex, uploadedImages, selectedFilter, getFilterValue]);

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
  const handleDownloadAll = () => {
    croppedImages.forEach((image, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `cropped_${image.originalName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 200); 
    });
  };

  if (isFinished) {
    return (
      <div className="editor-container finished-view">
        <div className="all-done">
          <h1>All Done!</h1>
          <p>You've cropped {croppedImages.length} images</p>
          <button className="download-all-btn" onClick={handleDownloadAll}>
            Download All ({croppedImages.length})
          </button>
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

      <div className="filter-sidebar">
        <h3 className="filter-title">Filters</h3>
        <div className="filter-grid">
          {colorFilters.map((filter) => (
            <button
              key={filter.id}
              className={`filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.id)}
              title={filter.name}
            >
              <div className="filter-preview">
                <img 
                  src={currentImage.url} 
                  alt={filter.name}
                  style={{ filter: filter.filter }}
                  draggable={false}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
      {uploadedImages.length - currentIndex > 1 && (
        <div className="batch-sidebar">
          <h3 className="batch-title">Batch Apply</h3>
          <p className="batch-count">{uploadedImages.length - currentIndex} images</p>
          <div className="batch-buttons">
            <button 
              className="batch-btn crop-only"
              onClick={() => handleBatchProcess('crop')}
              disabled={isBatchProcessing}
            >
              Crop Only
            </button>
            <button 
              className="batch-btn filter-only"
              onClick={() => handleBatchProcess('filter')}
              disabled={isBatchProcessing || selectedFilter === 'none'}
            >
              Filter Only
            </button>
            <button 
              className="batch-btn both"
              onClick={() => handleBatchProcess('both')}
              disabled={isBatchProcessing}
            >
              Crop + Filter
            </button>
          </div>
        </div>
      )}
      
      <div className="fullscreen-image">
        <div className="image-wrapper">
          <img 
            ref={imageRef}
            src={currentImage.url} 
            alt={currentImage.originalName}
            onLoad={handleImageLoad}
            draggable={false}
            crossOrigin="anonymous"
            style={{ filter: getFilterValue(selectedFilter) }}
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
        <p className="instruction">Drag to move crop box - Drag corners to resize</p>
        
        <div className="navigation-controls">
          <button 
            className="nav-btn prev-btn"
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
          >
            ← Previous
          </button>
          
          <button 
            className="nav-btn next-btn"
            onClick={handleCropAndNext}
          >
            {currentIndex === uploadedImages.length - 1 ? 'Finish →' : 'Next →'}
          </button>
        </div>
      </div>
      
      {isBatchProcessing && (
        <div className="batch-overlay">
          <div className="batch-modal">
            <h2>Batch Processing...</h2>
            <p className="batch-mode-label">
              {batchMode === 'crop' && '...Applying Crop'}
              {batchMode === 'filter' && '...Applying Filter'}
              {batchMode === 'both' && '...Applying Crop + Filter'}
            </p>
            <div className="batch-progress-bar">
              <div 
                className="batch-progress-fill" 
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
            <p className="batch-progress-text">
              Processing {batchProgress.current} of {batchProgress.total} images
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
