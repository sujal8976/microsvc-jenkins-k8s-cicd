import React, { useState } from "react";
import { AxiosInstance } from "axios";
import "../styles/ImageUpload.css";

interface ImageUploadProps {
  axiosInstance: AxiosInstance;
  onImageUploaded: () => void;
}

function ImageUpload({ axiosInstance, onImageUploaded }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axiosInstance.post(
        "/api/images/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess(`Image uploaded successfully! Job ID: ${response.data.jobId}`);
      setSelectedFile(null);
      onImageUploaded();

      // Reset form
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Image</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-group">
          <label htmlFor="file-input">Choose Image:</label>
          <input
            type="file"
            id="file-input"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {selectedFile && (
            <p className="file-name">Selected: {selectedFile.name}</p>
          )}
        </div>
        <button type="submit" disabled={uploading || !selectedFile}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

export default ImageUpload;
