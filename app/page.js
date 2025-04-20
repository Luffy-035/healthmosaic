'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, Activity, FileText, Bot, Zap } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const {user} = useUser();
  const router = useRouter();
  

  useEffect(()=>{
    if(user){
      router.push("/health-assessment")
    }
  },[user,router])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-green-500 text-3xl mr-2">+</span>
              <span className="font-bold text-2xl">Diagnosify</span>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <Link href="#features" className="hover:text-green-400 transition-colors">
                  Features
                </Link>
                <Link href="#howitworks" className="hover:text-green-400 transition-colors">
                  How it works
                </Link>
                <Link href="#about" className="hover:text-green-400 transition-colors">
                  About
                </Link>
                <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-gray-900 font-medium px-5 py-2 rounded-full transition-all transform hover:scale-105 hover:shadow-lg">
                  Sign Up
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-200 hover:text-white"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-800 shadow-xl animate-fadeIn">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="#features"
                className="block px-3 py-2 hover:bg-gray-700 hover:text-green-400 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#howitworks"
                className="block px-3 py-2 hover:bg-gray-700 hover:text-green-400 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                How it works
              </Link>
              <Link
                href="#about"
                className="block px-3 py-2 hover:bg-gray-700 hover:text-green-400 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/signup"
                className="block px-3 py-2 mt-4 bg-green-500 hover:bg-green-400 text-gray-900 font-medium rounded-md text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Next-Gen Healthcare <span className="text-green-500">at Your Fingertips</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Experience advanced medical diagnostics, personalized health scores,
                and AI-powered consultations—all in one revolutionary application.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="bg-green-500 hover:bg-green-400 text-gray-900 font-medium px-8 py-3 rounded-full transition-all transform hover:scale-105 hover:shadow-lg inline-flex items-center"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="#features"
                  className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-full transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful <span className="text-green-500">Features</span></h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our app combines cutting-edge technology with medical expertise to provide
              you with comprehensive healthcare solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}


            {/* Feature 2 */}
            <div className="bg-gray-900 rounded-xl p-6 transition-transform hover:transform hover:scale-105">
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Health Score Calculator</h3>
              <p className="text-gray-400">
                Get a personalized health score based on your vitals, lifestyle, and medical history to track your wellbeing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-900 rounded-xl p-6 transition-transform hover:transform hover:scale-105">
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">Medical Records PDF</h3>
              <p className="text-gray-400">
                Automatically summarize and generate structured medical records from your healthcare data.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-900 rounded-xl p-6 transition-transform hover:transform hover:scale-105">
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                <Bot className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Medical Assistant</h3>
              <p className="text-gray-400">
                Chat with our AI-powered medical assistant for preliminary guidance and health information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howitworks" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It <span className="text-green-500">Works</span></h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our intuitive platform makes healthcare management simple and accessible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gray-800 rounded-xl p-6 h-full">
                <div className="absolute -top-4 -left-4 h-12 w-12 bg-green-500 rounded-full flex items-center justify-center font-bold text-gray-900">1</div>
                <h3 className="text-xl font-bold mb-3 mt-4">Create Your Profile</h3>
                <p className="text-gray-400">
                  Sign up and complete your health profile with your medical history, allergies, and current medications.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gray-800 rounded-xl p-6 h-full">
                <div className="absolute -top-4 -left-4 h-12 w-12 bg-green-500 rounded-full flex items-center justify-center font-bold text-gray-900">2</div>
                <h3 className="text-xl font-bold mb-3 mt-4">Upload Your Data</h3>
                <p className="text-gray-400">
                  Securely upload your lab results, and other medical records to the platform.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gray-800 rounded-xl p-6 h-full">
                <div className="absolute -top-4 -left-4 h-12 w-12 bg-green-500 rounded-full flex items-center justify-center font-bold text-gray-900">3</div>
                <h3 className="text-xl font-bold mb-3 mt-4">Get Insights</h3>
                <p className="text-gray-400">
                  Receive detailed analysis, health scores, and personalized recommendations from our AI system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-900/50 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Healthcare Experience?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join our platform, where users have already enhanced their health management using our tools.
          </p>
          <Link
            href="/signup"
            className="bg-green-500 hover:bg-green-400 text-gray-900 font-bold px-8 py-4 rounded-full text-lg transition-all transform hover:scale-105 hover:shadow-xl inline-flex items-center"
          >
            Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <span className="text-green-500 text-3xl mr-2">+</span>
                <span className="font-bold text-2xl">Diagnosify</span>
              </div>
              <p className="mt-4 text-gray-400 max-w-md">
                Revolutionary healthcare technology putting advanced medical tools in your hands.
              </p>
            </div>


          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Diagnosify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Add custom animation classes */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}