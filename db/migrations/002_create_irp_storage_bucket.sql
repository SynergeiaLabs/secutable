-- Add irp_url field to scenarios table
ALTER TABLE scenarios ADD COLUMN irp_url TEXT;

-- Create storage bucket for IRP documents
-- Note: This is a placeholder for the storage bucket creation
-- The actual bucket creation should be done through Supabase dashboard or CLI
-- INSERT INTO storage.buckets (id, name, public) VALUES ('irp_documents', 'irp_documents', true);

-- Add RLS policy for irp_documents bucket
-- This allows authenticated users to upload and read IRP documents
-- CREATE POLICY "Allow authenticated users to upload IRP documents" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'irp_documents');

-- CREATE POLICY "Allow authenticated users to read IRP documents" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'irp_documents');

-- CREATE POLICY "Allow authenticated users to update IRP documents" ON storage.objects
--   FOR UPDATE TO authenticated
--   USING (bucket_id = 'irp_documents');

-- CREATE POLICY "Allow authenticated users to delete IRP documents" ON storage.objects
--   FOR DELETE TO authenticated
--   USING (bucket_id = 'irp_documents'); 