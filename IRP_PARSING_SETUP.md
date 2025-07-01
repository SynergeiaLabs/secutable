# IRP Parsing Setup Guide

This guide explains how the IRP (Incident Response Plan) parsing functionality works in the TTX platform.

## Overview

The IRP parsing feature automatically extracts phase expectations from uploaded IRP documents (PDF, DOCX, Markdown) and displays them in the exercise control panel for comparison against actual team responses.

## Features

### Supported File Types
- **PDF** (.pdf) - Placeholder implementation (see notes below)
- **DOCX** (.docx) - Full support using mammoth.js
- **Markdown** (.md) - Direct text extraction
- **Text** (.txt) - Direct text extraction

### Phase Extraction
The system automatically identifies common IRP phases:
- Identification/Detection
- Containment
- Eradication
- Recovery
- Lessons Learned
- Post-Incident
- Response
- Mitigation
- Resolution

### Display Features
- Collapsible phase cards
- Action item bullet points
- Loading states and error handling
- Integration with exercise control panel

## Implementation Details

### File Parsing Process
1. **Fetch**: Downloads file from Supabase Storage URL
2. **Parse**: Extracts text based on file type
3. **Analyze**: Identifies phases and actions using heuristic approach
4. **Display**: Shows results in collapsible UI components

### Current Limitations

#### PDF Parsing
The current PDF parsing implementation is a placeholder that returns sample IRP content. For production use, you should implement proper PDF parsing using one of these approaches:

**Option 1: PDF.js (Recommended)**
```bash
npm install pdfjs-dist
```

**Option 2: pdf-parse with server-side processing**
- Move PDF parsing to API routes
- Use Node.js environment for pdf-parse library

**Option 3: Third-party PDF parsing service**
- Use services like AWS Textract or Google Cloud Vision API

### OpenAI Integration (Future Enhancement)
The system is designed to support OpenAI GPT-4 integration for more accurate phase extraction. To enable this:

1. Add OpenAI API key to environment variables
2. Implement the `callOpenAI` function in `irpParser.ts`
3. Replace heuristic parsing with AI-powered analysis

## Usage

### In Scenario Creation
1. Upload IRP document during scenario creation
2. File is stored in Supabase Storage
3. URL is saved in scenario record

### In Exercise Control Panel
1. System automatically detects IRP URL
2. Parses document on page load
3. Displays phase expectations in collapsible cards
4. Shows loading states during parsing

### Error Handling
- File not found: Shows "No IRP Document Available"
- Parsing errors: Displays specific error messages
- Network issues: Retry functionality

## Configuration

### Environment Variables
```env
# For future OpenAI integration
OPENAI_API_KEY=your_openai_api_key
```

### Supabase Storage
Ensure your Supabase Storage bucket has proper RLS policies:
```sql
-- Allow public read access to IRP documents
CREATE POLICY "Public read access for IRP documents" ON storage.objects
FOR SELECT USING (bucket_id = 'irp_documents');
```

## Testing

### Test Files
Create test IRP documents with clear phase structure:

**Sample DOCX Structure:**
```
Identification Phase
- Monitor security alerts
- Verify incident validity
- Document initial findings

Containment Phase
- Isolate affected systems
- Implement security measures
- Preserve evidence
```

### Manual Testing
1. Create scenario with IRP upload
2. Navigate to exercise control panel
3. Verify phase extraction
4. Test collapsible functionality
5. Check error handling with invalid files

## Troubleshooting

### Common Issues

**"Failed to fetch file"**
- Check Supabase Storage URL
- Verify file exists in bucket
- Check RLS policies

**"No text content found"**
- File may be corrupted
- Try re-uploading document
- Check file format support

**"Unsupported file type"**
- Ensure file has correct extension
- Check supported formats list
- Convert file to supported format

### Debug Mode
Enable console logging for debugging:
```typescript
// In irpParser.ts
console.log('Parsing file:', fileName);
console.log('Extracted text length:', plainText.length);
console.log('Identified phases:', phases.length);
```

## Future Enhancements

1. **AI-Powered Parsing**: Integrate OpenAI GPT-4 for accurate phase extraction
2. **Advanced PDF Support**: Implement proper PDF.js integration
3. **Phase Templates**: Pre-defined phase structures for common IRP formats
4. **Export Functionality**: Export parsed phases to various formats
5. **Version Control**: Track changes in IRP documents over time
6. **Multi-language Support**: Parse IRPs in different languages

## Dependencies

```json
{
  "mammoth": "^1.6.0",
  "@types/pdf-parse": "^1.1.4"
}
```

## Security Considerations

- Validate file types before processing
- Implement file size limits
- Sanitize extracted text content
- Use secure file storage with proper access controls
- Consider rate limiting for parsing operations 