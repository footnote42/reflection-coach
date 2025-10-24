import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Target, Brain, Lightbulb, CheckCircle, Download, RotateCcw, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const ReflectivePracticeCoach = () => {
  const [stage, setStage] = useState('welcome');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [targetDuration, setTargetDuration] = useState(20); // minutes
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [deepTopicsIdentified, setDeepTopicsIdentified] = useState([]);
  
  const [reflectionData, setReflectionData] = useState({
    context: '',
    description: '',
    feelings: '',
    evaluation: '',
    analysis: '',
    insights: [],
    actions: [],
    reflectionLevel: 'technical',
    detectedPatterns: [],
    deepTopicsForFutureReflection: []
  });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  // Timer management
  useEffect(() => {
    if (sessionStartTime && stage !== 'welcome') {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
        setElapsedTime(elapsed);
        
        // Show warning at 80% of target duration
        if (elapsed >= targetDuration * 0.8 && !showTimeWarning) {
          setShowTimeWarning(true);
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [sessionStartTime, targetDuration, showTimeWarning, stage]);

  // Detect circular conversations or deep topics
  const detectDeepTopic = (text) => {
    const deepTopicMarkers = [
      'identity', 'who I am', 'whole self', 'fear', 'scared', 'terrified',
      'ashamed', 'failing', 'inadequate', 'not good enough', 'impostor',
      'childhood', 'trauma', 'painful', 'loss', 'grief', 'deeper issue'
    ];
    
    const lowerText = text.toLowerCase();
    const foundMarkers = deepTopicMarkers.filter(marker => lowerText.includes(marker));
    
    return foundMarkers.length > 0 ? foundMarkers : null;
  };

  const shouldSuggestWrapUp = () => {
    // Suggest wrap-up if:
    // 1. Time is running out (90%+ of target)
    // 2. We've had substantial exchanges (10+ in questioning stage)
    // 3. Deep topics have been identified that need separate sessions
    
    if (elapsedTime >= targetDuration * 0.9) return 'time';
    if (stage === 'questioning' && exchangeCount >= 10) return 'sufficient_depth';
    if (deepTopicsIdentified.length >= 2) return 'deep_topics';
    return false;
  };

  const getSystemPrompt = (currentStage) => {
    const wrapUpSuggestion = shouldSuggestWrapUp();
    const timeRemaining = targetDuration - elapsedTime;
    
    const baseContext = `You are an expert reflective practice coach trained in:
- The Reflective Practice Iceberg Model (Technical → Practical → Critical levels)
- Gibbs Reflective Cycle
- Driscoll's "What? So What? Now What?" model
- Professional coaching standards (ICF, EMCC, AC)

SESSION CONTEXT:
- Time elapsed: ${elapsedTime} minutes / Target: ${targetDuration} minutes
- Exchange count: ${exchangeCount}
- Current stage: ${currentStage}
- Reflection level: ${reflectionData.reflectionLevel}
- Deep topics identified for future: ${deepTopicsIdentified.join(', ') || 'none yet'}

${wrapUpSuggestion ? `
⚠️ WRAP-UP SIGNAL: ${
  wrapUpSuggestion === 'time' ? `Only ${timeRemaining} minutes remaining. Prepare to move toward closure.` :
  wrapUpSuggestion === 'sufficient_depth' ? 'You\'ve had extensive exchanges. Consider moving to insights/actions.' :
  'Multiple deep topics identified. Acknowledge this needs future sessions.'
}` : ''}

Your conversation history so far:
${JSON.stringify(reflectionData, null, 2)}

CRITICAL INSTRUCTIONS:
- Ask ONE powerful question at a time
- Be conversational and supportive, not clinical
- Use "you" and direct language
- Challenge surface-level responses by pushing deeper
- Notice when the person is describing vs analyzing
- Help them move from technical → practical → critical reflection
- Focus on THEIR role, behaviors, and choices
- Look for assumptions, patterns, and taken-for-granted beliefs

DEEP TOPIC MANAGEMENT:
- If someone touches on identity, trauma, deep fear, or complex psychological issues, ACKNOWLEDGE IT
- Say something like: "This is touching on something profound about [X]. This deserves its own dedicated reflection."
- Add it to the list of topics for future sessions
- DON'T try to resolve everything in one session
- Help them see they've opened an important door, and can return to it

TIME MANAGEMENT:
- If wrap-up signal is active, start transitioning to closure
- Don't open new deep topics when time is short
- Help synthesize what's been covered
- Move toward actionable next steps`;

    const stagePrompts = {
      context: `${baseContext}

You're gathering initial context. Ask questions to understand:
- What situation/session are they reflecting on?
- When and where did it occur?
- Who was involved?
- What were they trying to achieve?

Keep it brief - 2-3 exchanges maximum. Then suggest moving to deeper exploration.`,

      questioning: `${baseContext}

Current reflection level detected: ${reflectionData.reflectionLevel}

You're now doing deep reflective questioning. Your job is to:

1. If they're at TECHNICAL level (just describing):
   - Acknowledge what they've shared
   - Ask "Why did you..." or "What were you thinking when..."
   - Push toward practical reflection

2. If they're at PRACTICAL level (explaining their thinking):
   - Probe their assumptions: "What were you assuming about...?"
   - Ask about alignment: "How does this connect to your coaching philosophy?"
   - Challenge: "What alternatives did you consider?"
   - Push toward critical reflection

3. If they're at CRITICAL level (questioning beliefs/values):
   - Affirm their depth of thinking
   - Help them connect insights
   - Explore systemic factors: "What broader forces might be at play?"
   - Ask about congruence with values

IMPORTANT: 
- Watch for signs they're "stuck" describing events - interrupt gently and redirect
- Celebrate when you notice them going deeper
- If they touch on DEEP psychological topics (identity, trauma, deep fear), ACKNOWLEDGE it and suggest it for future reflection rather than trying to resolve it now
- After ${Math.max(7, 10 - exchangeCount)} more meaningful exchanges, suggest moving to insights/actions
- Be empathetic but don't let them off the hook easily`,

      insight: `${baseContext}

You're helping synthesize learning. Ask:
- "What's the key insight here for you?"
- "What patterns are you noticing?"
- "How does this connect to previous experiences?"
- "What surprised you most?"

After 2-3 exchanges, move toward action planning.

If deep topics were identified during questioning, acknowledge them:
- "We touched on [topic] which feels like it needs its own reflection"
- "Let's note that for future exploration"`,

      action: `${baseContext}

You're helping create concrete actions. Ensure actions are:
- SPECIFIC (not vague intentions)
- WITHIN THEIR CONTROL
- MEASURABLE (they'll know when they've done it)
- CONNECTED to the insights
- REALISTIC given their context

Ask questions like:
- "What specifically will you do differently next time?"
- "When will you try this?"
- "How will you know it's working?"
- "What might get in the way, and how will you handle that?"

After defining 1-3 clear actions, congratulate them and suggest they export.

If deep topics were identified, include them in action plan:
- "Topic for future reflection: [X]"
- "When might you explore this more deeply?"`
    };

    return stagePrompts[currentStage] || baseContext;
  };

  const detectReflectionLevel = (text) => {
    const technicalMarkers = ['happened', 'did', 'said', 'was', 'were', 'went', 'occurred'];
    const practicalMarkers = ['thought', 'felt', 'wanted', 'intended', 'because', 'why', 'reasoning'];
    const criticalMarkers = ['assumption', 'belief', 'should', 'philosophy', 'values', 'alternative', 'question', 'challenge', 'taken for granted'];

    const lowerText = text.toLowerCase();
    const criticalCount = criticalMarkers.filter(marker => lowerText.includes(marker)).length;
    const practicalCount = practicalMarkers.filter(marker => lowerText.includes(marker)).length;
    const technicalCount = technicalMarkers.filter(marker => lowerText.includes(marker)).length;

    if (criticalCount >= 2) return 'critical';
    if (criticalCount > 0 || practicalCount > technicalCount) return 'practical';
    return 'technical';
  };

  const callClaude = async (userMessage) => {
    const systemPrompt = getSystemPrompt(stage);
    
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: messages
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error("Error calling Claude:", error);
      return "I'm having trouble connecting right now. Let me ask you this: What's the most important thing you want to explore about this situation?";
    }
  };

  const handleSend = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const userMessage = currentInput.trim();
    setCurrentInput('');
    setIsProcessing(true);
    setExchangeCount(prev => prev + 1);

    // Add user message to conversation
    const newUserMsg = { role: 'user', content: userMessage, timestamp: new Date() };
    setConversationHistory(prev => [...prev, newUserMsg]);

    // Detect reflection level from user's input
    const detectedLevel = detectReflectionLevel(userMessage);
    setReflectionData(prev => ({
      ...prev,
      reflectionLevel: detectedLevel
    }));

    // Check for deep topics
    const deepTopics = detectDeepTopic(userMessage);
    if (deepTopics) {
      setDeepTopicsIdentified(prev => [...new Set([...prev, ...deepTopics])]);
      setReflectionData(prev => ({
        ...prev,
        deepTopicsForFutureReflection: [...new Set([...prev.deepTopicsForFutureReflection, ...deepTopics])]
      }));
    }

    // Get Claude's response
    const assistantResponse = await callClaude(userMessage);
    
    // Add assistant message to conversation
    const newAssistantMsg = { role: 'assistant', content: assistantResponse, timestamp: new Date() };
    setConversationHistory(prev => [...prev, newAssistantMsg]);

    // Update reflection data based on stage
    if (stage === 'context') {
      setReflectionData(prev => ({
        ...prev,
        context: prev.context + '\n' + userMessage
      }));
    } else if (stage === 'questioning') {
      setReflectionData(prev => ({
        ...prev,
        analysis: prev.analysis + '\n' + userMessage
      }));
    }

    setIsProcessing(false);
  };

  const handleStageTransition = (newStage) => {
    if (!sessionStartTime && newStage === 'context') {
      setSessionStartTime(Date.now());
    }
    
    setStage(newStage);
    
    const transitionMessages = {
      context: "Let's start by setting the scene. What situation or session would you like to reflect on?",
      questioning: "Great. Now let's dig deeper. I'm going to ask you some questions to help you really understand what was happening - not just on the surface, but within you.",
      insight: "You've shared a lot. Let's pause and make sense of it. What stands out to you? What are you learning?",
      action: "Powerful insights. Now, how will you take this forward? What will you do differently?"
    };

    if (transitionMessages[newStage]) {
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: transitionMessages[newStage],
        timestamp: new Date(),
        isTransition: true
      }]);
    }
  };

  const forceWrapUp = async () => {
    setIsProcessing(true);
    
    const wrapUpPrompt = `The person has requested to wrap up. Please:
1. Acknowledge the deep work they've done
2. Summarize 2-3 key insights from the conversation
3. If there are unresolved deep topics, explicitly name them for future reflection
4. Suggest they move to the Action stage to create concrete next steps
5. Be warm and encouraging about the progress made

Keep this brief - 3-4 sentences maximum.`;

    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: wrapUpPrompt }
    ];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: messages
        })
      });

      const data = await response.json();
      const wrapUpMessage = data.content[0].text;
      
      setConversationHistory(prev => [...prev, {
        role: 'assistant',
        content: wrapUpMessage,
        timestamp: new Date(),
        isWrapUp: true
      }]);
      
      // Auto-transition to action stage
      setTimeout(() => {
        handleStageTransition('action');
      }, 2000);
      
    } catch (error) {
      console.error("Error in wrap-up:", error);
    }
    
    setIsProcessing(false);
  };

  const generateSummary = () => {
    const detectedLevel = reflectionData.reflectionLevel.toUpperCase();
    
    // Correct the level if we reached critical
    const hasDeepMarkers = conversationHistory.some(msg => 
      msg.role === 'user' && (
        msg.content.toLowerCase().includes('assumption') ||
        msg.content.toLowerCase().includes('belief') ||
        msg.content.toLowerCase().includes('philosophy') ||
        msg.content.toLowerCase().includes('values') ||
        msg.content.toLowerCase().includes('identity')
      )
    );
    
    const actualLevel = hasDeepMarkers ? 'CRITICAL' : detectedLevel;

    const summary = `# Reflection Summary - ${new Date().toLocaleDateString()}

## Context
${reflectionData.context}

## Key Analysis
${reflectionData.analysis}

## Reflection Level Achieved
${actualLevel}

${deepTopicsIdentified.length > 0 ? `
## Topics for Future Reflection
These deeper topics emerged during this session and deserve dedicated exploration:
${deepTopicsIdentified.map(t => `- ${t}`).join('\n')}
` : ''}

## Key Insights
${reflectionData.insights.length > 0 ? reflectionData.insights.map(i => `- ${i}`).join('\n') : '_Note: Session ended before insights were fully synthesized. Review the full conversation below._'}

## Action Plan
${reflectionData.actions.length > 0 ? reflectionData.actions.map((a, i) => `
### Action ${i + 1}
- **What:** ${a.what}
- **How:** ${a.how}
- **Success looks like:** ${a.success}
`).join('\n') : '_Note: Session ended before action plan was created. Review insights and create actions._'}

## Session Metrics
- **Duration:** ${elapsedTime} minutes
- **Exchanges:** ${exchangeCount}
- **Level achieved:** ${actualLevel}

## Full Conversation
${conversationHistory.map(msg => `
**${msg.role === 'user' ? 'You' : 'Coach'}:** ${msg.content}
`).join('\n')}

---
Generated by Reflective Practice Coach v2.0
${new Date().toISOString()}

## Next Steps
- [ ] Review this reflection
- [ ] Create specific action items (if not done above)
- [ ] Schedule follow-up reflection if deep topics were identified
- [ ] Review actions next week: ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
`;

    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflection-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStage('welcome');
    setConversationHistory([]);
    setSessionStartTime(null);
    setElapsedTime(0);
    setExchangeCount(0);
    setShowTimeWarning(false);
    setDeepTopicsIdentified([]);
    setReflectionData({
      context: '',
      description: '',
      feelings: '',
      evaluation: '',
      analysis: '',
      insights: [],
      actions: [],
      reflectionLevel: 'technical',
      detectedPatterns: [],
      deepTopicsForFutureReflection: []
    });
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'critical': return 'bg-red-500';
      case 'practical': return 'bg-yellow-500';
      case 'technical': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelLabel = (level) => {
    switch(level) {
      case 'critical': return 'Critical (Deep)';
      case 'practical': return 'Practical (Conceptual)';
      case 'technical': return 'Technical (Descriptive)';
      default: return 'Unknown';
    }
  };

  const getProgressPercentage = () => {
    const stageWeights = {
      context: 15,
      questioning: 60,
      insight: 15,
      action: 10
    };
    
    const baseProgress = {
      context: 0,
      questioning: 15,
      insight: 75,
      action: 90
    };
    
    return baseProgress[stage] || 0;
  };

  if (stage === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-500 rounded-full mb-4">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Reflective Practice Coach
            </h1>
            <p className="text-lg text-gray-600">
              AI-powered coaching conversations to deepen your reflection
            </p>
            <p className="text-sm text-gray-500 mt-2">
              v2.0 - Now with time management and better closure
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Purposeful</h3>
                <p className="text-sm text-gray-600">
                  Move beyond surface-level description to critical questioning
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <MessageCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Conversational</h3>
                <p className="text-sm text-gray-600">
                  Guided dialogue that challenges and supports you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Lightbulb className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Time-Aware</h3>
                <p className="text-sm text-gray-600">
                  Tracks progress and guides you to closure within your timeframe
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <p className="text-sm text-amber-900 mb-3">
              <strong>New in v2.0:</strong>
            </p>
            <ul className="text-sm text-amber-900 space-y-1 ml-4">
              <li>• Session timer with target duration setting</li>
              <li>• Automatic wrap-up suggestions when time is running out</li>
              <li>• Detection of deep topics for future reflection</li>
              <li>• Better closure and action planning</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Session Duration
            </label>
            <div className="flex gap-2">
              {[15, 20, 30, 45].map(duration => (
                <button
                  key={duration}
                  onClick={() => setTargetDuration(duration)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    targetDuration === duration
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleStageTransition('context')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Start Reflection
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const timePercentage = (elapsedTime / targetDuration) * 100;
  const isNearEnd = timePercentage >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reflection in Progress</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className={`text-sm font-medium ${isNearEnd ? 'text-red-600' : 'text-gray-600'}`}>
                      {elapsedTime} / {targetDuration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {exchangeCount} exchanges
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${getLevelColor(reflectionData.reflectionLevel)}`}>
                    {getLevelLabel(reflectionData.reflectionLevel)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {stage === 'questioning' && elapsedTime >= targetDuration * 0.7 && (
                <button
                  onClick={forceWrapUp}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  title="Request wrap-up and move to actions"
                >
                  <AlertCircle className="w-4 h-4" />
                  Wrap Up
                </button>
              )}
              <button
                onClick={generateSummary}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                disabled={conversationHistory.length === 0}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isNearEnd ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
          
          {/* Deep topics indicator */}
          {deepTopicsIdentified.length > 0 && (
            <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-900">
                <strong>Topics for future reflection:</strong> {deepTopicsIdentified.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {['context', 'questioning', 'insight', 'action'].map((s, idx) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => stage !== s && handleStageTransition(s)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    stage === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  disabled={stage === s}
                >
                  {stage === s && <CheckCircle className="w-4 h-4" />}
                  <span className="capitalize">{s}</span>
                </button>
                {idx < 3 && (
                  <div className="flex-1 h-0.5 bg-gray-300 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Time Warning Banner */}
      {showTimeWarning && elapsedTime < targetDuration && (
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="bg-amber-100 border-l-4 border-amber-500 p-3 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>⏰ {targetDuration - elapsedTime} minutes remaining.</strong> Consider wrapping up soon to ensure you have time for insights and actions.
            </p>
          </div>
        </div>
      )}

      {/* Conversation Area */}
      <div className="max-w-4xl mx-auto px-4 pb-32">
        <div className="bg-white rounded-lg shadow-sm p-6 min-h-[500px]">
          {conversationHistory.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <MessageCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="space-y-4">
              {conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.isTransition
                        ? 'bg-purple-100 text-purple-900 border-2 border-purple-300'
                        : msg.isWrapUp
                        ? 'bg-green-100 text-green-900 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Share your thoughts... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={!currentInput.trim() || isProcessing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Your reflections are private. Nothing is stored on external servers beyond this session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReflectivePracticeCoach;
