export default function LoadingState() {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-8">
          <div className="h-20 w-20 rounded-full border-4 border-gray-700 border-t-green-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Processing Your Medical Records</h3>
        <p className="text-gray-400 max-w-md">
          We're analyzing and summarizing your documents. This may take a few moments depending on the size and complexity of your records.
        </p>
        
        <div className="mt-8 space-y-2 w-full max-w-md">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Extracting document content...</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Analyzing medical terminology...</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Generating comprehensive summary...</span>
          </div>
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Creating PDF document...</span>
          </div>
        </div>
      </div>
    </div>
  );
}