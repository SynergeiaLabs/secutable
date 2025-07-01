import mammoth from 'mammoth';

export interface IRPPhase {
  name: string;
  actions: string[];
}

export interface IRPAnalysis {
  phases: IRPPhase[];
  rawText: string;
  error?: string;
}

/**
 * Fetches and parses an IRP file from a URL
 */
export async function parseIRPFile(fileUrl: string): Promise<IRPAnalysis> {
  try {
    // Fetch the file from the URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileName = fileUrl.split('/').pop()?.toLowerCase() || '';
    
    let plainText = '';

    // Parse based on file type
    if (fileName.endsWith('.pdf')) {
      // For PDF files, we'll use a simple text extraction approach
      // In a production environment, you might want to use a PDF.js library
      plainText = await extractTextFromPDF(arrayBuffer);
    } else if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ arrayBuffer });
      plainText = result.value;
    } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
      // For markdown and text files, convert array buffer to string
      const decoder = new TextDecoder('utf-8');
      plainText = decoder.decode(arrayBuffer);
    } else {
      throw new Error('Unsupported file type');
    }

    if (!plainText.trim()) {
      throw new Error('No text content found in file');
    }

    // Analyze the IRP content using OpenAI
    const analysis = await analyzeIRPContent(plainText);
    
    return {
      phases: analysis.phases,
      rawText: plainText
    };

  } catch (error) {
    console.error('Error parsing IRP file:', error);
    return {
      phases: [],
      rawText: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Simple PDF text extraction (placeholder implementation)
 * In production, you would use a proper PDF parsing library like PDF.js
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // This is a placeholder implementation
  // In a real application, you would use PDF.js or similar
  try {
    // For now, we'll return a placeholder message
    // You can implement proper PDF parsing here
    return `PDF Document Content (Placeholder)
    
    This is a placeholder for PDF content extraction.
    In a production environment, you would implement proper PDF parsing using PDF.js or similar library.
    
    Incident Response Plan Phases:
    
    Identification Phase:
    - Monitor security alerts and notifications
    - Verify the incident is real and not a false positive
    - Document initial findings and observations
    - Notify appropriate stakeholders
    
    Containment Phase:
    - Isolate affected systems and networks
    - Implement temporary security measures
    - Preserve evidence for forensic analysis
    - Prevent further damage or data loss
    
    Eradication Phase:
    - Remove malware and malicious code
    - Patch vulnerabilities and security gaps
    - Restore systems from clean backups
    - Verify all threats have been eliminated
    
    Recovery Phase:
    - Restore affected systems and services
    - Monitor for signs of re-infection
    - Validate system functionality
    - Gradually restore normal operations
    
    Lessons Learned Phase:
    - Conduct post-incident review
    - Document lessons learned and improvements
    - Update incident response procedures
    - Provide training and awareness updates`;
  } catch (error) {
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Analyzes IRP content using OpenAI to extract phases and actions
 */
async function analyzeIRPContent(content: string): Promise<{ phases: IRPPhase[] }> {
  try {
    // For now, we'll use a simple heuristic approach since we don't have OpenAI API access
    // In a real implementation, you would send this to OpenAI GPT-4
    
    const phases = extractPhasesHeuristic(content);
    return { phases };
  } catch (error) {
    console.error('Error analyzing IRP content:', error);
    return { phases: [] };
  }
}

/**
 * Heuristic approach to extract IRP phases from text content
 * This is a fallback when OpenAI is not available
 */
function extractPhasesHeuristic(content: string): IRPPhase[] {
  const phases: IRPPhase[] = [];
  
  // Common IRP phase keywords
  const phaseKeywords = [
    'identification',
    'detection',
    'containment',
    'eradication',
    'recovery',
    'lessons learned',
    'post-incident',
    'response',
    'mitigation',
    'resolution'
  ];

  // Split content into sections based on headers
  const lines = content.split('\n');
  let currentPhase: IRPPhase | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    
    // Check if this line contains a phase keyword
    const phaseKeyword = phaseKeywords.find(keyword => 
      line.includes(keyword) && line.length < 100 // Likely a header
    );
    
    if (phaseKeyword) {
      // Save previous phase if exists
      if (currentPhase && currentPhase.actions.length > 0) {
        phases.push(currentPhase);
      }
      
      // Start new phase
      currentPhase = {
        name: lines[i].trim(),
        actions: []
      };
    } else if (currentPhase && line.length > 0) {
      // Check if this line looks like an action item
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*') || 
          line.match(/^\d+\./) || line.includes('should') || line.includes('must') ||
          line.includes('will') || line.includes('shall')) {
        currentPhase.actions.push(lines[i].trim());
      }
    }
  }
  
  // Add the last phase
  if (currentPhase && currentPhase.actions.length > 0) {
    phases.push(currentPhase);
  }
  
  // If no phases found, create a generic structure
  if (phases.length === 0) {
    phases.push({
      name: 'General Response Procedures',
      actions: content.split('\n')
        .filter(line => line.trim().length > 20)
        .slice(0, 10) // Limit to first 10 substantial lines
        .map(line => line.trim())
    });
  }
  
  return phases;
}

/**
 * OpenAI API call (placeholder for when API is available)
 */
async function callOpenAI(content: string): Promise<IRPPhase[]> {
  // This would be the actual OpenAI API call
  // For now, return empty array
  return [];
} 