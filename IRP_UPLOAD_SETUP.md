# IRP Document Upload Setup

This guide explains how to set up Supabase Storage for IRP (Incident Response Plan) document uploads.

## Prerequisites

- Supabase project with Storage enabled
- Admin access to your Supabase dashboard

## Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `irp_documents`
   - **Public bucket**: ✅ Checked (allows public access to uploaded files)
   - **File size limit**: 10MB (or your preferred limit)
   - **Allowed MIME types**: Leave empty for all types, or specify:
     - `application/pdf`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `text/markdown`
     - `text/plain`

### 2. Configure RLS Policies

After creating the bucket, set up Row Level Security (RLS) policies:

#### Enable RLS on the bucket:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

#### Create policies for authenticated users:

```sql
-- Allow authenticated users to upload IRP documents
CREATE POLICY "Allow authenticated users to upload IRP documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'irp_documents');

-- Allow authenticated users to read IRP documents
CREATE POLICY "Allow authenticated users to read IRP documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'irp_documents');

-- Allow authenticated users to update IRP documents
CREATE POLICY "Allow authenticated users to update IRP documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'irp_documents');

-- Allow authenticated users to delete IRP documents
CREATE POLICY "Allow authenticated users to delete IRP documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'irp_documents');
```

### 3. Update Database Schema

Run the migration to add the `irp_url` field to the scenarios table:

```sql
-- Add irp_url field to scenarios table
ALTER TABLE scenarios ADD COLUMN irp_url TEXT;
```

### 4. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the scenario creation page
3. Try uploading a PDF, DOCX, or Markdown file
4. Verify the file appears in your Supabase Storage bucket
5. Check that the `irp_url` field is populated in the scenarios table

## Features

The IRP upload functionality includes:

- **File Type Validation**: Accepts PDF, DOCX, Markdown, and text files
- **File Size Limit**: 10MB maximum file size
- **Drag & Drop**: Modern drag-and-drop interface
- **Progress Indicators**: Upload status and error handling
- **Unique Filenames**: Timestamped filenames to prevent conflicts
- **Public URLs**: Automatically generates public URLs for uploaded files

## Security Considerations

- Files are stored in a public bucket for easy access
- RLS policies ensure only authenticated users can upload/manage files
- File type validation prevents malicious uploads
- File size limits prevent abuse

## Troubleshooting

### Common Issues

1. **"Failed to upload file" error**
   - Check that the `irp_documents` bucket exists
   - Verify RLS policies are correctly configured
   - Ensure your Supabase client is properly initialized

2. **"File type not supported" error**
   - Verify the file extension is one of: .pdf, .docx, .md, .txt
   - Check that the file's MIME type is recognized

3. **"File size too large" error**
   - Ensure the file is under 10MB
   - Check the bucket's file size limit in Supabase dashboard

### Debug Steps

1. Check browser console for detailed error messages
2. Verify Supabase Storage bucket permissions
3. Test with a smaller file first
4. Check network tab for failed requests

## File Storage Structure

Uploaded files are stored with the following naming convention:
```
irp_documents/
├── irp_1703123456789.pdf
├── irp_1703123456790.docx
└── irp_1703123456791.md
```

The timestamp ensures unique filenames and prevents conflicts. 