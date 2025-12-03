import { useState, useEffect } from "react";
import PhotoAlbum from "react-photo-album";
import "react-photo-album/rows.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Dynamically import all images from the gallery folder
const glob = import.meta.glob("./gallery/**/*.{jpg,jpeg,png}", { eager: true });

// Convert glob result to an array of URLs
const imageUrls = Object.values(glob).map((module) => module.default);

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    const loadImages = async () => {
      const loadedPhotos = await Promise.all(
        imageUrls.map((src) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              resolve({
                src,
                width: img.width,
                height: img.height,
              });
            };
            img.onerror = () => {
                // If an image fails to load, we resolve with null so we can filter it out later
                resolve(null);
            }
          });
        })
      );
      
      // Filter out any failed images
      setPhotos(loadedPhotos.filter(p => p !== null));
    };

    loadImages();
  }, []);

  if (photos.length === 0) {
    return <div style={{ padding: "20px", textAlign: "center", color: "white" }}>Loading gallery...</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1600px", margin: "0 auto" }}>
      <PhotoAlbum 
        layout="rows" 
        photos={photos} 
        onClick={({ index }) => setIndex(index)}
        targetRowHeight={300}
      />

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={photos}
      />
    </div>
  );
}
