const ConfirmModal = ({
  isOpen,
  message,
  onYes,
  onNo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white w-[30vw] min-w-[320px] rounded-xl shadow-xl p-6">

        <h2 className="text-lg font-semibold mb-4">
          Confirmation
        </h2>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onNo}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
          >
            No
          </button>

          <button
            onClick={onYes}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Yes
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
