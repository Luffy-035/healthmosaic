import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const EMERGENCY_SYMPTOMS = [
  'severe chest pain', 'heart attack', 'can\'t breathe', 'unable to breathe',
  'stroke', 'sudden numbness in face', 'face drooping', 'arm weakness',
  'slurred speech', 'sudden loss of vision', 'unconscious', 'unresponsive',
  'seizure', 'severe bleeding', 'coughing up blood', 'vomiting blood',
  'severe burn', 'electric shock', 'drowning', 'choking', 'anaphylaxis',
  'suicide', 'suicidal thoughts', 'overdose', 'poisoning'
];

const HOME_REMEDIES = {
  'headache': [
    'Rest in a quiet, dark room',
    'Apply a cold compress to your forehead',
    'Drink plenty of water to stay hydrated',
    'Try gentle neck stretches or massage',
    'Over-the-counter pain relievers like acetaminophen or ibuprofen can help (if not contraindicated)'
  ],
  'fever': [
    'Stay hydrated with water, broth, or electrolyte solutions',
    'Rest as much as possible',
    'Use a lukewarm sponge bath to help reduce fever',
    'Dress lightly and avoid heavy blankets',
    'Over-the-counter fever reducers like acetaminophen or ibuprofen can help (if not contraindicated)'
  ],
  'cold': [
    'Get plenty of rest',
    'Drink warm liquids like tea or broth',
    'Use a humidifier to moisten the air',
    'Gargle with warm salt water for sore throat',
    'Over-the-counter cold medications can help relieve symptoms'
  ],
  'stomach ache': [
    'Try the BRAT diet: bananas, rice, applesauce, toast',
    'Drink clear fluids and stay hydrated',
    'Apply a warm compress to your abdomen',
    'Avoid dairy, fatty, or spicy foods',
    'Peppermint tea or ginger can help soothe stomach'
  ],
  'sore throat': [
    'Gargle with warm salt water several times a day',
    'Drink warm liquids like tea with honey',
    'Use throat lozenges or hard candy to keep throat moist',
    'Run a humidifier to add moisture to the air',
    'Rest your voice as much as possible'
  ],
  'muscle pain': [
    'Apply ice for the first 48 hours, then switch to heat',
    'Gently stretch the affected muscles',
    'Take over-the-counter pain relievers if needed',
    'Get light exercise to promote blood flow',
    'Try a warm bath with Epsom salts'
  ]
};

const LOCAL_DOCTORS = {
  'General Practitioner': [
    { name: 'Dr. Amanda Lewis', hospital: 'Community Health Clinic', phone: '(555) 987-6543' },
    { name: 'Dr. Daniel Morris', hospital: 'Family Medicine Associates', phone: '(555) 876-5432' },
  ]
};

function checkForEmergency(message) {
  const lowercaseMessage = message.toLowerCase();
  return EMERGENCY_SYMPTOMS.some(symptom => lowercaseMessage.includes(symptom));
}

function extractMainSymptoms(message) {
  const lowercaseMessage = message.toLowerCase();
  const possibleSymptoms = Object.keys(HOME_REMEDIES);
  return possibleSymptoms.filter(symptom => lowercaseMessage.includes(symptom));
}

function getHomeRemedies(symptoms) {
  const remedies = new Set();
  symptoms.forEach(symptom => {
    if (HOME_REMEDIES[symptom]) {
      HOME_REMEDIES[symptom].forEach(remedy => remedies.add(remedy));
    }
  });
  return Array.from(remedies);
}

function needsDoctorReferral(messages) {
  const allText = messages.map(msg => msg.content.toLowerCase()).join(' ');
  
  // Indicators that suggest professional help is needed
  const severityIndicators = [
    'severe', 'unbearable', 'worst', 'cannot', 'unable',
    'getting worse', 'not improving', 'for weeks', 'for months',
    'recurring', 'interfering', 'debilitating', 'persistent'
  ];
  
  return severityIndicators.some(term => allText.includes(term));
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    
    // Get last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (!lastUserMessage) {
      return NextResponse.json({
        message: "Hello! I'm here to help you understand your symptoms. Can you describe what you're experiencing?"
      });
    }
    
    // Check for emergency first
    const isEmergency = checkForEmergency(lastUserMessage.content);
    if (isEmergency) {
      return NextResponse.json({
        message: "⚠️ This sounds serious! Please call emergency services (112/911) or go to the nearest hospital immediately. Your safety is the top priority.",
        emergency: true
      });
    }
    
    // Extract main symptoms from the message
    const mainSymptoms = extractMainSymptoms(lastUserMessage.content);
    const shouldRecommendDoctor = needsDoctorReferral(messages);
    
    // Create a system prompt that guides the AI to behave as a symptom checker
    const systemPrompt = `You are a helpful symptom assessment assistant. Your role is to:
- Acknowledge the user's symptoms
- Ask clarifying questions if needed to better understand their condition
- Provide general home care advice for common, minor symptoms
- Recommend seeing a doctor if symptoms seem serious or persistent
- NEVER diagnose or prescribe medication
- Always maintain a helpful, informative tone

Current symptoms mentioned: ${mainSymptoms.join(', ') || 'none specified'}

Response guidelines:
1. If symptoms are unclear, ask ONE simple question to clarify
2. For minor symptoms, suggest general care tips
3. For serious or persistent symptoms, recommend professional medical advice
4. Keep responses concise and focused on symptom assessment`;

    // Get response from Groq AI
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.5, // Lower temperature for more focused responses
      max_tokens: 300,
    });
    
    let aiResponse = completion.choices[0].message.content;

    // Add home remedies if we have matching symptoms and the response doesn't suggest a doctor
    if (mainSymptoms.length > 0 && !shouldRecommendDoctor && !aiResponse.toLowerCase().includes('doctor')) {
      const remedies = getHomeRemedies(mainSymptoms);
      if (remedies.length > 0) {
        aiResponse += `\n\nFor ${mainSymptoms.join(' or ')} you might try:\n• ${remedies.join('\n• ')}`;
      }
    }

    // Add doctor recommendation if needed
    if (shouldRecommendDoctor) {
      const doctors = LOCAL_DOCTORS['General Practitioner'];
      aiResponse += `\n\nSince your symptoms seem persistent or severe, I recommend consulting a doctor. Here are some general practitioners in your area:\n• ${doctors[0].name} at ${doctors[0].hospital}, ${doctors[0].phone}\n• ${doctors[1].name} at ${doctors[1].hospital}, ${doctors[1].phone}`;
    }

    return NextResponse.json({
      message: aiResponse,
      emergency: isEmergency,
      symptoms: mainSymptoms,
      remedies: mainSymptoms.length > 0 && !shouldRecommendDoctor ? getHomeRemedies(mainSymptoms) : null,
      referral: shouldRecommendDoctor
    });
    
  } catch (error) {
    console.error('Error in symptom checker API:', error);
    return NextResponse.json(
      { message: "I'm having trouble understanding your symptoms. Could you please describe them again?" },
      { status: 500 }
    );
  }
}