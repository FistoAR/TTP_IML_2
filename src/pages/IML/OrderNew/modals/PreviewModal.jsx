// Auto-extracted from OrdersManagement.jsx


export default function PreviewModal({ previewModal, previewModalRef, setPreviewModal }) {
  if (!previewModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000ad] bg-opacity-70 z-5000000 flex items-center justify-center p-4">
      <div
        ref={previewModalRef}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-lg overflow-hidden max-w-6xl w-full max-h-90vh flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
          <h2 className="text-[1.25vw] font-semibold text-gray-800">
            Preview: {previewModal.name}
          </h2>
          <button
            onClick={() =>
              setPreviewModal({
                isOpen: false,
                type: null,
                path: null,
                name: null,
              })
            }
            className="text-gray-500 hover:text-gray-800 text-[2vw] font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {previewModal.type === "pdf" ? (
            <iframe
              src={`${previewModal.path}#toolbar=1&navpanes=0`}
              title={previewModal.name}
              className="w-full h-full border-0"
              style={{ minHeight: "60vh" }}
            />
          ) : (
            <img
              src={previewModal.path}
              alt={previewModal.name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-300 bg-gray-50">
          <button
            onClick={() =>
              setPreviewModal({
                isOpen: false,
                type: null,
                path: null,
                name: null,
              })
            }
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-[0.4vw] cursor-pointer hover:bg-gray-400 hover:text-white font-medium text-0.9vw"
          >
            Close
          </button>
          <a
            href={previewModal.path}
            download={previewModal.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-[0.4vw] hover:bg-blue-700 font-medium text-0.9vw"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
