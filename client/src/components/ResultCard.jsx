function ResultCard({ data, onRetry }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">
            <span className="text-blue-600 dark:text-blue-400 uppercase">{data.method}</span>{" "}
            <span className="text-gray-900 dark:text-gray-200">{data.endpoint}</span>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Status: {data.status || data.statusCode}
          </p>
          {!data.success && data.error && (
            <p className="text-xs text-red-400 mt-1">Error: {data.error}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data.success ? (
            <span className="text-green-600 text-2xl font-bold">✅</span>
          ) : (
            <>
              <span className="text-red-500 text-2xl font-bold">❌</span>
              <button
                onClick={() => onRetry(data)}
                className="bg-red-500 text-white px-2 py-1 text-sm rounded hover:bg-red-600"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
  }
  
export default ResultCard;
