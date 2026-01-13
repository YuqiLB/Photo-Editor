import './Home.css' 
import React, { useState, useRef } from 'react'; //hook for component state and for references
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsuploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const fileObjectsRef = useRef([]);
  const navigate = useNavigate();

  
  function selectFiles() {
    fileInputRef.current.click();
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    setError(''); // Clear previous errors
    let hasNonImageFile = false;
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.split('/')[0] !== 'image') {
        hasNonImageFile = true;
        continue;
      }
      // Check if file already exists by comparing with stored file objects
      const isDuplicate = fileObjectsRef.current.some(
        (existingFile) => existingFile.name === files[i].name && existingFile.size === files[i].size
      );
      
      if (!isDuplicate) {
        fileObjectsRef.current.push(files[i]); //store file object to array
        setImages((prevImages) => [
          ...prevImages,
          {
            name: files[i].name,
            url: URL.createObjectURL(files[i]), //temporary image preview
          },
        ]);
      }
    }
    
    if (hasNonImageFile) { //wrong file type error handling
      setError('Error: Only image files are allowed. Please upload valid image files (PNG, JPG, GIF, etc.).');
    }
  }

  function onFileSelect(event) {
    handleFiles(event.target.files); //pass files for processing
  }

  function deleteImage(index) {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index)); 
    fileObjectsRef.current = fileObjectsRef.current.filter((_, i) => i !== index);
  }//keeps items except for the one at specified index

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

  async function uploadImages() {
    if (fileObjectsRef.current.length === 0) {
      alert('Please select at least one image');
      return;
    }
    setIsuploading(true);

    try{
      const formData = new FormData();
      fileObjectsRef.current.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const data = await response.json();
      console.log('Upload successful:', data);
      // navigate to editor page with uploaded image data
      navigate('/editor', { state: { uploadedImages: data.files } });
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images');
    } finally {
      setIsuploading(false);
    }
  }

  return (
    <>
      <div className="card">

        {error && (
          <div className="error-message">
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
            className="file"
            multiple
            ref={fileInputRef}
            onChange={onFileSelect}
          />
        </div>

        <div className={`container ${images.length > 0 ? 'has-images' : ''}`}> {//check for images so it dynamically changes
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

      <button className="upload" type="button" onClick={uploadImages} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </>
  );
};

export default Home;
