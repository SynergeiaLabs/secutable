'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveScenario } from '../../lib/saveScenario';
import { supabase } from '../../lib/supabaseClient';

interface Inject {
  id: number;
  timeOffset: string;
  content: string;
  targetRole: string;
}

interface Scenario {
  title: string;
  description?: string;
  background: string;
  riskThemes: string;
  assumptions: string;
  injects: Inject[];
  irpUrl?: string | null;
}

export default function ScenarioCreator() {
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario>({
    title: '',
    description: '',
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
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);

  // IRP Upload state
  const [irpFile, setIrpFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof Scenario, value: string) => {
    setScenario(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInjectChange = (id: number, field: keyof Inject, value: string) => {
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

  const removeInject = (id: number) => {
    if (scenario.injects.length > 1) {
      setScenario(prev => ({
        ...prev,
        injects: prev.injects.filter(inject => inject.id !== id)
      }));
    }
  };

  // IRP Upload functions
  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/plain'
    ];
    
    const allowedExtensions = ['.pdf', '.docx', '.md', '.txt'];
    const fileName = file.name.toLowerCase();
    
    const isValidType = allowedTypes.includes(file.type);
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    return isValidType || isValidExtension;
  };

  const handleFileSelect = (file: File) => {
    setUploadError('');
    
    if (!validateFile(file)) {
      setUploadError('Please select a valid file type (PDF, DOCX, or Markdown)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('File size must be less than 10MB');
      return;
    }

    setIrpFile(file);
    setUploadedFileName('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadIrpFile = async (): Promise<string | null> => {
    if (!irpFile) return null;

    try {
      setIsUploading(true);
      setUploadError('');

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = irpFile.name.split('.').pop();
      const fileName = `irp_${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('irp_documents')
        .upload(fileName, irpFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload file');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('irp_documents')
        .getPublicUrl(fileName);

      setUploadedFileName(irpFile.name);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload file. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);

    try {
      // Upload IRP file first if selected
      let irpUrl: string | null = scenario.irpUrl || null;
      if (irpFile && !uploadedFileName) {
        irpUrl = await uploadIrpFile();
        if (!irpUrl) {
          throw new Error('Failed to upload IRP file');
        }
      }

      // Transform data for Supabase
      const transformedData = {
        title: scenario.title,
        description: scenario.description,
        background: scenario.background,
        key_themes: scenario.riskThemes,
        assumptions: scenario.assumptions,
        irp_url: irpUrl || undefined,
        injects: scenario.injects.map(inject => ({
          time: inject.timeOffset,
          content: inject.content,
          role: inject.targetRole
        }))
      };

      const result = await saveScenario(transformedData) as { success: boolean; error: string | null; data: any };

      if (result.success) {
        setSaveResult({
          success: true,
          message: 'Scenario created successfully! Redirecting to dashboard...'
        });
        
        // Clear form
        setScenario({
          title: '',
          description: '',
          background: '',
          riskThemes: '',
          assumptions: '',
          injects: [{ id: 1, timeOffset: '', content: '', targetRole: '' }]
        });
        setIrpFile(null);
        setUploadedFileName('');
        setUploadError('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setSaveResult({
          success: false,
          message: 'Failed to save scenario. Please try again.',
          error: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: 'An unexpected error occurred.',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Modern Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Create New Tabletop Exercise
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Design comprehensive cybersecurity scenarios to test your organization's incident response capabilities
            </p>
          </div>

          {/* Main Form Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              
              {/* Scenario Title Section */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Scenario Details
                  </h2>
                </div>
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3">
                    Scenario Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={scenario.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-lg placeholder-gray-400"
                    placeholder="Enter a descriptive title for your scenario"
                    required
                  />
                </div>
                <div className="mt-6">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                    Scenario Description
                  </label>
                  <textarea
                    id="description"
                    value={scenario.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical text-lg placeholder-gray-400"
                    placeholder="Optional brief description of the scenario..."
                  />
                </div>
              </div>

              {/* Background Section */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">2</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Background
                  </h2>
                </div>
                <div>
                  <label htmlFor="background" className="block text-sm font-semibold text-gray-700 mb-3">
                    Scenario Background *
                  </label>
                  <textarea
                    id="background"
                    value={scenario.background}
                    onChange={(e) => handleInputChange('background', e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical text-lg placeholder-gray-400"
                    placeholder="Describe the initial situation and context for the exercise..."
                    required
                  />
                </div>
              </div>

              {/* Risk Themes Section */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">3</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Key Risk Themes
                  </h2>
                </div>
                <div>
                  <label htmlFor="riskThemes" className="block text-sm font-semibold text-gray-700 mb-3">
                    Risk Themes to Explore *
                  </label>
                  <textarea
                    id="riskThemes"
                    value={scenario.riskThemes}
                    onChange={(e) => handleInputChange('riskThemes', e.target.value)}
                    rows={3}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical text-lg placeholder-gray-400"
                    placeholder="List the key cybersecurity risks and themes this exercise will address..."
                    required
                  />
                </div>
              </div>

              {/* Assumptions Section */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">4</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Assumptions
                  </h2>
                </div>
                <div>
                  <label htmlFor="assumptions" className="block text-sm font-semibold text-gray-700 mb-3">
                    Exercise Assumptions
                  </label>
                  <textarea
                    id="assumptions"
                    value={scenario.assumptions}
                    onChange={(e) => handleInputChange('assumptions', e.target.value)}
                    rows={3}
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical text-lg placeholder-gray-400"
                    placeholder="Define any assumptions or ground rules for the exercise..."
                  />
                </div>
              </div>

              {/* IRP Document Upload Section */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white font-semibold text-sm">5</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Incident Response Plan
                  </h2>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Upload IRP Document (Optional)
                  </label>
                  
                  {/* File Upload Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.md,.txt"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {!irpFile && !uploadedFileName ? (
                      <div>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl mb-4 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Upload Incident Response Plan
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Drag and drop your IRP document here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Supported formats: PDF, DOCX, Markdown (max 10MB)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {uploadedFileName || irpFile?.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {irpFile && `${(irpFile.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIrpFile(null);
                            setUploadedFileName('');
                            setUploadError('');
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove File
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload Status */}
                  {isUploading && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-blue-700 font-semibold">Uploading IRP document...</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadError && (
                    <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-700 font-semibold">{uploadError}</span>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {uploadedFileName && !isUploading && (
                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-700 font-semibold">
                          IRP document uploaded successfully: {uploadedFileName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inject Timeline Section */}
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                      <span className="text-white font-semibold text-sm">6</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Inject Timeline
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={addInject}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Inject
                  </button>
                </div>

                <div className="space-y-6">
                  {scenario.injects.map((inject, index) => (
                    <div key={inject.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-sm">{index + 1}</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Inject {index + 1}
                          </h3>
                        </div>
                        {scenario.injects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInject(inject.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-xl"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Time Offset
                          </label>
                          <input
                            type="text"
                            value={inject.timeOffset}
                            onChange={(e) => handleInjectChange(inject.id, 'timeOffset', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            placeholder="e.g., T+5, T+15"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Target Role
                          </label>
                          <input
                            type="text"
                            value={inject.targetRole}
                            onChange={(e) => handleInjectChange(inject.id, 'targetRole', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            placeholder="e.g., Incident Commander"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Inject Content
                        </label>
                        <textarea
                          value={inject.content}
                          onChange={(e) => handleInjectChange(inject.id, 'content', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-vertical"
                          placeholder="Describe the inject details and expected response..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="px-8 py-8 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 text-xl font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSaving ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Scenario...
                    </div>
                  ) : (
                    'Save Scenario'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Result Message */}
          {saveResult && (
            <div className={`mt-8 p-6 rounded-2xl border-2 ${
              saveResult.success 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200'
            }`}>
              <div className="flex items-center">
                {saveResult.success ? (
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {saveResult.success ? 'Success!' : 'Error'}
                  </h3>
                  <p className="text-sm opacity-90">{saveResult.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 