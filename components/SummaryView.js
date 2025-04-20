export default function SummaryView({ summaryUrl }) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg 
            className="w-8 h-8 text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center">Summary Generated!</h2>
        <p className="text-gray-600 mb-6 text-center">
          Your medical records have been analyzed and a summary PDF has been created.
        </p>
        
        <a
          href={summaryUrl}
          download="medical_summary.pdf"
          className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Summary PDF
        </a>
        
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-green-500 hover:text-green-600 underline"
        >
          Process another set of records
        </button>
      </div>
    );
  }