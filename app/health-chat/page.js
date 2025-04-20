'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function HealthChatbot() {
    const { user, isLoaded } = useUser();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi there! I\'m your medical assistant. How are you feeling today? Please describe any symptoms you\'re experiencing.'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showEmergency, setShowEmergency] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoaded) {
            if (!user) {
                router.push("/")
            }

        }

    }, [user])

    // Navigation menu items
    const navigationItems = [
        { name: 'Health Assessment', href: '/health-assessment', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Record Summariser', href: '/pdf-gen', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Medical Assistant', href: '/health-chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', active: true },
    ];

    // Auto-scroll to bottom of chat
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input on initial load
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/health-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage]
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.message }
            ]);

            // If emergency was detected, show emergency UI
            if (data.emergency) {
                setShowEmergency(true);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'I apologize, but I\'m having trouble processing your request right now. Please try again later.'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Loading state
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Navbar */}
            <header className="bg-gray-900 text-white shadow-md">
                <div className="container mx-auto">
                    {/* Desktop navbar */}
                    <div className="hidden md:flex items-center justify-between h-16 px-4">
                        <div className="flex items-center">
                            <Link href="/health-chat" className="flex items-center">
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
                            <UserButton />

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
                                    {user ? (
                                        <li className="pt-2 mt-2 ml-2 border-t border-gray-700">
                                            <UserButton />

                                        </li>
                                    ) : (
                                        <li className="pt-2 mt-2 border-t border-gray-700">
                                            <Link
                                                href="/sign-in"
                                                className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium bg-green-500 text-gray-900 rounded-md hover:bg-green-400"
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                Sign In
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Container */}
            <main className="flex-1 overflow-hidden flex flex-col max-w-5xl w-full mx-auto px-4 pt-4 pb-20 relative">
                {/* Chat Title */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white">
                        Medical Assistant
                    </h1>
                    <p className="text-green-400 text-sm">
                        Powered by AI - Consult in real-time
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="space-y-6">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${message.role === 'user'
                                        ? 'bg-green-500 text-gray-900 rounded-tr-none'
                                        : 'bg-gray-800 border border-gray-700 shadow-md rounded-tl-none text-white'
                                        }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-full flex items-center mb-1">
                                            <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="ml-2 text-sm font-medium text-green-400">Medical Assistant</span>
                                        </div>
                                    )}
                                    <div className={`prose ${message.role === 'user' ? 'text-gray-900 font-medium' : 'text-gray-200'} max-w-none`}>
                                        {message.role === 'assistant' ? (
                                            <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />') }} />
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-800 border border-gray-700 shadow-md rounded-tl-none">
                                    <div className="flex space-x-2 items-center">
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse delay-100"></div>
                                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Emergency Alert */}
                {showEmergency && (
                    <div className="absolute bottom-24 left-4 right-4 bg-red-900/80 border-l-4 border-red-500 p-4 rounded-lg shadow-lg text-white">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-300">Emergency Services</h3>
                                <div className="mt-2 text-sm text-gray-200 space-y-1">
                                    <p>Based on your symptoms, immediate medical attention may be needed.</p>
                                    <p className="font-bold">Emergency Phone: 911</p>
                                    <p className="font-medium mt-1">Nearby Emergency Facilities:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>City General Hospital: (555) 123-4567</li>
                                        <li>Mercy Medical Center: (555) 765-4321</li>
                                        <li>University Health Center: (555) 987-6543</li>
                                    </ul>
                                </div>
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        className="bg-red-600 px-4 py-2 rounded-md text-white text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        onClick={() => window.open('tel:911')}
                                    >
                                        Call Emergency Services
                                    </button>
                                </div>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        type="button"
                                        className="inline-flex bg-red-900 rounded-md p-1.5 text-red-300 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        onClick={() => setShowEmergency(false)}
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="mt-4 sticky bottom-0 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
                    <div className="flex items-end space-x-2">
                        <div className="flex-1 min-h-[56px] bg-gray-700 overflow-hidden rounded-xl shadow-sm border border-gray-600 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your symptoms..."
                                className="block w-full resize-none border-0 bg-transparent py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                                rows={1}
                                style={{ height: 'auto', minHeight: '56px', maxHeight: '150px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={`
                                flex-shrink-0 p-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                                ${isLoading || !input.trim()
                                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                                    : 'bg-green-500 hover:bg-green-400 text-gray-900'}
                            `}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                        <p>Type your health concerns or symptoms</p>
                        <div className="flex items-center text-xs">
                            <span className="text-xs text-green-500">Press Enter to send</span>
                        </div>
                    </div>
                </form>

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
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                
                .animate-pulse {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                
                .delay-100 {
                    animation-delay: 0.1s;
                }
                
                .delay-200 {
                    animation-delay: 0.2s;
                }
            `}</style>
        </div>
    );
}