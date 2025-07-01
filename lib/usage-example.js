import { saveScenario } from './saveScenario.js';

/**
 * Example of how to integrate saveScenario with your React component
 */
export async function handleSaveScenario(scenarioData) {
  try {
    // Transform the React component data to match the expected format
    const transformedData = {
      title: scenarioData.title,
      background: scenarioData.background,
      key_themes: scenarioData.riskThemes, // Note: React uses riskThemes, DB uses key_themes
      assumptions: scenarioData.assumptions,
      injects: scenarioData.injects.map(inject => ({
        time: inject.timeOffset,      // React uses timeOffset, DB uses time
        content: inject.content,
        role: inject.targetRole       // React uses targetRole, DB uses role
      }))
    };

    // Call the save function
    const result = await saveScenario(transformedData);

    if (result.success) {
      console.log('✅ Scenario saved successfully!');
      console.log('Scenario ID:', result.data.scenario.id);
      console.log('Injects count:', result.data.scenario.injects_count);
      
      // You can now redirect, show success message, etc.
      return {
        success: true,
        scenarioId: result.data.scenario.id,
        message: 'Scenario created successfully!'
      };
    } else {
      console.error('❌ Failed to save scenario:', result.error);
      
      // Handle specific error types
      if (result.error.includes('Validation failed')) {
        return {
          success: false,
          message: 'Please check your input and try again.',
          error: result.error
        };
      } else if (result.error.includes('Failed to create scenario')) {
        return {
          success: false,
          message: 'Database error. Please try again.',
          error: result.error
        };
      } else {
        return {
          success: false,
          message: 'An unexpected error occurred.',
          error: result.error
        };
      }
    }
  } catch (error) {
    console.error('Unexpected error in handleSaveScenario:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      error: error.message
    };
  }
}

/**
 * Example React component integration
 */
export function ScenarioCreatorWithSave() {
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

  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);

    try {
      const result = await handleSaveScenario(scenario);
      setSaveResult(result);

      if (result.success) {
        // Clear form or redirect
        setScenario({
          title: '',
          background: '',
          riskThemes: '',
          assumptions: '',
          injects: [{ id: 1, timeOffset: '', content: '', targetRole: '' }]
        });
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: 'An unexpected error occurred.',
        error: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ... rest of your component logic

  return (
    <div>
      {/* Your existing form JSX */}
      
      {/* Save button with loading state */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full bg-blue-600 text-white py-3 px-6 text-lg font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSave}
      >
        {isSaving ? 'Saving...' : 'Save Scenario'}
      </button>

      {/* Result message */}
      {saveResult && (
        <div className={`mt-4 p-4 rounded-md ${
          saveResult.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveResult.message}
        </div>
      )}
    </div>
  );
}

/**
 * Example of how to test the function
 */
export async function testIntegration() {
  const testData = {
    title: "Advanced Persistent Threat Simulation",
    background: "A sophisticated APT campaign targeting financial institutions.",
    riskThemes: "Data exfiltration, lateral movement, privilege escalation",
    assumptions: "Attackers have initial access to perimeter systems",
    injects: [
      {
        id: 1,
        timeOffset: "T+0",
        content: "Detection of suspicious login attempts from unknown IP addresses",
        targetRole: "Security Analyst"
      },
      {
        id: 2,
        timeOffset: "T+15",
        content: "Evidence of lateral movement detected in internal network",
        targetRole: "Incident Commander"
      }
    ]
  };

  console.log('Testing integration...');
  const result = await handleSaveScenario(testData);
  console.log('Integration test result:', result);
  return result;
} 