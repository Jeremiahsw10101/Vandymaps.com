import { useState } from 'react';

interface ConstructionReportFormProps {
  onSubmit: (report: { location: string; description: string }) => void;
  onCancel: () => void;
}

export default function ConstructionReportForm({ onSubmit, onCancel }: ConstructionReportFormProps) {
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location.trim()) {
      setError('Please specify a location');
      return;
    }
    
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({ location, description });
      // Form will be closed by parent component
    } catch (error) {
      setError('Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      width: '100%', 
      maxWidth: '500px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        color: '#333', 
        fontSize: 'clamp(18px, 3.5vw, 20px)', 
        fontWeight: 'bold', 
        marginBottom: '15px', 
        textAlign: 'center' 
      }}>
        Report Construction Site
      </h3>
      
      <p style={{ 
        color: '#666', 
        fontSize: 'clamp(14px, 3vw, 16px)', 
        marginBottom: '15px',
        textAlign: 'center'
      }}>
        Your report will be reviewed by our AI moderator to ensure it contains appropriate construction-related content.
      </p>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          borderRadius: '8px', 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          marginBottom: '15px', 
          border: '1px solid #fca5a5',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="location" 
            style={{ 
              color: '#666', 
              fontSize: 'clamp(14px, 3vw, 16px)', 
              fontWeight: 'bold', 
              marginBottom: '5px', 
              display: 'block' 
            }}
          >
            Location *
          </label>
          <input 
            id="location"
            type="text" 
            value={location} 
            onChange={e => setLocation(e.target.value)} 
            placeholder="Enter location of construction (e.g., 'Near Featheringill Hall')"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid #ddd',
              fontSize: 'clamp(14px, 3vw, 16px)'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label 
            htmlFor="description" 
            style={{ 
              color: '#666', 
              fontSize: 'clamp(14px, 3vw, 16px)', 
              fontWeight: 'bold', 
              marginBottom: '5px', 
              display: 'block' 
            }}
          >
            Description *
          </label>
          <textarea 
            id="description"
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Describe the construction (e.g., 'Sidewalk closed, construction fence blocking path')"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid #ddd', 
              minHeight: '100px',
              resize: 'vertical',
              fontSize: 'clamp(14px, 3vw, 16px)'
            }}
            required
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#f9f9f9',
              color: '#333',
              fontSize: 'clamp(14px, 3vw, 16px)',
              flex: '1',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            Cancel
          </button>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid #4CAF50',
              backgroundColor: '#4CAF50',
              color: '#fff',
              fontSize: 'clamp(14px, 3vw, 16px)',
              flex: '1',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
