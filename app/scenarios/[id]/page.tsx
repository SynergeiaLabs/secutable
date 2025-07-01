'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '../../../lib/supabaseClient';
import { parseIRPFile, IRPPhase } from '../../../lib/irpParser';
import IRPPhaseExpectations from '../../components/IRPPhaseExpectations';
import { 
  activateInject, 
  handleInject, 
  getInjectTracking, 
  resetInjectTracking,
  calculatePerformanceStatus,
  formatResponseTime,
  InjectTracking 
} from '../../../lib/injectTracking';
import InjectComments from '@/components/InjectComments';

interface Scenario {
  id: string;
  title: string;
  background: string;
  key_themes: string;
  assumptions: string | null;
  irp_url: string | null;
  created_at: string;
}

interface Inject {
  id: string;
  content: string;
  role: string;
  time_offset: number; // in minutes
}

interface ActivatedInject extends Inject {
  activated_at: number; // timestamp when shown
  handled_at?: number; // timestamp when marked as handled
  response_time?: number; // seconds between activated_at and handled_at
  manually_triggered?: boolean;
  performance_status?: 'met' | 'delayed' | 'missed';
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExerciseControlPanel({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <ExerciseControlPanelContent params={params} />
    </ProtectedRoute>
  );
}

function ExerciseControlPanelContent({ params }: PageProps) {
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exercise state
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseDuration, setExerciseDuration] = useState(30); // minutes
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [activatedInjects, setActivatedInjects] = useState<ActivatedInject[]>([]);
  const [showScenarioInfo, setShowScenarioInfo] = useState(true);
  
