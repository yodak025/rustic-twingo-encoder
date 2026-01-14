'use client';

import { useState, useEffect } from 'react';
import Card from './components/atoms/Card';
import Button from './components/atoms/Button';
import Badge from './components/atoms/Badge';
import Spinner from './components/atoms/Spinner';
import DarkModeToggle from './components/atoms/DarkModeToggle';
import DirectoryBrowser from './components/organisms/DirectoryBrowser';
import SelectedDirectoryChip from './components/molecules/SelectedDirectoryChip';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [selectedDirectories, setSelectedDirectories] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('mp3');
  const [profiles, setProfiles] = useState({});
  const [rootDirectory, setRootDirectory] = useState('');
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [validatingOutput, setValidatingOutput] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Poll job status when encoding
  useEffect(() => {
    if (job && job.status === 'running') {
      const interval = setInterval(() => {
        pollJobStatus();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [job]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setProfiles(data.profiles);
      setRootDirectory(data.rootDirectory);
    } catch (err) {
      setError('Failed to load configuration');
    }
  };

  const validateOutputDirectory = async (path) => {
    setValidatingOutput(true);
    setError('');
    
    try {
      const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to validate output directory');
      return false;
    } finally {
      setValidatingOutput(false);
    }
  };

  const handleOutputSelect = async (path) => {
    const isValid = await validateOutputDirectory(path);
    if (isValid) {
      setOutputDirectory(path);
    }
  };

  const handleSourceSelect = (path) => {
    if (!selectedDirectories.includes(path)) {
      setSelectedDirectories([...selectedDirectories, path]);
    }
  };

  const handleRemoveDirectory = (path) => {
    setSelectedDirectories(selectedDirectories.filter(d => d !== path));
  };

  const startEncoding = async () => {
    setError('');
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directories: selectedDirectories,
          outputDirectory,
          profile: selectedProfile,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setJob(data.job);
      setCurrentStep(4);
    } catch (err) {
      setError('Failed to start encoding');
    }
  };

  const pollJobStatus = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      
      if (data.job) {
        setJob(data.job);
      }
    } catch (err) {
      console.error('Failed to poll job status:', err);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setOutputDirectory('');
    setSelectedDirectories([]);
    setSelectedProfile('mp3');
    setJob(null);
    setError('');
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Output' },
      { num: 2, label: 'Sources' },
      { num: 3, label: 'Profile' },
      { num: 4, label: 'Encoding' },
    ];

    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                currentStep === step.num
                  ? 'text-[var(--accent)]'
                  : currentStep > step.num
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-sm ${
                  currentStep === step.num
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-text)]'
                    : currentStep > step.num
                    ? 'border-[var(--accent)] text-[var(--foreground)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {currentStep > step.num ? '✓' : step.num}
              </div>
              <span className="font-mono text-sm">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-12 h-px ${
                  currentStep > step.num ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => (
    <div>
      <h2 className="text-2xl font-mono mb-2">Select Output Directory</h2>
      <p className="text-[var(--muted)] font-mono text-sm mb-6">
        Choose where encoded files will be saved. Directory must be empty.
      </p>

      {outputDirectory && (
        <div className="mb-6">
          <Badge variant="success">Selected: {outputDirectory}</Badge>
        </div>
      )}

      <DirectoryBrowser
        mode="free"
        onSelect={handleOutputSelect}
        initialPath="/"
      />

      {outputDirectory && (
        <div className="mt-6">
          <Button variant="primary" onClick={() => setCurrentStep(2)} className="w-full">
            Next: Select Source Directories →
          </Button>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-mono mb-2">Select Source Directories</h2>
          <p className="text-[var(--muted)] font-mono text-sm">
            Choose directories containing audio files to transcode.
          </p>
        </div>
        <Badge variant="warning">Output: {outputDirectory}</Badge>
      </div>

      {selectedDirectories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-mono mb-3 text-[var(--muted)]">Selected Directories:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedDirectories.map((dir, idx) => (
              <SelectedDirectoryChip
                key={idx}
                name={dir}
                onRemove={() => handleRemoveDirectory(dir)}
              />
            ))}
          </div>
        </div>
      )}

      <DirectoryBrowser
        mode="restricted"
        onSelect={handleSourceSelect}
        initialPath=""
      />

      <div className="flex gap-4 mt-6">
        <Button variant="secondary" onClick={() => setCurrentStep(1)} className="flex-1">
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={() => setCurrentStep(3)}
          disabled={selectedDirectories.length === 0}
          className="flex-1"
        >
          Next: Choose Profile →
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-mono mb-2">Select Encoding Profile</h2>
          <p className="text-[var(--muted)] font-mono text-sm">
            Choose the output format and quality settings.
          </p>
        </div>
        <Badge variant="warning">Output: {outputDirectory}</Badge>
      </div>

      <div className="grid gap-4 mb-6">
        {Object.entries(profiles).map(([key, profile]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all ${
              selectedProfile === key
                ? 'border-[var(--accent)] bg-[var(--accent)] bg-opacity-5'
                : 'hover:border-[var(--accent)]'
            }`}
            onClick={() => setSelectedProfile(key)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-mono">{profile.name}</h3>
                  <Badge variant={selectedProfile === key ? 'success' : 'default'}>
                    .{profile.extension}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted)] font-mono">
                  {profile.description}
                </p>
              </div>
              {selectedProfile === key && (
                <div className="text-[var(--accent)] text-xl">✓</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-mono mb-3 text-[var(--muted)]">
          Will encode {selectedDirectories.length} director{selectedDirectories.length !== 1 ? 'ies' : 'y'}:
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedDirectories.map((dir, idx) => (
            <Badge key={idx}>{dir}</Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => setCurrentStep(2)} className="flex-1">
          ← Back
        </Button>
        <Button variant="primary" onClick={startEncoding} className="flex-1">
          Start Encoding →
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (!job) return null;

    const getStatusBadge = () => {
      switch (job.status) {
        case 'pending':
          return <Badge variant="warning">Pending</Badge>;
        case 'running':
          return <Badge variant="warning">Running</Badge>;
        case 'completed':
          return <Badge variant="success">Completed</Badge>;
        case 'error':
          return <Badge variant="error">Error</Badge>;
        default:
          return <Badge>{job.status}</Badge>;
      }
    };

    const progress = job.progress || {};
    const percentage = progress.totalFiles
      ? Math.round((progress.processedFiles / progress.totalFiles) * 100)
      : 0;

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-mono mb-2">Encoding Status</h2>
            <p className="text-[var(--muted)] font-mono text-sm">
              Job ID: {job.id}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-mono text-sm">Progress</span>
                <span className="font-mono text-sm text-[var(--accent)]">
                  {progress.processedFiles || 0} / {progress.totalFiles || 0} files
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--border)]">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {progress.currentFile && job.status === 'running' && (
              <div>
                <span className="font-mono text-sm text-[var(--muted)]">
                  Current file:
                </span>
                <p className="font-mono text-sm mt-1">{progress.currentFile}</p>
              </div>
            )}

            {job.status === 'running' && (
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <span className="font-mono text-sm text-[var(--muted)]">
                  Processing...
                </span>
              </div>
            )}

            {job.errors && job.errors.length > 0 && (
              <div>
                <h3 className="font-mono text-sm text-[var(--error)] mb-2">
                  Errors ({job.errors.length}):
                </h3>
                <div className="max-h-48 overflow-y-auto border border-[var(--error)] bg-[var(--error)] bg-opacity-5 p-3">
                  {job.errors.map((err, idx) => (
                    <p key={idx} className="font-mono text-xs text-[var(--error)] mb-1">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {(job.status === 'completed' || job.status === 'error') && (
          <Button variant="primary" onClick={resetWizard} className="w-full">
            Start New Encoding
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ padding: '3rem' }}>
      <div className="max-w-4xl" style={{ margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-mono mb-2">Rustic Twingo Encoder</h1>
            <p className="text-[var(--muted)] font-mono text-sm">
              Audio transcoding with ffmpeg
            </p>
          </div>
          <DarkModeToggle />
        </div>

        {renderStepIndicator()}

        {error && (
          <div 
            className="mb-6 p-4 border border-[var(--error)] text-[var(--error)] font-mono text-sm"
            style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)' }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
}
