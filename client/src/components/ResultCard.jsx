/**
 * ResultCard component displays the result of an API request.
 * 
 * @param {object} props
 * @param {object} props.data - API request data
 * @param {function} props.onRetry - Retry button click handler
 * @returns {JSX.Element} ResultCard component
 */
function ResultCard({ data, onRetry }) {
  const { method, endpoint, status, statusCode, success, error } = data;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">
            <span className="text-blue-600 dark:text-blue-400 uppercase">{method}</span>{" "}
            <span className="text-gray-900 dark:text-gray-200">{endpoint}</span>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Status: {status || statusCode}
          </p>
          {error && !success && (
            <p className="text-xs text-red-400 mt-1">Error: {error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {success ? (
            <span className="text-green-600 text-2xl font-bold">✅</span>
          ) : (
            <>
              <span className="text-red-500 text-2xl font-bold">❌</span>
              <RetryButton onClick={() => onRetry(data)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * RetryButton component displays a retry button.
 * 
 * @param {object} props
 * @param {function} props.onClick - Button click handler
 * @returns {JSX.Element} RetryButton component
 */
function RetryButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-red-500 text-white px-2 py-1 text-sm rounded hover:bg-red-600"
    >
      Retry
    </button>
  );
}

export default ResultCard;