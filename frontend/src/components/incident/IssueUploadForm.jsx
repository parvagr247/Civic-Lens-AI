import React, { useState } from 'react';
import { Sparkles, AlertCircle, FileText } from 'lucide-react';
import ImageUploader from './ImageUploader';
import LocationInput from './LocationInput';
import UploadProgress from './UploadProgress';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { createIncident } from '../../services/issueService';
import { getIncidentAnalysis } from '../../services/analysisService';
import { getRiskByIncidentId } from '../../services/riskService';

/**
 * IssueUploadForm component.
 * Coordinates input fields, drag-and-drop image, geolocations, and orchestrates the AI vision submission pipeline.
 */
export default function IssueUploadForm({ onAnalysisSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ latitude: '', longitude: '', address: '' });
  const [imageFile, setImageFile] = useState(null);
  const [anonymous, setAnonymous] = useState(false);

  // Status and loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('UPLOAD'); // UPLOAD, SAVE, ANALYZE, REPORT
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLocationChange = (field, value) => {
    setLocation(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!imageFile) {
      setErrorMessage('Please upload a photo of the incident.');
      return;
    }
    if (!title.trim() || title.length < 5) {
      setErrorMessage('Please enter a descriptive title (at least 5 characters).');
      return;
    }
    if (!description.trim() || description.length < 10) {
      setErrorMessage('Please enter a detailed description of the issue (at least 10 characters).');
      return;
    }
    if (location.latitude === '' || location.longitude === '') {
      setErrorMessage('Please specify location coordinates (Latitude and Longitude).');
      return;
    }
    if (!location.address.trim()) {
      setErrorMessage('Please specify the physical address or landmark.');
      return;
    }

    setIsSubmitting(true);
    setCurrentStep('UPLOAD');
    setProgressPercent(0);

    // Construct multipart form data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('address', location.address);
    formData.append('anonymous', anonymous);

    let analyzeTimeout;
    let reportTimeout;

    try {
      // 1. Submit form with upload progress tracking
      const response = await createIncident(formData, (percent) => {
        setProgressPercent(percent);
        if (percent === 100) {
          // Transition to saving state once upload is fully transmitted
          setCurrentStep('SAVE');

          // Simulate step states while the backend processes the AI analysis
          analyzeTimeout = setTimeout(() => {
            setCurrentStep('ANALYZE');
          }, 2000);

          reportTimeout = setTimeout(() => {
            setCurrentStep('REPORT');
          }, 6500);
        }
      });

      // Clear pending timeouts and finalize step state
      clearTimeout(analyzeTimeout);
      clearTimeout(reportTimeout);
      setCurrentStep('REPORT');

      // Fetch the generated AI analysis and risk assessment immediately
      const incident = response.data;
      const [analysisResponse, riskResponse] = await Promise.all([
        getIncidentAnalysis(incident.id),
        getRiskByIncidentId(incident.id)
      ]);
      
      const analysis = analysisResponse.data;
      const risk = riskResponse.data;
      
      setIsSubmitting(false);
      onAnalysisSuccess(incident, analysis, risk);
    } catch (err) {
      clearTimeout(analyzeTimeout);
      clearTimeout(reportTimeout);
      console.error('Submission failed', err);
      setErrorMessage(err.message || 'Failed to submit incident. Please check details and try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <UploadProgress currentStep={currentStep} progressPercent={progressPercent} />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6 md:p-8 bg-card border-border/80 shadow-2xl">
      <div className="mb-6 animate-fade-in">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="text-emerald-500 dark:text-emerald-400 animate-pulse-subtle" size={20} />
          Report New Incident
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a photo of the civic issue. Gemini Vision will analyze structural damages, categorize the issue, and draft a response.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-xl mb-6 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Validation Error</span>
            <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* Image Uploader */}
        <ImageUploader
          selectedFile={imageFile}
          onFileSelect={setImageFile}
          onFileRemove={() => setImageFile(null)}
        />

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
            <FileText size={14} className="text-gray-400 dark:text-slate-500" />
            Short Title <span className="text-emerald-500 dark:text-emerald-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Deep pothole near main traffic light intersection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-400 dark:placeholder-slate-600 transition-all duration-200 shadow-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            Detailed Description <span className="text-emerald-500 dark:text-emerald-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            placeholder="Explain the issue details. Include context like vehicle safety hazards, street address landmarks, and duration of the problem."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-400 dark:placeholder-slate-600 transition-all duration-200 resize-y shadow-sm"
          />
        </div>

        {/* Location Coordinates & Address mapping */}
        <LocationInput
          latitude={location.latitude}
          longitude={location.longitude}
          address={location.address}
          onChange={handleLocationChange}
        />

        {/* Anonymous checkbox */}
        <div 
          onClick={() => setAnonymous(!anonymous)}
          className="flex items-center gap-2.5 cursor-pointer py-1.5 select-none"
        >
          <input 
            type="checkbox" 
            checked={anonymous} 
            onChange={() => {}} 
            className="rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <span className="text-xs text-gray-600 dark:text-slate-300 font-semibold">
            Report Anonymously (Hide your identity from public social feeds)
          </span>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex justify-end">
          <Button
            type="submit"
            variant="success"
            className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            Submit for AI Analysis
          </Button>
        </div>

      </form>
    </Card>
  );
}
