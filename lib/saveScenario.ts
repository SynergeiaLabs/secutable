import { supabase } from './supabaseClient';

export interface ScenarioData {
  title: string;
  description?: string;
  background: string;
  key_themes: string;
  assumptions?: string;
  irp_url?: string;
  injects: {
    time: string;
    content: string;
    role: string;
  }[];
}

export interface SaveResult {
  success: boolean;
  error: string | null;
  data: {
    scenario: {
      id: string;
      title: string;
      background: string;
      key_themes: string;
      assumptions: string | null;
      created_at: string;
      injects_count: number;
    };
    injects: {
      id: string;
      time_offset: string;
      content: string;
      target_role: string;
    }[];
  } | null;
}

/**
 * Saves a new cybersecurity tabletop exercise scenario to Supabase
 * @param scenarioData - The scenario data object
 * @returns Promise<SaveResult> - Result object with success status, data, and any errors
 */
export async function saveScenario(scenarioData: ScenarioData): Promise<SaveResult> {
  // Input validation
  const validationResult = validateScenarioData(scenarioData);
  if (!validationResult.isValid) {
    return {
      success: false,
      error: `Validation failed: ${validationResult.error}`,
      data: null
    };
  }

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated',
        data: null
      };
    }

    // Start transaction by inserting the scenario first
    const { data: scenario, error: scenarioError } = await supabase
      .from('scenarios')
      .insert({
        title: scenarioData.title.trim(),
        description: scenarioData.description?.trim() || null,
        background: scenarioData.background.trim(),
        key_themes: scenarioData.key_themes.trim(),
        assumptions: scenarioData.assumptions?.trim() || null,
        irp_url: scenarioData.irp_url,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (scenarioError) {
      console.error('Error inserting scenario:', scenarioError);
      return {
        success: false,
        error: `Failed to create scenario: ${scenarioError.message}`,
        data: null
      };
    }

    // Prepare injects data with scenario_id and user_id
    const injectsData = scenarioData.injects.map(inject => ({
      scenario_id: scenario.id,
      user_id: user.id,
      time_offset: inject.time.trim(),
      content: inject.content.trim(),
      target_role: inject.role.trim(),
      created_at: new Date().toISOString()
    }));

    // Insert all injects
    const { data: injects, error: injectsError } = await supabase
      .from('injects')
      .insert(injectsData)
      .select();

    if (injectsError) {
      console.error('Error inserting injects:', injectsError);
      
      // Attempt to rollback scenario creation if injects fail
      try {
        await supabase
          .from('scenarios')
          .delete()
          .eq('id', scenario.id);
        
        console.log('Rolled back scenario creation due to injects failure');
      } catch (rollbackError) {
        console.error('Failed to rollback scenario creation:', rollbackError);
      }

      return {
        success: false,
        error: `Failed to create injects: ${injectsError.message}`,
        data: null
      };
    }

    // Return success with complete data
    return {
      success: true,
      error: null,
      data: {
        scenario: {
          id: scenario.id,
          title: scenario.title,
          background: scenario.background,
          key_themes: scenario.key_themes,
          assumptions: scenario.assumptions,
          created_at: scenario.created_at,
          injects_count: injects.length
        },
        injects: injects.map(inject => ({
          id: inject.id,
          time_offset: inject.time_offset,
          content: inject.content,
          target_role: inject.target_role
        }))
      }
    };

  } catch (error) {
    console.error('Unexpected error in saveScenario:', error);
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates the scenario data before insertion
 * @param scenarioData - The scenario data to validate
 * @returns ValidationResult - Validation result with isValid boolean and error message
 */
function validateScenarioData(scenarioData: ScenarioData): ValidationResult {
  // Check if scenarioData exists
  if (!scenarioData || typeof scenarioData !== 'object') {
    return {
      isValid: false,
      error: 'Scenario data must be a valid object'
    };
  }

  // Validate required fields
  const requiredFields = ['title', 'background', 'key_themes'] as const;
  for (const field of requiredFields) {
    if (!scenarioData[field] || typeof scenarioData[field] !== 'string' || scenarioData[field].trim().length === 0) {
      return {
        isValid: false,
        error: `Missing or empty required field: ${field}`
      };
    }
  }

  // Validate title length
  if (scenarioData.title.trim().length > 255) {
    return {
      isValid: false,
      error: 'Title must be 255 characters or less'
    };
  }

  // Validate injects array
  if (!Array.isArray(scenarioData.injects) || scenarioData.injects.length === 0) {
    return {
      isValid: false,
      error: 'At least one inject is required'
    };
  }

  // Validate each inject
  for (let i = 0; i < scenarioData.injects.length; i++) {
    const inject = scenarioData.injects[i];
    const injectIndex = i + 1;

    if (!inject || typeof inject !== 'object') {
      return {
        isValid: false,
        error: `Inject ${injectIndex} must be a valid object`
      };
    }

    // Validate inject required fields
    const injectRequiredFields = ['time', 'content', 'role'] as const;
    for (const field of injectRequiredFields) {
      if (!inject[field] || typeof inject[field] !== 'string' || inject[field].trim().length === 0) {
        return {
          isValid: false,
          error: `Inject ${injectIndex} missing or empty required field: ${field}`
        };
      }
    }

    // Validate inject content length
    if (inject.content.trim().length > 2000) {
      return {
        isValid: false,
        error: `Inject ${injectIndex} content must be 2000 characters or less`
      };
    }
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Example usage and testing function
 */
export async function testSaveScenario(): Promise<SaveResult> {
  const testScenario: ScenarioData = {
    title: "Ransomware Attack Simulation",
    background: "A sophisticated ransomware attack targeting critical infrastructure systems.",
    key_themes: "Incident response, data protection, business continuity",
    assumptions: "All systems are operational at exercise start",
    injects: [
      {
        time: "T+0",
        content: "Initial detection of suspicious activity on network perimeter",
        role: "Security Analyst"
      },
      {
        time: "T+5",
        content: "Ransomware payload detected on multiple endpoints",
        role: "Incident Commander"
      },
      {
        time: "T+10",
        content: "Critical systems begin showing ransom demands",
        role: "IT Manager"
      }
    ]
  };

  console.log('Testing saveScenario function...');
  const result = await saveScenario(testScenario);
  
  if (result.success) {
    console.log('✅ Scenario saved successfully:', result.data);
  } else {
    console.error('❌ Failed to save scenario:', result.error);
  }

  return result;
} 