  // IRP parsing state
  const [irpPhases, setIrpPhases] = useState<IRPPhase[]>([]);
  const [isParsingIRP, setIsParsingIRP] = useState(false);
  const [irpError, setIrpError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Handle async params
    params.then((resolvedParams) => {
      setScenarioId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (scenarioId) {
      fetchScenario();
    }
  }, [scenarioId]);

  useEffect(() => {
    if (exerciseStarted) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => stopTimer();
  }, [exerciseStarted]);

  useEffect(() => {
    // Check for injects that should be activated based on elapsed time
    if (exerciseStarted && elapsedTime > 0) {
      const elapsedMinutes = elapsedTime / 60;
      const shouldActivate = injects.filter(
        inject => 
          !activatedInjects.find(activated => activated.id === inject.id) &&
          inject.time_offset <= elapsedMinutes
      );

      if (shouldActivate.length > 0) {
        shouldActivate.forEach(inject => {
          triggerInject(inject, false); // false = automatic trigger
        });
      }
    }
  }, [elapsedTime, exerciseStarted, injects, activatedInjects]);

  const fetchScenario = async () => {
    if (!scenarioId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch scenario
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) {
        console.error('Error fetching scenario:', scenarioError);
        setError('Failed to load scenario. Please try again.');
        return;
      }

      setScenario(scenarioData);

      // Fetch injects
      const { data: injectsData, error: injectsError } = await supabase
        .from('injects')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('time_offset');

      if (injectsError) {
        console.error('Error fetching injects:', injectsError);
        setError('Failed to load scenario injects.');
        return;
      }

      setInjects(injectsData || []);

      // Load existing inject tracking data
      await loadInjectTracking();

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const loadInjectTracking = async () => {
    if (!scenarioId) return;

    try {
      const trackingResult = await getInjectTracking(scenarioId);
      
      if (trackingResult.success && trackingResult.data) {
        // Merge tracking data with injects
        const trackedInjects: ActivatedInject[] = injects.map(inject => {
          const tracking = trackingResult.data!.find(t => t.id === inject.id);
          return {
            ...inject,
            activated_at: tracking?.activated_at ? new Date(tracking.activated_at).getTime() : 0,
            handled_at: tracking?.handled_at ? new Date(tracking.handled_at).getTime() : undefined,
            response_time: tracking?.response_time || undefined,
            manually_triggered: false, // We don't store this, so default to false
            performance_status: calculatePerformanceStatus(tracking?.response_time || null)
          };
        });

        setActivatedInjects(trackedInjects);
      }
    } catch (error) {
      console.error('Error loading inject tracking:', error);
    }
  };

  const parseIRPDocument = async () => {
    if (!scenario?.irp_url) {
      setIrpError('No IRP document available for this scenario');
      return;
    }

    try {
      setIsParsingIRP(true);
      setIrpError(null);

      const analysis = await parseIRPFile(scenario.irp_url);
      
      if (analysis.error) {
        setIrpError(analysis.error);
        return;
      }

      setIrpPhases(analysis.phases);
    } catch (error) {
      console.error('Error parsing IRP:', error);
      setIrpError('Failed to parse IRP document. Please try again.');
    } finally {
      setIsParsingIRP(false);
    }
  };

  // Parse IRP when scenario loads and has an IRP URL
  useEffect(() => {
    if (scenario?.irp_url && irpPhases.length === 0 && !isParsingIRP) {
      parseIRPDocument();
    }
  }, [scenario?.irp_url]);

  const startTimer = () => {
    startTimeRef.current = Date.now() - (elapsedTime * 1000);
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(newElapsed);
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startExercise = async () => {
    setExerciseStarted(true);
    setElapsedTime(0);
    
    // Reset inject tracking when starting new exercise
    if (scenarioId) {
      await resetInjectTracking(scenarioId);
      setActivatedInjects([]);
    }
    
    setShowScenarioInfo(false);
  };

  const pauseExercise = () => {
    setExerciseStarted(false);
  };

  const resetExercise = async () => {
    setExerciseStarted(false);
    setElapsedTime(0);
    
    // Reset inject tracking
    if (scenarioId) {
      await resetInjectTracking(scenarioId);
      setActivatedInjects([]);
    }
    
    setShowScenarioInfo(true);
  };

  const extendTime = () => {
    setExerciseDuration(prev => prev + 5);
  };

  const triggerInject = async (inject: Inject, isManual: boolean = true) => {
    if (activatedInjects.find(activated => activated.id === inject.id)) {
      return; // Already activated
    }

    try {
      const result = await activateInject(inject.id);
      
      if (result.success) {
        const now = Date.now();
        const newActivated: ActivatedInject = {
          ...inject,
          activated_at: now,
          manually_triggered: isManual,
          performance_status: 'missed' // Will be updated when handled
        };
        
        setActivatedInjects(prev => [...prev, newActivated]);
      } else {
        console.error('Failed to activate inject:', result.error);
      }
    } catch (error) {
      console.error('Error triggering inject:', error);
    }
  };

  const markAsHandled = async (injectId: string) => {
    try {
      const result = await handleInject(injectId);
      
      if (result.success) {
        setActivatedInjects(prev => 
          prev.map(inject => {
            if (inject.id === injectId) {
              const now = Date.now();
              return {
                ...inject,
                handled_at: now,
                response_time: result.responseTime || 0,
                performance_status: calculatePerformanceStatus(result.responseTime || null)
              };
            }
            return inject;
          })
        );
      } else {
        console.error('Failed to handle inject:', result.error);
      }
    } catch (error) {
      console.error('Error handling inject:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `T+${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeSinceActivation = (activatedAt: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - activatedAt) / 1000);
    return formatResponseTime(seconds);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Loading Exercise Control Panel...</h1>
            <p className="text-gray-600">Please wait while we prepare your scenario.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-800 mb-2">Scenario Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested scenario could not be found.'}</p>
            <Link
              href="/scenarios"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Scenarios
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/scenarios"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Scenarios
          </Link>
          
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-blue-800 mb-2">
              {scenario.title}
            </h1>
            <p className="text-lg text-gray-600">
              Exercise Control Panel
            </p>
          </div>
        </div>

        {/* Exercise Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-8">
            {!exerciseStarted ? (
              /* Pre-Exercise Setup */
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to Start Exercise?</h2>
                
                <div className="max-w-md mx-auto mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exercise Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={exerciseDuration}
                    onChange={(e) => setExerciseDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={startExercise}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-semibold rounded-2xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Exercise
                  </button>
                  
                  <button
                    onClick={() => setShowScenarioInfo(!showScenarioInfo)}
                    className="inline-flex items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {showScenarioInfo ? 'Hide' : 'Show'} Scenario Info
                  </button>
                </div>
              </div>
            ) : (
              /* Active Exercise Controls */
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-6xl font-bold text-blue-800 mb-4 font-mono">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-lg text-gray-600 mb-6">
                    Duration: {exerciseDuration} minutes | 
                    Remaining: {Math.max(0, (exerciseDuration * 60) - elapsedTime)} seconds
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={pauseExercise}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold rounded-2xl hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pause
                    </button>
                    
                    <button
                      onClick={extendTime}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      + Add 5 Minutes
                    </button>
                    
                    <button
                      onClick={resetExercise}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-2xl hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* IRP Phase Expectations */}
        <IRPPhaseExpectations 
          phases={irpPhases}
          isLoading={isParsingIRP}
          error={irpError || undefined}
        />

        {/* Scenario Information (Collapsible) */}
        {showScenarioInfo && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-semibold text-sm">ℹ</span>
                </div>
                Scenario Information
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Background</h3>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 leading-relaxed">{scenario.background}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Risk Themes</h3>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 leading-relaxed">{scenario.key_themes}</p>
                  </div>
                </div>
              </div>
              
              {scenario.assumptions && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assumptions</h3>
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-gray-700 leading-relaxed">{scenario.assumptions}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inject Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">⚡</span>
              </div>
              Inject Management ({injects.length} total)
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {injects.map((inject) => {
                const isActivated = activatedInjects.find(activated => activated.id === inject.id);
                const isHandled = isActivated?.handled_at;
                const isOverdue = exerciseStarted && (elapsedTime / 60) >= inject.time_offset && !isActivated;
                
                return (
                  <div
                    key={inject.id}
                    className={`rounded-2xl p-6 border-2 transition-all duration-200 ${
                      isActivated
                        ? isHandled
                          ? 'bg-green-50 border-green-200'
                          : 'bg-blue-50 border-blue-200'
                        : isOverdue
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                          isActivated
                            ? isHandled
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : isOverdue
                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          <span className="text-white font-semibold text-sm">
                            {isActivated ? (isHandled ? '✓' : '!') : '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            T+{inject.time_offset} minutes
                          </h3>
                          <p className="text-sm text-gray-600">
                            Target: {inject.role}
                          </p>
                        </div>
                      </div>
                      
                      {!isActivated && (
                        <button
                          onClick={() => triggerInject(inject, true)}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Trigger Now
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                      <p className="text-gray-700 leading-relaxed">{inject.content}</p>
                    </div>
                    
                    {/* Inject Comments */}
                    <InjectComments injectId={inject.id} />
                    
                    {isActivated && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Activated:</span> {formatTimestamp(isActivated.activated_at)}
                            {isActivated.manually_triggered && (
                              <span className="ml-2 text-blue-600 font-semibold">(Manual)</span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-blue-600">
                            T+{formatResponseTime(Math.floor((isActivated.activated_at - (startTimeRef.current || Date.now())) / 1000))} Activated
                          </div>
                        </div>
                        
                        {isHandled ? (
                          <div className="bg-green-100 rounded-xl p-3 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-green-700 font-semibold">
                                ✓ Handled at {formatTimestamp(isHandled)}
                              </div>
                              <div className="text-sm font-bold text-green-800">
                                Response: {formatResponseTime(isActivated.response_time || 0)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-100 rounded-xl p-3 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-blue-700">
                                <span className="font-semibold">Active for:</span> {getTimeSinceActivation(isActivated.activated_at)}
                              </div>
                              <button
                                onClick={() => markAsHandled(inject.id)}
                                className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Mark as Handled
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Activity Log */}
        {exerciseStarted && activatedInjects.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-semibold text-sm">📋</span>
                </div>
                Live Activity Log ({activatedInjects.length} events)
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activatedInjects
                  .sort((a, b) => b.activated_at - a.activated_at)
                  .map((inject, index) => (
                    <div
                      key={`${inject.id}-${index}`}
                      className={`flex items-start space-x-4 p-4 rounded-2xl border-l-4 ${
                        inject.handled_at
                          ? 'bg-green-50 border-green-400'
                          : 'bg-blue-50 border-blue-400'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        inject.handled_at
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}>
                        <span className="text-white font-semibold text-sm">
                          {inject.handled_at ? '✓' : '!'}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {inject.role} - T+{inject.time_offset} minutes
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(inject.activated_at)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{inject.content}</p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          {inject.manually_triggered && (
                            <span className="text-blue-600 font-semibold">Manual Trigger</span>
                          )}
                          {inject.handled_at ? (
                            <span className="text-green-600 font-semibold">
                              Handled after {formatResponseTime(inject.response_time || 0)}
                            </span>
                          ) : (
                            <span className="text-blue-600 font-semibold">
                              Active for {getTimeSinceActivation(inject.activated_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 