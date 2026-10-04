import './Home.css' 
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const fileObjectsRef = useRef([]);
  const previewUrlsRef = useRef(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);
  
  function selectFiles() {
    fileInputRef.current.click();
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    setError(''); 
    let hasNonImageFile = false;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.split('/')[0] !== 'image') {
        hasNonImageFile = true;
        continue;
      }
      const isDuplicate = fileObjectsRef.current.some(
        (existingFile) => existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (!isDuplicate) {
        fileObjectsRef.current.push(file); //store file object to array
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.add(url);
        setImages((prevImages) => [
          ...prevImages,
          {
            name: file.name,
            url,
          },
        ]);
      }
    }
    
    if (hasNonImageFile) { 
      setError('Error: Only image files are allowed. Please upload valid image files (PNG, JPG, GIF, etc.).');
    }
  }

  function onFileSelect(event) {
    handleFiles(event.target.files); //pass files for processing
    event.target.value = ''; // Allow selecting a deleted file again.
  }

  function deleteImage(index) {
    URL.revokeObjectURL(images[index].url);
    previewUrlsRef.current.delete(images[index].url);
    setImages((prevImages) => prevImages.filter((_, i) => i !== index)); 
    fileObjectsRef.current = fileObjectsRef.current.filter((_, i) => i !== index);
  }

  function onDragOver(event) {
    event.preventDefault(); //default is opening file in browser
    event.stopPropagation();// no bubbling
    setIsDragging(true);
    event.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
  }

  function onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  function uploadImages() {
    if (fileObjectsRef.current.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    // Pass files rather than preview URLs so the editor can own its URLs and
    // recreate them after refresh or Back/Forward navigation.
    navigate('/editor', { state: { imageFiles: [...fileObjectsRef.current] } });
  }

  return (
    <>
      <div className="card">

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <div
          className={`dropbox ${isDragging ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {isDragging ? (
            <span className="select">Drop images here</span>
          ) : (
            <>
              Drag and Drop here or ‎
              <span className="selectbrowse" role="button" onClick={selectFiles}>
                Browse
              </span>
            </>
          )}

          <input
            name="file"
            type="file"
            accept="image/*"
            className="file"
            multiple
            ref={fileInputRef}
            onChange={onFileSelect}
          />
        </div>

        <div className={`container ${images.length > 0 ? 'has-images' : ''}`}> {//check for images, dynamically changes
        }
          {images.map((image, index) => (
            <div className="image" key={index}>
              <span className="delete" onClick={() => deleteImage(index)}>
                &times;
              </span>
              <img src={image.url} alt={image.name} />
            </div>
          ))}
        </div>
      </div>

      <button className="upload" type="button" onClick={uploadImages}>
        Upload
      </button>
    </>
  );
};

export default Home;
