import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { FiArrowLeft, FiAward } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PracticeSession from '../components/PracticeSession';
import SegmentedControl from '../components/SegmentedControl';
import '../styles/Practice.css'; // Reusing practice styles
import { API_BASE_URL } from '../config';

import useVoices from '../hooks/useVoices';

const TopicPractice = () => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionResults, setSessionResults] = useState(null);
  const [topicMode, setTopicMode] = useState('system'); // 'system' or 'custom'
  const [customTopic, setCustomTopic] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Loading state for AI analysis
  
  const { voices, selectedVoice, setSelectedVoice } = useVoices();

  const fetchQuestion = async () => {
    setLoading(true);
    setSessionResults(null); // Clear previous results
    setSessionKey(prev => prev + 1); // Force remount for fresh state
    try {
      const response = await fetch(`${API_BASE_URL}/api/practice/questions/topic`);
      const data = await response.json();
      setQuestion(data);
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to load topic. Using offline fallback.');
      setQuestion({ id: 999, text: "Describe your favorite hobby and why you enjoy it." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topicMode === 'system') {
      fetchQuestion();
    }
  }, [topicMode]);

  const handleSessionComplete = async (data) => {
    setIsAnalyzing(true); // Show loading state
    try {
      // Calculate additional metrics
      const wordCount = data.transcript.trim().split(/\s+/).length;
      const wpm = Math.round(wordCount / (data.duration / 60)) || 0;

      const response = await fetch(`${API_BASE_URL}/api/practice/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Send token
        },
        body: JSON.stringify({ 
          ...data, 
          type: 'topic',
          wordCount,
          wpm
        }),
      });
      const results = await response.json();
      setSessionResults(results);
      
      // Save to local storage for dashboard
      const history = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
      history.unshift({
        id: Date.now(),
        type: 'Topic Practice',
        topic: data.question.text,
        score: results.overallScore,
        date: new Date().toISOString()
      });
      localStorage.setItem('practiceHistory', JSON.stringify(history));
      
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (error) {
      console.error('Error submitting session:', error);
      toast.error('Failed to submit session.');
    } finally {
      setIsAnalyzing(false); // Hide loading state
    }
  };

  const [sessionKey, setSessionKey] = useState(0); // Key to force remount of PracticeSession

  const startNewSession = () => {
    setSessionResults(null);
    setSessionKey(prev => prev + 1); // Force remount to clear transcript
    if (topicMode === 'system') {
      fetchQuestion();
    } else {
      setCustomTopic('');
      setQuestion(null); // Clear question for custom mode
    }
  };

  const handleStartCustomPractice = () => {
    if (!customTopic.trim()) {
      toast.error('Please enter a topic to practice');
      return;
    }
    setQuestion({ id: Date.now(), text: customTopic });
    setLoading(false);
    setSessionKey(prev => prev + 1); // Ensure fresh session for custom topic
  };

  if (loading && !question) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2>Loading Topic...</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '80px' }}>
      {/* Practice Section - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <FiArrowLeft /> Back
            </Link>
            <h1 className="gradient-text" style={{ margin: 0, fontSize: '1.8rem' }}>Topic Practice</h1>
          </div>
          
          {/* Voice Selector - Opposite to Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>AI Voice:</span>
            <select 
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = voices.find(v => v.name === e.target.value);
                setSelectedVoice(voice);
              }}
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: '20px',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                backdropFilter: 'blur(10px)'
              }}
            >
              {voices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name.replace('Google', '').replace('English', '').trim()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Topic Mode Toggle */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <SegmentedControl
            options={[
              { value: 'system', label: '🤖 AI Generated' },
              { value: 'custom', label: '✏️ Custom Topic' }
            ]}
            value={topicMode}
            onChange={(val) => {
              setTopicMode(val);
              setQuestion(null);
              setCustomTopic('');
              setSessionResults(null); 
            }}
          />
        </div>

        {/* Custom Topic Input */}
        {topicMode === 'custom' && !question && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: '600px',
              margin: '0 auto 30px',
              padding: '30px',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)'
            }}
          >
            <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>What would you like to talk about?</h3>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Enter your topic here... (e.g., 'My experience learning a new language' or 'The impact of technology on society')"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '15px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '15px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleStartCustomPractice();
                }
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={handleStartCustomPractice}
                className="neon-button"
                disabled={!customTopic.trim()}
                style={{ opacity: customTopic.trim() ? 1 : 0.5 }}
              >
                Start Practice
              </button>
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Tip: Press Ctrl+Enter to start
              </p>
            </div>
          </motion.div>
        )}
        
        {question && (
          <PracticeSession 
            key={sessionKey}
            practiceType="topic"
            question={question}
            onNewQuestion={topicMode === 'system' ? fetchQuestion : null}
            onSessionComplete={handleSessionComplete}
            externalVoice={selectedVoice}
            isAnalyzing={isAnalyzing}
          />
        )}
      </motion.div>

      {/* Results Section - Appears Below When Available */}
      {sessionResults && (
        <motion.div
          id="results-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid var(--border-color)' }}
        >
          <div className="results-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <FiAward style={{ fontSize: '4rem', color: 'var(--accent-primary)', marginBottom: '20px' }} />
              <h2 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Session Complete!</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Here's how you performed on this topic.</p>
            </div>

            {/* Main Score & Fluency Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '40px' }}>
              {/* Overall Score */}
              <div className="score-card" style={{ background: 'rgba(0, 212, 255, 0.1)', padding: '20px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ color: 'var(--accent-primary)', fontSize: '3.5rem', fontWeight: '800', margin: 0 }}>{sessionResults.overallScore}</h3>
                <p style={{ fontSize: '1rem', opacity: 0.8 }}>Overall Score</p>
              </div>

              {/* Answer Relevance - NEW */}
              {sessionResults.answerRelevance !== undefined && sessionResults.answerRelevance !== null && (
                <div className="score-card" style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ color: 'var(--success)', fontSize: '3.5rem', fontWeight: '800', margin: 0 }}>{sessionResults.answerRelevance}%</h3>
                  <p style={{ fontSize: '1rem', opacity: 0.8 }}>Answer Relevance</p>
                </div>
              )}
              
              {/* Fluency Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {sessionResults.fluencyBreakdown && Object.entries(sessionResults.fluencyBreakdown).map(([key, value]) => (
                  <div key={key} className="stat-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                    <h4 style={{ textTransform: 'capitalize', marginBottom: '5px', fontSize: '0.8rem', opacity: 0.8 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <div className="progress-bar" style={{ height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ 
                        width: `${value}%`, 
                        height: '100%', 
                        borderRadius: '4px',
                        background: value > 80 ? 'var(--success)' : value > 60 ? 'var(--warning)' : 'var(--error)' 
                      }}></div>
                    </div>
                    <span style={{ display: 'block', textAlign: 'right', marginTop: '2px', fontWeight: 'bold', fontSize: '0.9rem' }}>{value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Feedback - NEW */}
            {sessionResults.topicFeedback && sessionResults.topicFeedback !== 'null' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '30px', borderLeft: '4px solid var(--success)' }}>
                <h3 style={{ color: 'var(--success)', marginBottom: '10px' }}>📝 Topic Analysis</h3>
                <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  <ReactMarkdown>{sessionResults.topicFeedback}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Grammar Errors */}
            {sessionResults.grammarErrors && sessionResults.grammarErrors.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>Grammar Corrections</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {sessionResults.grammarErrors.map((error, idx) => (
                    <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid var(--error)' }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ color: 'var(--error)', textDecoration: 'line-through', opacity: 0.7 }}>{error.original}</span>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>→ {error.corrected}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>{error.rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pronunciation & Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div>
                <h3 style={{ marginBottom: '15px', color: 'var(--accent-primary)' }}>Pronunciation Tips</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {sessionResults.pronunciationTips?.map((tip, i) => (
                    <li key={i} style={{ marginBottom: '10px', paddingLeft: '20px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--accent-primary)' }}>•</span>
                      <ReactMarkdown>{tip}</ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ marginBottom: '15px', color: 'var(--success)' }}>Strengths</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {sessionResults.strengths?.map((strength, i) => (
                    <li key={i} style={{ marginBottom: '10px', paddingLeft: '20px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--success)' }}>✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Overall Feedback */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '30px' }}>
              <h3>Coach's Feedback</h3>
              <div style={{ marginTop: '10px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                <ReactMarkdown>{sessionResults.overallFeedback}</ReactMarkdown>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button onClick={startNewSession} className="neon-button">Start New Session</button>
              <Link to="/dashboard" className="neon-button-outline">Go to Dashboard</Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TopicPractice;
