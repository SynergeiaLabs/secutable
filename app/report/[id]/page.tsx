'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '../../../lib/supabaseClient';
import { parseIRPFile, IRPPhase } from '../../../lib/irpParser';
import { generateAfterActionReport } from '../../../lib/openaiAAR';
import { 
  getInjectTracking, 
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
  time_offset: number;
}

interface ActivatedInject extends Inject {
  activated_at: number;
  handled_at?: number;
  response_time?: number;
  manually_triggered?: boolean;
  phase_assignment?: string;
  performance_status?: 'met' | 'delayed' | 'missed';
  mapped_expectations?: string[];
}

interface PhasePerformance {
  phase: string;
  injects: ActivatedInject[];
  total_injects: number;
  met_expectations: number;
  delayed_responses: number;
  missed_responses: number;
  average_response_time?: number;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ExerciseReport({ params }: PageProps) {
  return (
    <ProtectedRoute>
      <ExerciseReportContent params={params} />
    </ProtectedRoute>
  );
}

function ExerciseReportContent({ params }: PageProps) {
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [activatedInjects, setActivatedInjects] = useState<ActivatedInject[]>([]);
  const [irpPhases, setIrpPhases] = useState<IRPPhase[]>([]);
  const [phasePerformance, setPhasePerformance] = useState<PhasePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAAR, setAiAAR] = useState<string | null>(null);
  const [aiAARLoading, setAiAARLoading] = useState(false);
  const [aiAARError, setAiAARError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);

  useEffect(() => {
    // Handle async params
    params.then((resolvedParams) => {
      setScenarioId(resolvedParams.id);
    });
  }, [params]);

  useEffect(() => {
    if (scenarioId) {
      fetchScenarioData();
    }
  }, [scenarioId]);

  useEffect(() => {
    if (scenario?.irp_url && irpPhases.length === 0) {
      parseIRPDocument();
    }
  }, [scenario?.irp_url]);

  useEffect(() => {
    if (activatedInjects.length > 0 && irpPhases.length > 0) {
      analyzePhasePerformance();
    }
  }, [activatedInjects, irpPhases]);

