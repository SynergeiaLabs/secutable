import React, { useState } from 'react';

const ScenarioCreator = () => {
  const [scenario, setScenario] = useState({
    title: '',
    background: '',
    riskThemes: '',
    assumptions: '',
    injects: [
      {
        id: 1,
        timeOffset: '',
        content: '',
        targetRole: ''
      }
    ]
  });

  const handleInputChange = (field, value) => {
    setScenario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInjectChange = (id, field, value) => {
    setScenario(prev => ({
      ...prev,
      injects: prev.injects.map(inject =>
        inject.id === id ? { ...inject, [field]: value } : inject
      )
    }));
  };

  const addInject = () => {
    const newId = Math.max(...scenario.injects.map(inject => inject.id)) + 1;
    setScenario(prev => ({
      ...prev,
      injects: [...prev.injects, {
        id: newId,
        timeOffset: '',
        content: '',
        targetRole: ''
      }]
    }));
  };

  const removeInject = (id) => {
    if (scenario.injects.length > 1) {
      setScenario(prev => ({
        ...prev,
        injects: prev.injects.filter(inject => inject.id !== id)
      }));
    }
  };

  const handleSave = () => {
    console.log('Saving scenario:', scenario);
    // Placeholder for save logic
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Tabletop Exercise
          </h1>
          <p className="text-gray-600">
            Design a comprehensive scenario to test your organization's incident response capabilities.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            
            {/* Scenario Title Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Scenario Details
              </h2>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={scenario.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter a descriptive title for your scenario"
                  required
                />
              </div>
            </div>

            {/* Background Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Background
              </h2>
              <div>
                <label htmlFor="background" className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario Background *
                </label>
                <textarea
                  id="background"
                  value={scenario.background}
                  onChange={(e) => handleInputChange('background', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                  placeholder="Describe the initial situation and context for the exercise..."
                  required
                />
              </div>
            </div>

            {/* Risk Themes Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Key Risk Themes to Explore
              </h2>
              <div>
                <label htmlFor="riskThemes" className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Themes *
                </label>
                <textarea
                  id="riskThemes"
                  value={scenario.riskThemes}
                  onChange={(e) => handleInputChange('riskThemes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                  placeholder="List the key cybersecurity risks and themes this exercise will address..."
                  required
                />
              </div>
            </div>

            {/* Assumptions Section */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assumptions
              </h2>
              <div>
                <label htmlFor="assumptions" className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise Assumptions
                </label>
                <textarea
                  id="assumptions"
                  value={scenario.assumptions}
                  onChange={(e) => handleInputChange('assumptions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                  placeholder="Define any assumptions or ground rules for the exercise..."
                />
              </div>
            </div>

            {/* Inject Timeline Section */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Inject Timeline
                </h2>
                <button
                  type="button"
                  onClick={addInject}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Inject
                </button>
              </div>

              <div className="space-y-4">
                {scenario.injects.map((inject, index) => (
                  <div key={inject.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Inject {index + 1}
                      </h3>
                      {scenario.injects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInject(inject.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Offset
                        </label>
                        <input
                          type="text"
                          value={inject.timeOffset}
                          onChange={(e) => handleInjectChange(inject.id, 'timeOffset', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., T+5, T+15"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Target Role
                        </label>
                        <input
                          type="text"
                          value={inject.targetRole}
                          onChange={(e) => handleInjectChange(inject.id, 'targetRole', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., Incident Commander"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inject Content
                      </label>
                      <textarea
                        value={inject.content}
                        onChange={(e) => handleInjectChange(inject.id, 'content', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                        placeholder="Describe the inject details and expected response..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 text-lg font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
              >
                Save Scenario
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScenarioCreator; 