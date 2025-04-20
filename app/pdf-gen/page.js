'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import UploadForm from '@/components/UploadForm';
import SummaryView from '@/components/SummaryView';
import LoadingState from '@/components/LoadingState';
import { UserButton } from '@clerk/nextjs';

export default function MedicalRecordsSummarizer() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryUrl, setSummaryUrl] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation menu items
  const navigationItems = [
    { name: 'Health Assessment', href: '/health-assessment', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
    { name: 'Record Summariser', href: '/pdf-gen', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', active: true  },
    { name: 'Medical Assistant', href: '/health-chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/")
      }

    }

  }, [user])

  // Check if user is logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  const handleProcessFiles = async (files) => {
    setIsProcessing(true);
    setError(null);

    try {
      // First, upload the files to get their URLs
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file-${index}`, file);
      });

      // Upload files and get their URLs
      const uploadResponse = await fetch('/api/process-pdfs', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDFs');
      }

      const { fileUrls } = await uploadResponse.json();

      // Generate summary from the uploaded PDFs
      const summaryResponse = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrls }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to generate summary');
      }

      const { summaryPdfUrl } = await summaryResponse.json();
      setSummaryUrl(summaryPdfUrl);
      console.log("Download link:", summaryPdfUrl);
    } catch (err) {
      console.error("Error processing files:", err);
      setError(err.message || "An error occurred while processing your files");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Navbar */}
      <header className="bg-gray-900 text-white shadow-md">
        <div className="container mx-auto">
          {/* Desktop navbar */}
          <div className="hidden md:flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <Link href="/pdf-gen" className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-xl font-bold">Diagnosify</span>
              </Link>

              <nav className="ml-10">
                <ul className="flex space-x-8">
                  {navigationItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center py-2 text-sm font-medium transition-colors border-b-2 ${item.active
                            ? 'text-green-400 border-green-500'
                            : 'text-gray-300 border-transparent hover:text-green-400 hover:border-green-400'
                          }`}
                      >
                        <svg
                          className={`mr-1.5 h-5 w-5 ${item.active ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
                            }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <UserButton/>
            </div>
          </div>

          {/* Mobile navbar */}
          <div className="flex md:hidden items-center justify-between h-16 px-4">
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-lg font-bold">Diagnosify</span>
            </Link>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-300 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {sidebarOpen && (
            <div className="md:hidden bg-gray-800 shadow-lg animate-fadeIn">
              <nav className="py-2">
                <ul className="space-y-1 px-4">
                  {navigationItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${item.active
                            ? 'bg-gray-700 text-green-400'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-green-400'
                          }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <svg
                          className={`mr-3 h-5 w-5 ${item.active ? 'text-green-400' : 'text-gray-400'
                            }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                        {item.name}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2 mt-2 ml-2 border-t border-gray-700">
                    <UserButton/>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-3xl mx-auto bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Medical Records Summarizer</h1>
            <p className="text-green-400 mt-2">Upload your medical records and get a concise summary</p>
          </div>

          {!isProcessing && !summaryUrl && (
            <UploadForm onSubmit={handleProcessFiles} error={error} />
          )}

          {isProcessing && (
            <LoadingState />
          )}

          {summaryUrl && !isProcessing && (
            <SummaryView summaryUrl={summaryUrl} />
          )}
        </div>
      </main>

      {/* Add custom animation classes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}