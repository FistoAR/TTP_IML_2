import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function FileUploadBox({ file, onFileChange, productId, small }) {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileType, setFileType] = useState(null);

    const handleFileChange = (selectedFile) => {
      if (selectedFile) {
        onFileChange(selectedFile);

        const type = selectedFile.type;
        setFileType(type);

        if (type?.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviewUrl(reader.result);
          };
          reader.readAsDataURL(selectedFile);
        } else if (type === "application/pdf") {
          setPreviewUrl(null);
        } else {
          setPreviewUrl(null);
        }
      }
    };

    const handleInputChange = (e) => {
      const selectedFile = e.target.files[0];
      handleFileChange(selectedFile);
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
        ];
        if (allowedTypes.includes(droppedFile.type)) {
          handleFileChange(droppedFile);
        } else {
          alert(
            "Please upload only images (JPEG, PNG, GIF, WebP) or PDF files",
          );
        }
      }
    };

    const removeFile = (e) => {
      e.stopPropagation();
      onFileChange(null);
      setPreviewUrl(null);
      setFileType(null);
    };

    return (
      <div
        className={`border-2 ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-dashed border-gray-300"
        } rounded-[0.6vw] p-[2vw] bg-white ${
          small ? "min-h-[10vw]" : "min-h-[15vw]"
        } transition-all duration-200`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                onFileChange(file); // Just pass the file to parent
              }
            }}
            className="hidden"
            id={`file-upload-${productId}`}
          />

          {!file ? (
            <label
              htmlFor={`file-upload-${productId}`}
              className="cursor-pointer flex flex-col items-center w-full"
            >
              <div
                className={`w-[3.5vw] h-[3.5vw] ${
                  isDragging ? "bg-blue-200" : "bg-gray-200"
                } rounded-full flex items-center justify-center mb-[0.8vw] transition-all`}
              >
                <svg
                  className={`w-[2vw] h-[2vw] ${
                    isDragging ? "text-blue-600" : "text-gray-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p
                className={`text-[0.85vw] ${
                  isDragging ? "text-blue-600 font-medium" : "text-gray-500"
                } my-[0.2vw]`}
              >
                {isDragging ? "Drop file here" : "Upload Design File"}
              </p>
              <p className="text-[0.75vw] text-gray-400 my-[0.2vw]">
                Click to browse or drag & drop
              </p>
              <p className="text-[0.7vw] text-gray-400 mt-[0.5vw]">
                Supports: JPG, PNG, GIF, WebP, PDF
              </p>
            </label>
          ) : (
            <div className="w-full">
              {fileType && fileType?.startsWith("image/") && previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[12vw] object-contain rounded-[0.4vw] border border-gray-200"
                  />
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                    title="Remove file"
                  >
                    ×
                  </button>
                  <div className="mt-2 text-center">
                    <p className="text-[0.8vw] text-gray-700 font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-[0.7vw] text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ) : fileType === "application/pdf" ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-[8vw] h-[10vw] bg-red-50 rounded-[0.4vw] border-2 border-red-200 flex flex-col items-center justify-center">
                      <svg
                        className="w-[4vw] h-[4vw] text-red-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path
                          d="M14 2v6h6M10 13h4m-4 4h4"
                          stroke="white"
                          strokeWidth="1"
                        />
                      </svg>
                      <span className="text-[0.85vw] font-bold text-red-600 mt-1">
                        PDF
                      </span>
                    </div>
                    <button
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 text-center max-w-full">
                    <p className="text-[0.8vw] text-gray-700 font-medium truncate px-2">
                      {file.name}
                    </p>
                    <p className="text-[0.7vw] text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-[6.5vw] h-[8vw] bg-gray-100 rounded-[0.4vw] border-2 border-gray-300 flex flex-col items-center justify-center">
                      <svg
                        className="w-[4vw] h-[4vw] text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                      </svg>
                    </div>
                    <button
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all shadow-md"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-[0.8vw] text-gray-700 font-medium truncate">
                      {file.name}
                    </p>
                    <p className="text-[0.7vw] text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              <label
                htmlFor={`file-upload-${productId}`}
                className="mt-3 block w-full"
              >
                <div className="cursor-pointer text-center px-3 py-2 border border-blue-500 text-blue-600 rounded-[0.4vw] text-[0.8vw] font-medium hover:bg-blue-50 transition-all">
                  Change File
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  export default FileUploadBox;