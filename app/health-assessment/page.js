'use client'
import { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveUserHealthData, getUserHealthData } from '@/lib/userActions';
import {
  healthQuestions,
  calculateBMI,
  calculateCategoryScore,
  calculateOverallHealthScore,
  getHealthScoreColor,
  getRecommendations
} from '@/lib/healthAssessment';
export default function HealthAssessment() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);


  useEffect(()=>{
    if(isLoaded)
    {
      if(!user){
        router.push("/")
      }

    }
    
  },[user])
  
  // User inputs
  const [basicInfo, setBasicInfo] = useState({
    height: '',
    weight: '',
    age: '',
    gender: ''
  });
  // Category responses
  const [responses, setResponses] = useState({
    physicalHealth: {},
    mentalHealth: {},
    nutritionHealth: {},
    sleepHealth: {}
  });
  // Results
  const [results, setResults] = useState({
    bmi: { value: 0, category: '' },
    categoryScores: {
      physicalHealth: 0,
      mentalHealth: 0,
      nutritionHealth: 0,
      sleepHealth: 0
    },
    overallHealthScore: 0,
    recommendations: {}
  });
  const [showResults, setShowResults] = useState(false);
  // Categories for the assessment
  const categories = [
    { id: 'basicInfo', name: 'Basic Information' },
    { id: 'physicalHealth', name: 'Physical Health' },
    { id: 'mentalHealth', name: 'Mental Health' },
    { id: 'nutritionHealth', name: 'Nutrition' },
    { id: 'sleepHealth', name: 'Sleep Quality' }
  ];
  
  // Navigation menu items
  const navigationItems = [
    { name: 'Health Assessment', href: '/health-assessment', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', active: true },
    { name: 'Record Summariser', href: '/pdf-gen', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Medical Assistant', href: '/health-chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];
  
  // Check if user is logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);
  
  // Handle basic info change
  const handleBasicInfoChange = (id, value) => {
    setBasicInfo(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  // Handle response selection
  const handleResponseSelect = (category, questionId, value, points) => {
    setResponses(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [questionId]: points
      }
    }));
  };
  
  // Check if current step is complete
  const isCurrentStepComplete = () => {
    const currentCategory = categories[step].id;
    if (currentCategory === 'basicInfo') {
      return (
        basicInfo.height &&
        basicInfo.weight &&
        basicInfo.age &&
        basicInfo.gender
      );
    }
    const questions = healthQuestions[currentCategory];
    const categoryResponses = responses[currentCategory];
    return questions.every(q => categoryResponses[q.id] !== undefined);
  };
  
  // Go to next step
  const goToNextStep = () => {
    if (step < categories.length - 1) {
      setStep(step + 1);
    } else {
      calculateResults();
    }
  };
  
  // Go to previous step
  const goToPreviousStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  // Calculate results
  const calculateResults = () => {
    setLoading(true);
    try {
      // Calculate BMI
      const bmi = calculateBMI(
        parseFloat(basicInfo.weight),
        parseFloat(basicInfo.height)
      );
      // Calculate scores for each category
      const categoryScores = {
        physicalHealth: calculateCategoryScore(responses.physicalHealth),
        mentalHealth: calculateCategoryScore(responses.mentalHealth),
        nutritionHealth: calculateCategoryScore(responses.nutritionHealth),
        sleepHealth: calculateCategoryScore(responses.sleepHealth)
      };
      // Calculate overall health score
      const overallHealthScore = calculateOverallHealthScore(categoryScores, bmi);
      // Get recommendations
      const recommendations = getRecommendations(categoryScores, bmi);
      // Set results
      const resultData = {
        bmi,
        categoryScores,
        overallHealthScore,
        recommendations
      };
      setResults(resultData);
      // Save results to database
      saveResultsToDatabase(resultData);
      // Show results
      setShowResults(true);
    } catch (e) {
      setError('An error occurred while calculating your health score.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  // Save results to database
  const saveResultsToDatabase = async (resultData) => {
    try {
      // Prepare health data for saving
      const healthData = {
        bmi: {
          height: parseFloat(basicInfo.height),
          weight: parseFloat(basicInfo.weight),
          value: resultData.bmi.value,
          category: resultData.bmi.category
        },
        physicalHealth: {
          score: resultData.categoryScores.physicalHealth,
          responses: responses.physicalHealth
        },
        mentalHealth: {
          score: resultData.categoryScores.mentalHealth,
          responses: responses.mentalHealth
        },
        nutritionHealth: {
          score: resultData.categoryScores.nutritionHealth,
          responses: responses.nutritionHealth
        },
        sleepHealth: {
          score: resultData.categoryScores.sleepHealth,
          responses: responses.sleepHealth
        },
        overallHealthScore: resultData.overallHealthScore
      };
      // Save to database
      const saveResult = await saveUserHealthData(user.id, healthData);
      if (!saveResult.success) {
        console.error('Failed to save health data:', saveResult.error);
      }
    } catch (e) {
      console.error('Error saving results to database:', e);
    }
  };
  
  // Restart assessment
  const restartAssessment = () => {
    setStep(0);
    setBasicInfo({
      height: '',
      weight: '',
      age: '',
      gender: ''
    });
    setResponses({
      physicalHealth: {},
      mentalHealth: {},
      nutritionHealth: {},
      sleepHealth: {}
    });
    setResults({
      bmi: { value: 0, category: '' },
      categoryScores: {
        physicalHealth: 0,
        mentalHealth: 0,
        nutritionHealth: 0,
        sleepHealth: 0
      },
      overallHealthScore: 0,
      recommendations: {}
    });
    setShowResults(false);
    setError('');
  };
  
  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
              <Link href="/health-assessment" className="flex items-center">
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
                        className={`flex items-center py-2 text-sm font-medium transition-colors border-b-2 ${
                          item.active
                            ? 'text-green-400 border-green-500'
                            : 'text-gray-300 border-transparent hover:text-green-400 hover:border-green-400'
                        }`}
                      >
                        <svg
                          className={`mr-1.5 h-5 w-5 ${
                            item.active ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
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
              
              
              <div className="flex items-center border-l border-gray-700 pl-4">
                <UserButton/>
              </div>
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
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          item.active
                            ? 'bg-gray-700 text-green-400'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-green-400'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <svg
                          className={`mr-3 h-5 w-5 ${
                            item.active ? 'text-green-400' : 'text-gray-400'
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

      {/* Content area */}
      <div className="flex-1 bg-gray-900 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">
                Health Assessment
              </h1>
              <p className="text-lg text-green-400">
                Complete this assessment to get personalized health insights
              </p>
            </div>
            
            {!showResults ? (
              <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                {/* Progress steps */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
                  <div className="flex justify-between items-center">
                    {categories.map((category, index) => (
                      <div key={category.id} className="flex flex-col items-center">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mb-1
                            ${index < step ? 'bg-green-500 text-gray-900' : 
                              index === step ? 'bg-green-400 text-gray-900 ring-4 ring-green-500/30' : 
                              'bg-gray-700 text-gray-300'}`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xs font-medium text-gray-300 hidden sm:block">
                          {category.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Form content */}
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-white mb-6">
                    {categories[step].name}
                  </h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg border border-red-700">
                      {error}
                    </div>
                  )}
                  
                  {categories[step].id === 'basicInfo' ? (
                    <div className="space-y-6">
                      {healthQuestions.basicInfo.map((question) => (
                        <div key={question.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-200">
                            {question.question}
                          </label>
                          {question.type === 'number' ? (
                            <div className="relative mt-1 rounded-md shadow-sm">
                              <input
                                type="number"
                                name={question.id}
                                id={question.id}
                                value={basicInfo[question.id]}
                                onChange={(e) => handleBasicInfoChange(question.id, e.target.value)}
                                className="block w-full rounded-md bg-gray-700 border-gray-600 text-white pl-3 pr-12 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                placeholder="0"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-400 sm:text-sm">{question.unit}</span>
                              </div>
                            </div>
                          ) : (
                            <select
                              name={question.id}
                              id={question.id}
                              value={basicInfo[question.id]}
                              onChange={(e) => handleBasicInfoChange(question.id, e.target.value)}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                            >
                              <option value="">Select an option</option>
                              {question.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {healthQuestions[categories[step].id].map((question) => (
                        <div key={question.id} className="space-y-3">
                          <h3 className="text-md font-medium text-white">
                            {question.question}
                          </h3>
                          <div className="grid gap-2">
                            {question.options.map((option) => (
                              <div 
                                key={option.value}
                                className={`
                                  border rounded-lg p-3 cursor-pointer transition-all duration-200
                                  ${responses[categories[step].id][question.id] === option.points 
                                    ? 'border-green-500 bg-gray-700' 
                                    : 'border-gray-600 hover:border-green-400 hover:bg-gray-700/50'
                                  }
                                `}
                                onClick={() => handleResponseSelect(
                                  categories[step].id,
                                  question.id,
                                  option.value,
                                  option.points
                                )}
                              >
                                <label className="flex items-center cursor-pointer">
                                  <input
                                    type="radio"
                                    className="form-radio text-green-500 h-4 w-4 bg-gray-700 border-gray-500"
                                    checked={responses[categories[step].id][question.id] === option.points}
                                    onChange={() => {}}
                                  />
                                  <span className="ml-2 text-gray-200">{option.label}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Navigation buttons */}
                <div className="px-6 py-4 bg-gray-700 flex justify-between">
                  <button
                    onClick={goToPreviousStep}
                    disabled={step === 0}
                    className={`px-4 py-2 rounded-md ${
                      step === 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-green-500'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={goToNextStep}
                    disabled={!isCurrentStepComplete()}
                    className={`px-4 py-2 rounded-md ${
                      isCurrentStepComplete()
                        ? 'bg-green-500 text-gray-900 font-medium hover:bg-green-400'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {step === categories.length - 1 ? 'Complete Assessment' : 'Next'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                {loading ? (
                  <div className="p-10 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4"></div>
                    <p className="text-gray-300">Calculating your health score...</p>
                  </div>
                ) : (
                  <div>
                    {/* Results header */}
                    <div className="px-6 py-8 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center border-b border-gray-700">
                      <h2 className="text-2xl font-bold mb-2">Your Health Assessment Results</h2>
                      <p className="text-green-400">Based on your responses, here's your personalized health evaluation</p>
                    </div>
                    
                    {/* Overall score */}
                    <div className="p-6 flex flex-col items-center border-b border-gray-700">
                      <div className="relative mb-4">
                        <svg className="w-32 h-32" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="3"
                            strokeDasharray={`${results.overallHealthScore}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <div className="text-3xl font-bold text-white">{results.overallHealthScore}</div>
                          <div className="text-sm text-gray-400">Overall Score</div>
                        </div>
                      </div>
                      
                      <p className="text-lg font-semibold mb-2 text-green-400">
                        {results.overallHealthScore >= 80 
                          ? 'Excellent Health' 
                          : results.overallHealthScore >= 60 
                            ? 'Good Health' 
                            : results.overallHealthScore >= 40 
                              ? 'Fair Health' 
                              : 'Needs Improvement'}
                      </p>
                      <p className="text-gray-300 text-center max-w-lg">
                        Your BMI is {results.bmi.value} ({results.bmi.category}). This assessment provides a snapshot of your current health status based on your responses.
                      </p>
                    </div>
                    
                    {/* Category scores */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(results.categoryScores).map(([category, score]) => {
                        const formattedCategory = category.replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())
                          .replace('Health', '');
                        
                        return (
                          <div key={category} className="border border-gray-700 rounded-lg p-4 bg-gray-700/50">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium text-white">{formattedCategory}</h3>
                              <span 
                                className="font-semibold text-sm px-2 py-1 rounded-full bg-green-500/20 text-green-400"
                              >
                                {score}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-green-500" 
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Recommendations */}
                    <div className="p-6 border-t border-gray-700">
                      <h3 className="text-xl font-bold mb-4 text-white">Your Personalized Recommendations</h3>
                      
                      <div className="space-y-6">
                        {Object.entries(results.recommendations).map(([category, recs]) => {
                          if (recs.length === 0) return null;
                          
                          let categoryTitle;
                          let icon;
                          
                          switch(category) {
                            case 'physicalHealth':
                              categoryTitle = 'Physical Activity';
                              icon = '🏃‍♂️';
                              break;
                            case 'mentalHealth':
                              categoryTitle = 'Mental Wellbeing';
                              icon = '🧠';
                              break;
                            case 'nutritionHealth':
                              categoryTitle = 'Nutrition';
                              icon = '🥗';
                              break;
                            case 'sleepHealth':
                              categoryTitle = 'Sleep';
                              icon = '😴';
                              break;
                            case 'bmi':
                              categoryTitle = 'Weight Management';
                              icon = '⚖️';
                              break;
                            default:
                              categoryTitle = category;
                              icon = '✅';
                          }
                          
                          return (
                            <div key={category} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                              <h4 className="font-semibold text-lg mb-2 flex items-center text-green-400">
                                <span className="mr-2">{icon}</span>
                                {categoryTitle}
                              </h4>
                              <ul className="space-y-2 ml-6">
                                {recs.map((rec, i) => (
                                  <li key={i} className="text-gray-300 flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="px-6 py-4 bg-gray-700 flex flex-col sm:flex-row justify-center gap-4">
                      <button
                        onClick={restartAssessment}
                        className="px-6 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 hover:border-green-500"
                      >
                        Retake Assessment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            
          </div>
        </div>

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