function ResultCard({ data }) {
    return (
        <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <div>
                <p className="font-medium">
                <span className="text-blue-600">{data.method}</span> {data.endpoint}
                </p>
                <p>Status: {data.status}</p>
            </div>
            <div>
                {data.success ? (
                    <span className="text-green-600 font-bold">✅</span>
                ) : (
                <span className="text-red-500 font-bold">❌</span>
                )}
            </div>
        </div>
    );
}

export default ResultCard;
