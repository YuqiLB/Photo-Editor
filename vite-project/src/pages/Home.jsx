import './Home.css'
import React, {useState, useRef } from 'react';


const Home = () => {
  const [images, setImages ] = useState([]);
  const [isDragging, stillDragging] = useState(false);
  const fileInputRef = useRef(null);

  function selectFiles(){
    fileInputRef.current.click();
  }
  function onFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    for (let i = 0; i < files.length; i++){
      if (files[i].type.split('/')[0] !== 'image') continue;
      if (!images.some((e)=> e.name === file[i].name)){
        setImages((prevImages)=> [
          ...prevImages,
          {
            name: files[i].name,
            url: URL.createObjectURL(files[i]),
          },
        ])
      }
    }
  }
  function deleteImage(index){
    setImages((prevImages) => 
      prevImages.filter((_, i ) => i != index)
    );
  }

  function onDragOver(event){
    event.preventDefault();
    setIsDragging(true);
    event.data
  }
  return (
    <div className='card'>
      <div className="top">
        <p>
          Drag & Drop Image Upload
        </p>
      </div>
      <div className='dropbox' onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        { isDragging ? (
          <span className="select">
            Drop images here
          </span>
          ) : (
            <>
              Drag and Drop here or {" "}
              <span className="select" role="button" onClick={selectFiles}>
                Browse
              </span>
            </>
          )
        }
        
          
        <input name = 'file' type="file" className='file' multiple ref={fileInputRef} onChange={onFileSelect}/>
      </div>
        
      <div className= "container">
        {
          images.map((image, index) =>(
            <div className="image" key={index}>
              <span className="delete" onClick={()=> deleteImage(index)}>
                &times; 
              </span>
              <img src={images.url} alt={images.name} />
            </div>
          ))
        }        
      </div>
      <button type='button' >
        Upload  
      </button>
    </div>
  )
}

export default Home