  useEffect(() => {
    if (phasePerformance.length > 0 && irpPhases.length > 0 && activatedInjects.length > 0) {
      generateAAR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phasePerformance, irpPhases, activatedInjects]);

  const fetchScenarioData = async () => {
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

      // Load inject tracking data from Supabase
      await loadInjectTracking(injectsData || []);

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const loadInjectTracking = async (injectsData: Inject[]) => {
    if (!scenarioId) return;

    try {
      const trackingResult = await getInjectTracking(scenarioId);
      
      if (trackingResult.success && trackingResult.data) {
        // Merge tracking data with injects
        const trackedInjects: ActivatedInject[] = injectsData.map(inject => {
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
      } else {
        // If no tracking data, create empty activated injects
        const emptyActivatedInjects: ActivatedInject[] = injectsData.map(inject => ({
          ...inject,
          activated_at: 0,
          performance_status: 'missed'
        }));
        setActivatedInjects(emptyActivatedInjects);
      }
    } catch (error) {
      console.error('Error loading inject tracking:', error);
      // Fallback to empty activated injects
      const emptyActivatedInjects: ActivatedInject[] = injectsData.map(inject => ({
        ...inject,
        activated_at: 0,
        performance_status: 'missed'
      }));
      setActivatedInjects(emptyActivatedInjects);
    }
  };

  const parseIRPDocument = async () => {
    if (!scenario?.irp_url) {
      return;
    }

    try {
      const analysis = await parseIRPFile(scenario.irp_url);
      if (!analysis.error) {
        setIrpPhases(analysis.phases);
      }
    } catch (error) {
      console.error('Error parsing IRP:', error);
    }
  };

  const classifyInjectPhase = async (inject: ActivatedInject): Promise<string> => {
    // In a real implementation, this would call OpenAI GPT-4
    // For now, we'll use a simple heuristic approach
    
    const content = inject.content.toLowerCase();
    const role = inject.role.toLowerCase();
    
    // Simple phase classification based on keywords
    if (content.includes('detect') || content.includes('alert') || content.includes('identify') || 
        content.includes('monitor') || content.includes('triage')) {
      return 'Identification';
    } else if (content.includes('contain') || content.includes('isolate') || content.includes('block') ||
               content.includes('quarantine') || content.includes('prevent')) {
      return 'Containment';
    } else if (content.includes('remove') || content.includes('eradicate') || content.includes('clean') ||
               content.includes('patch') || content.includes('fix')) {
      return 'Eradication';
    } else if (content.includes('restore') || content.includes('recover') || content.includes('rebuild') ||
               content.includes('backup') || content.includes('restart')) {
      return 'Recovery';
    } else if (content.includes('review') || content.includes('learn') || content.includes('document') ||
               content.includes('improve') || content.includes('update')) {
      return 'Lessons Learned';
    } else {
      return 'Response'; // Default phase
    }
  };

  const mapToExpectations = (inject: ActivatedInject, phase: string): string[] => {
    const irpPhase = irpPhases.find(p => p.name.toLowerCase().includes(phase.toLowerCase()));
    if (!irpPhase) return [];
    
    // Simple mapping based on content similarity
    const content = inject.content.toLowerCase();
    return irpPhase.actions.filter(action => 
      content.includes(action.toLowerCase().split(' ')[0]) || // First word match
      content.includes(action.toLowerCase().split(' ').slice(-1)[0]) // Last word match
    ).slice(0, 2); // Limit to 2 expectations
  };

  const evaluatePerformance = (inject: ActivatedInject): 'met' | 'delayed' | 'missed' => {
    if (!inject.handled_at) {
      return 'missed';
    }
    
    const responseTimeMinutes = (inject.response_time || 0) / 60;
    if (responseTimeMinutes <= 2) {
      return 'met';
    } else {
      return 'delayed';
    }
  };

  const analyzePhasePerformance = async () => {
    setIsAnalyzing(true);
    
    try {
      const analyzedInjects: ActivatedInject[] = [];
      
      // Analyze each inject
      for (const inject of activatedInjects) {
        const phase = await classifyInjectPhase(inject);
        const expectations = mapToExpectations(inject, phase);
        const performance = evaluatePerformance(inject);
        
        analyzedInjects.push({
          ...inject,
          phase_assignment: phase,
          mapped_expectations: expectations,
          performance_status: performance
        });
      }
      
      setActivatedInjects(analyzedInjects);
      
      // Group by phase and calculate performance metrics
      const phaseMap = new Map<string, ActivatedInject[]>();
      
      analyzedInjects.forEach(inject => {
        const phase = inject.phase_assignment || 'Unknown';
        if (!phaseMap.has(phase)) {
          phaseMap.set(phase, []);
        }
        phaseMap.get(phase)!.push(inject);
      });
      
      const performanceData: PhasePerformance[] = Array.from(phaseMap.entries()).map(([phase, injects]) => {
        const met = injects.filter(i => i.performance_status === 'met').length;
        const delayed = injects.filter(i => i.performance_status === 'delayed').length;
        const missed = injects.filter(i => i.performance_status === 'missed').length;
        
        const responseTimes = injects
          .filter(i => i.response_time)
          .map(i => i.response_time!);
        
        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : undefined;
        
        return {
          phase,
          injects,
          total_injects: injects.length,
          met_expectations: met,
          delayed_responses: delayed,
          missed_responses: missed,
          average_response_time: avgResponseTime
        };
      });
      
      setPhasePerformance(performanceData);
      
    } catch (error) {
      console.error('Error analyzing performance:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadge = (status: 'met' | 'delayed' | 'missed') => {
    const config = {
      met: { color: 'bg-green-100 text-green-800 border-green-200', icon: '✅', text: 'Met Expectation' },
      delayed: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚠️', text: 'Delayed' },
      missed: { color: 'bg-red-100 text-red-800 border-red-200', icon: '❌', text: 'Missed' }
    };
    
    const config_item = config[status];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config_item.color}`}>
        <span className="mr-1">{config_item.icon}</span>
        {config_item.text}
      </span>
    );
  };

  const generateAAR = async () => {
    setAiAARLoading(true);
    setAiAARError(null);
    try {
      const gptResult = await generateAfterActionReport({
        irpPhases: irpPhases.map(p => ({ name: p.name, actions: p.actions })),
        injects: activatedInjects.map(i => ({
          content: i.content,
          phase_assignment: i.phase_assignment || '',
          activated_at: i.activated_at,
          handled_at: i.handled_at,
          response_time: i.response_time,
          performance_status: i.performance_status || 'missed',
        })),
      });
      setAiAAR(gptResult);
    } catch (err: any) {
      setAiAARError('Failed to generate AI After Action Report.');
    } finally {
      setAiAARLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Loading Exercise Report...</h1>
            <p className="text-gray-600">Please wait while we analyze the performance data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-800 mb-2">Report Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested report could not be found.'}</p>
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
      <div className="max-w-6xl mx-auto">
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
              Exercise Report
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              {scenario.title}
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-semibold">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance Analysis Complete
            </div>
          </div>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Performance...</h2>
              <p className="text-gray-600">Mapping injects to IRP phases and evaluating responses</p>
            </div>
          </div>
        )}

        {/* Phase-Based Performance */}
        {phasePerformance.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white font-semibold text-sm">📊</span>
                </div>
                Phase-Based Performance
              </h2>
              
              <div className="space-y-8">
                {phasePerformance.map((phaseData, index) => (
                  <div key={phaseData.phase} className="border border-gray-200 rounded-2xl overflow-hidden">
                    {/* Phase Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-white font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{phaseData.phase}</h3>
                            <p className="text-sm text-gray-600">
                              {phaseData.total_injects} inject{phaseData.total_injects !== 1 ? 's' : ''} • 
                              {phaseData.average_response_time && (
                                <span> Avg: {formatResponseTime(phaseData.average_response_time)}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Performance Summary */}
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{phaseData.met_expectations}</div>
                            <div className="text-xs text-gray-500">Met</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{phaseData.delayed_responses}</div>
                            <div className="text-xs text-gray-500">Delayed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{phaseData.missed_responses}</div>
                            <div className="text-xs text-gray-500">Missed</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Injects List */}
                    <div className="divide-y divide-gray-100">
                      {phaseData.injects.map((inject) => (
                        <div key={inject.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="text-sm font-semibold text-gray-500 mr-3">
                                  T+{inject.time_offset}m
                                </span>
                                <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                  {inject.role}
                                </span>
                                {inject.manually_triggered && (
                                  <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2">
                                    Manual
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-gray-700 leading-relaxed mb-3">{inject.content}</p>
                              
                              {/* Inject Comments - Read Only */}
                              <InjectComments injectId={inject.id} readOnly={true} />
                              
                              {/* Mapped Expectations */}
                              {inject.mapped_expectations && inject.mapped_expectations.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Maps to IRP Expectations:</h4>
                                  <ul className="space-y-1">
                                    {inject.mapped_expectations.map((expectation, expIndex) => (
                                      <li key={expIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <span>{expectation}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-6 flex flex-col items-end space-y-2">
                              {getStatusBadge(inject.performance_status || 'missed')}
                              
                              {inject.response_time && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold">Response:</span> {formatResponseTime(inject.response_time)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Overall Performance Summary */}
        {phasePerformance.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white font-semibold text-sm">📈</span>
                </div>
                Overall Performance Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-800">Met Expectations</h3>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {phasePerformance.reduce((sum, phase) => sum + phase.met_expectations, 0)}
                      </span>
                    </div>
                  </div>
                  <p className="text-green-700 text-sm">
                    Injects handled within 2 minutes
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-yellow-800">Delayed Responses</h3>
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {phasePerformance.reduce((sum, phase) => sum + phase.delayed_responses, 0)}
                      </span>
                    </div>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Injects handled after 2 minutes
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-red-800">Missed Responses</h3>
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {phasePerformance.reduce((sum, phase) => sum + phase.missed_responses, 0)}
                      </span>
                    </div>
                  </div>
                  <p className="text-red-700 text-sm">
                    Injects not handled
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI After Action Report */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-white font-semibold text-sm">🧠</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI After Action Report
              </h2>
            </div>
            {aiAARLoading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating After Action Report...</h3>
                <p className="text-gray-600">AI is analyzing scenario performance and IRP coverage</p>
              </div>
            )}
            {aiAARError && (
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-1">Error Generating Report</h3>
                    <p className="text-red-700">{aiAARError}</p>
                  </div>
                </div>
              </div>
            )}
            {aiAAR && !aiAARLoading && !aiAARError && (
              <div className="prose max-w-none prose-blue prose-lg">
                <div dangerouslySetInnerHTML={{ __html: aiAAR.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/scenarios/${scenarioId}`}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Exercise Control Panel
          </Link>
          
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-2xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
} 