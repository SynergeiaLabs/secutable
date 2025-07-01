'use client';

import { useState } from 'react';
import { IRPPhase } from '../../lib/irpParser';

interface IRPPhaseExpectationsProps {
  phases: IRPPhase[];
  isLoading?: boolean;
  error?: string;
}

export default function IRPPhaseExpectations({ phases, isLoading, error }: IRPPhaseExpectationsProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phaseName: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseName)) {
      newExpanded.delete(phaseName);
    } else {
      newExpanded.add(phaseName);
    }
    setExpandedPhases(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-sm">📘</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              IRP Phase Expectations
            </h2>
          </div>
          
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Parsing IRP Document...</h3>
            <p className="text-gray-600">Extracting phase expectations from uploaded file</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-sm">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              IRP Phase Expectations
            </h2>
          </div>
          
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-1">Error Parsing IRP</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mr-4">
              <span className="text-white font-semibold text-sm">📘</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              IRP Phase Expectations
            </h2>
          </div>
          
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No IRP Document Available</h3>
            <p className="text-gray-600">Upload an IRP document to see phase expectations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
            <span className="text-white font-semibold text-sm">📘</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            IRP Phase Expectations (Parsed from Uploaded File)
          </h2>
        </div>
        
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.name}
              className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <button
                onClick={() => togglePhase(phase.name)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {phase.name}
                  </h3>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {phase.actions.length} action{phase.actions.length !== 1 ? 's' : ''}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      expandedPhases.has(phase.name) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {expandedPhases.has(phase.name) && (
                <div className="px-6 pb-4 border-t border-gray-200">
                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Expected Actions:</h4>
                    <ul className="space-y-2">
                      {phase.actions.map((action, actionIndex) => (
                        <li
                          key={actionIndex}
                          className="flex items-start space-x-3 text-gray-700"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm leading-relaxed">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700 font-medium">
              These expectations will be compared against actual team responses during the exercise
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 