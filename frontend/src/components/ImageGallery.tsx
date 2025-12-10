import React, { useState, useEffect } from "react";
import { AxiosInstance } from "axios";
import "../styles/ImageGallery.css";

interface Image {
  id: string;
  originalName: string;
  status: string;
  uploadedAt: string;
  processedAt?: string;
  sizes?: any;
  errorMessage?: string;
}

interface ImageGalleryProps {
  axiosInstance: AxiosInstance;
}

function ImageGallery({ axiosInstance }: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [selectedResolution, setSelectedResolution] = useState("medium");

  const fetchImages = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/images");
      // Normalize images to an array to avoid runtime errors when API
      // returns undefined/null or a non-array value.
      const imgs = response.data?.images ?? [];
      setImages(Array.isArray(imgs) ? imgs : []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    const interval = setInterval(fetchImages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchImageDetails = async (imageId: string) => {
    try {
      const response = await axiosInstance.get(`/api/images/${imageId}`);
      setSelectedImage(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch image details");
    }
  };

  const handleImageClick = (image: Image) => {
    fetchImageDetails(image.id);
  };

  const handleCloseDetail = () => {
    setSelectedImage(null);
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "#FFA500",
      processing: "#4169E1",
      complete: "#228B22",
      failed: "#DC143C",
    };
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: colors[status] }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="gallery-container">
      <h2>Image Gallery</h2>
      {error && <div className="error-message">{error}</div>}

      {loading && images.length === 0 ? (
        <p>Loading images...</p>
      ) : images.length === 0 ? (
        <p className="no-images">No images uploaded yet</p>
      ) : (
        <div className="gallery-grid">
          {images.map((image) => (
            <div
              key={image.id}
              className="gallery-item"
              onClick={() => handleImageClick(image)}
            >
              <div className="image-placeholder">
                <p>{image.originalName}</p>
              </div>
              <div className="image-info">
                <p className="image-name">{image.originalName}</p>
                {getStatusBadge(image.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseDetail}>
              ×
            </button>
            <h3>{selectedImage.originalName}</h3>
            <p>Status: {getStatusBadge(selectedImage.status)}</p>

            {selectedImage.status === "complete" && selectedImage.sizes && (
              <div className="resolution-selector">
                <label htmlFor="resolution">Select Resolution:</label>
                <select
                  id="resolution"
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                >
                  <option value="thumbnail">Thumbnail (150x150)</option>
                  <option value="small">Small (480x480)</option>
                  <option value="medium">Medium (1024x1024)</option>
                  <option value="large">Large (1920x1920)</option>
                  <option value="original">Original</option>
                </select>

                <div className="image-display">
                  {selectedImage.sizes[selectedResolution] && (
                    <>
                      <img
                        src={selectedImage.sizes[selectedResolution].url}
                        alt={selectedImage.originalName}
                      />
                      <div className="image-details">
                        <p>
                          Width: {selectedImage.sizes[selectedResolution].width}
                          px
                        </p>
                        <p>
                          Height:{" "}
                          {selectedImage.sizes[selectedResolution].height}px
                        </p>
                        <p>
                          Size: {selectedImage.sizes[selectedResolution].size}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="all-resolutions">
                  <h4>All Resolutions:</h4>
                  <ul>
                    {Object.entries(selectedImage.sizes).map(
                      ([key, value]: [string, any]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value.width}x{value.height} -{" "}
                          {value.size}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            )}

            {selectedImage.status === "failed" && (
              <div className="error-section">
                <p className="error">
                  Error: {selectedImage.errorMessage || "Unknown error"}
                </p>
              </div>
            )}

            {selectedImage.status === "pending" && (
              <p className="info">Your image is queued for processing...</p>
            )}

            {selectedImage.status === "processing" && (
              <p className="info">Your image is being processed...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
