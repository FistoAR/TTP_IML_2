// Utility UI components extracted from OrdersManagement.jsx

export function Select({
  label,
  required,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}) {
  return (
    <div>
      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full text-[.9vw] px-[0.75vw] py-[0.45vw] pr-[2.5vw] border border-gray-300 rounded-[0.5vw] text-[0.85vw] outline-none bg-white box-border appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${disabled ? "bg-white cursor-not-allowed" : "cursor-pointer"
            }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={typeof option === "object" ? option.value : option}
              value={typeof option === "object" ? option.value : option}
            >
              {typeof option === "object" ? option.label : option}
            </option>
          ))}
        </select>
        <div className="absolute right-[1vw] top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-[1vw] h-[1vw] text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Input({
  label,
  required,
  placeholder,
  value,
  onChange,
  disabled,
  onBlur,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        {...(type === "number" ? { min: "0" } : {})}
        className="w-full text-[.8vw] px-[0.75vw] py-[0.45vw] border border-gray-300 bg-white rounded-[0.5vw] text-[0.85vw] outline-none box-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

export function DesignPreview({ file, productId, pdfPreviews, setPreviewModal }) {
  return (
    <div className="p-[1vw] bg-gray-50 rounded-[0.5vw] border-2 border-gray-300 h-full relative">
      <p className="text-[0.85vw] font-medium text-gray-700 mb-[0.5vw]">
        Preview:
      </p>

      {file?.type === "application/pdf" ? (
        <div className="mb-[1vw]">
          {pdfPreviews[productId] ? (
            <img
              src={pdfPreviews[productId]}
              alt="PDF Preview"
              className="w-full h-auto border border-gray-300 rounded"
              style={{
                maxHeight: "150px",
                objectFit: "contain",
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-32 bg-gray-200 rounded">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-500 text-0.8vw">Generating preview...</p>
            </div>
          )}
        </div>
      ) : (
        file?.type?.startsWith("image/") && (
          <img
            src={URL.createObjectURL(file)}
            alt="Design Preview"
            className="w-full h-auto mb-1vw border border-gray-300 rounded"
            style={{
              maxHeight: "9vw",
              objectFit: "contain",
            }}
          />
        )
      )}

      <div className="mt-2">
        <div className="flex items-center justify-between text-0.75vw">
          <span className="text-gray-600 truncate pr-2">{file?.name}</span>
        </div>
        <div className="flex items-center justify-between text-0.7vw mt-1">
          <span className="text-gray-500">
            {(file?.size / 1024).toFixed(2)} KB
          </span>
          <span
            className={`px-2 py-0.5 rounded text-0.65vw font-medium ${file?.type === "application/pdf"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
              }`}
          >
            {file?.type === "application/pdf" ? "PDF" : "Image"}
          </span>
        </div>
      </div>
      <button
        onClick={() => {
          let fileUrl = null;
          if (file) {
            fileUrl = URL.createObjectURL(file);
          }
          setPreviewModal({
            isOpen: true,
            type: file?.type === "application/pdf" ? "pdf" : "image",
            path: fileUrl,
            name: file?.name,
          });
        }}
        className="px-[1vw] py-[0.4vw] bg-green-600 text-white rounded-[0.4vw] hover:bg-green-700 font-medium text-[0.75vw] transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-[0.3vw] justify-center ml-[auto] mt-[.75vw] absolute top-[-.30vw] right-[1vw]"
      >
        <svg
          className="w-[0.9vw] h-[0.9vw]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        Preview
      </button>
    </div>
  );
}
