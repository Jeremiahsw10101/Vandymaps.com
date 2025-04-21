'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import axios from 'axios';
import { format } from 'date-fns';

// Define interfaces for the component props
interface BuildingDetails {
  name: string;
  description: string;
  pages: number; // Changed from floors to pages
  hasAccessibility: boolean;
  floorPlanPdfs?: string; // Path to the PDF file
  floorPlanImages?: string[];
}

interface BuildingFloorPlanProps {
  buildingId: string;
  buildingDetails: BuildingDetails;
}

interface ConstructionReportFormProps {
  onSubmit: (report: { location: string; description: string }) => void;
  onCancel: () => void;
}

interface MapComponentProps {
  center: { lat: number; lng: number };
  locations: { [key: string]: { lat: number; lng: number } };
  selectedParking: string;
  selectedBuilding: string;
  directions: google.maps.DirectionsResult | null;
  setDirections: (directions: google.maps.DirectionsResult | null) => void;
}

// Dynamically import the Google Maps component to prevent SSR issues
const MapComponent = dynamic<MapComponentProps>(
  () => import('./components/MapComponent'),
  {
    loading: () => (
      <div style={{ height: '400px', width: '100%', backgroundColor: '#eee' }}></div>
    ),
    ssr: false,
  }
);

// Import components with proper types
const ConstructionReportForm = dynamic<ConstructionReportFormProps>(
  () =>
    import('./components/ConstructionReportForm').then((mod) => mod.default),
  { ssr: false }
);

const BuildingFloorPlan = dynamic<BuildingFloorPlanProps>(
  () =>
    import('./components/BuildingFloorPlan').then((mod) => mod.default),
  { ssr: false }
);

// Campus locations data
const locations = {
  kensington: { lat: 36.145473, lng: -86.807519 },
  "25th": { lat: 36.142021, lng: -86.806412 },
  terrace: { lat: 36.1503711, lng: -86.7989195 },
  sarrat: { lat: 36.144892, lng: -86.8033582 },
  slc: { lat: 36.1444075, lng: -86.8058493 },
  wondry: { lat: 36.1426541, lng: -86.805145 },
  featheringill: { lat: 36.144778, lng: -86.802954 },
};

// Center coordinates
const CENTER = {
  lat: Object.values(locations).reduce((sum, current) => sum + current.lat, 0) / Object.keys(locations).length,
  lng: Object.values(locations).reduce((sum, current) => sum + current.lng, 0) / Object.keys(locations).length,
};

// Building details including floor plan data
const buildingDetails: { [key: string]: BuildingDetails } = {
  sarrat: {
    name: 'Sarrat/Rand',
    description: 'Main student center and dining facility',
    pages: 7, // Updated based on preview images (7 pages)
    hasAccessibility: true,
    floorPlanPdfs: '/floor-plans/Sarratt_Rand.pdf',
    // Keeping these for backward compatibility
    floorPlanImages: [
      '/floor-plans/sarrat-1.png',
      '/floor-plans/sarrat-2.png',
      '/floor-plans/sarrat-3.png',
    ],
  },
  slc: {
    name: 'Student Life Center',
    description: 'Key campus resources such as the Vanderbilt Career Center, Global Education Office, and Office of Immersion Resources',
    pages: 3, // Updated based on preview images (3 pages)
    hasAccessibility: true,
    floorPlanPdfs: '/floor-plans/Student Life Center.pdf',
    floorPlanImages: ['/floor-plans/slc-1.png', '/floor-plans/slc-2.png'],
  },
  wondry: {
    name: 'Wondry/Engineering Science Building',
    description: 'Innovation center and engineering labs',
    pages: 11, // Updated based on preview images (11 pages)
    hasAccessibility: true,
    floorPlanPdfs: '/floor-plans/Wondry_ESB.pdf',
    floorPlanImages: [
      '/floor-plans/wondry-1.png',
      '/floor-plans/wondry-2.png',
      '/floor-plans/wondry-3.png',
      '/floor-plans/wondry-4.png',
    ],
  },
  featheringill: {
    name: 'Featheringill Hall',
    description: 'Engineering and computer science building',
    pages: 5, // Updated based on preview images (5 pages)
    hasAccessibility: true,
    floorPlanPdfs: '/floor-plans/Featheringhill.pdf',
    floorPlanImages: [
      '/floor-plans/featheringill-1.png',
      '/floor-plans/featheringill-2.png',
      '/floor-plans/featheringill-3.png',
    ],
  },
};

export default function Home() {
  // States for map and directions
  const [selectedParking, setSelectedParking] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  // States for UI display
  const [statusMessage, setStatusMessage] = useState({ message: '', isError: false });
  const [showStatus, setShowStatus] = useState(false);
  const [showConstructionForm, setShowConstructionForm] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [constructionReports, setConstructionReports] = useState<Array<{
    _id: string;
    location: string;
    description: string;
    reportTime: string;
    coordinates?: { lat: number; lng: number };
  }>>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize the width after mounting to get the client-side width
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch construction reports on component mount
  useEffect(() => {
    fetchConstructionReports();
  }, []);

  // Automatically show floor plans when a building is selected
  useEffect(() => {
    if (selectedBuilding) {
      setShowFloorPlan(true);
    } else {
      setShowFloorPlan(false);
    }
  }, [selectedBuilding]);

  // Function to fetch construction reports from the API
  const fetchConstructionReports = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/construction-reports');
      if (response.data.success) {
        // Format dates and add to state
        const formattedReports = response.data.reports.map((report: any) => ({
          _id: report._id,
          location: report.location,
          description: report.description,
          reportTime: format(new Date(report.reportTime), 'MMM d, yyyy h:mm a'),
          coordinates: report.coordinates
        }));
        setConstructionReports(formattedReports);
      } else {
        displayStatus('Failed to load construction reports', true);
      }
    } catch (error) {
      console.error('Error fetching construction reports:', error);
      displayStatus('Error connecting to construction reports database', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Display status message
  const displayStatus = (message: string, isError: boolean) => {
    setStatusMessage({ message, isError });
    setShowStatus(true);
    
    // Auto-hide status after 5 seconds
    setTimeout(() => {
      setShowStatus(false);
    }, 5000);
  };

  // Handle construction report submission
  const handleConstructionReport = async (location: string, description: string) => {
    try {
      setIsLoading(true);
      const reportData = {
        location,
        description,
        coordinates: selectedBuilding 
          ? { lat: locations[selectedBuilding as keyof typeof locations].lat, lng: locations[selectedBuilding as keyof typeof locations].lng }
          : undefined
      };
      
      const response = await axios.post('/api/construction-reports', reportData);
      
      if (response.data.success) {
        displayStatus(response.data.message, false);
        setShowConstructionForm(false);
        
        // If the report was automatically approved, add it to the display
        if (response.data.report.status === 'approved') {
          const newReport = {
            _id: response.data.report._id,
            location: response.data.report.location,
            description: response.data.report.description,
            reportTime: format(new Date(response.data.report.reportTime), 'MMM d, yyyy h:mm a'),
            coordinates: response.data.report.coordinates
          };
          setConstructionReports(prevReports => [newReport, ...prevReports]);
        } else {
          // If pending, just inform the user
          displayStatus('Your report is pending review by our AI moderator. It will be visible once approved.', false);
        }
      } else {
        displayStatus(response.data.message || 'Failed to submit construction report', true);
      }
    } catch (error) {
      console.error('Error submitting construction report:', error);
      displayStatus('Error submitting construction report', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ 
      padding: '10px', 
      backgroundColor: 'white', 
      color: 'black', 
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <div style={{ 
        width: '100%',
        maxWidth: '1000px', 
        margin: '0 auto', 
        backgroundColor: '#f9f9f9', 
        padding: '15px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#333', 
          fontSize: 'clamp(22px, 4vw, 28px)', 
          fontWeight: 'bold',
          marginBottom: '15px'
        }}>
          Visitor Assistance
        </h1>
        
        {showStatus && (
          <div style={{
            margin: '0 0 15px 0',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: statusMessage.isError ? '#fee2e2' : '#dbeafe',
            color: statusMessage.isError ? '#b91c1c' : '#1e40af',
            border: `1px solid ${statusMessage.isError ? '#fca5a5' : '#93c5fd'}`,
            fontSize: 'clamp(14px, 3vw, 16px)'
          }}>
            {statusMessage.message}
          </div>
        )}
        
        <div style={{
          height: 'clamp(300px, 50vh, 400px)',
          width: '100%',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '15px',
          overflow: 'hidden',
          backgroundColor: '#eee'
        }}>
          <MapComponent 
            center={CENTER}
            locations={locations}
            selectedParking={selectedParking}
            selectedBuilding={selectedBuilding}
            directions={directions}
            setDirections={setDirections}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: windowWidth >= 768 ? 'row' : 'column',
            gap: '15px'
          }}>
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              flex: windowWidth >= 768 ? '2 1 0%' : '1 1 100%'
            }}>
              <h2 style={{ 
                color: '#333', 
                fontSize: 'clamp(18px, 3.5vw, 20px)', 
                fontWeight: 'bold', 
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                Navigation Controls
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ 
                    color: '#666', 
                    fontSize: 'clamp(14px, 3vw, 16px)', 
                    fontWeight: 'bold', 
                    marginBottom: '5px',
                    display: 'block' 
                  }} htmlFor="parkingSelect">
                    Select Parking
                  </label>
                  <select
                    id="parkingSelect"
                    value={selectedParking}
                    onChange={(e) => setSelectedParking(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: 'clamp(14px, 3vw, 16px)'
                    }}
                  >
                    <option value="">Select Parking</option>
                    <option value="kensington">Kensington Garage</option>
                    <option value="25th">25th Ave Garage</option>
                    <option value="terrace">Terrace Garage</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ 
                    color: '#666', 
                    fontSize: 'clamp(14px, 3vw, 16px)', 
                    fontWeight: 'bold', 
                    marginBottom: '5px',
                    display: 'block'
                  }} htmlFor="buildingSelect">
                    Select Building
                  </label>
                  <select
                    id="buildingSelect"
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: 'clamp(14px, 3vw, 16px)'
                    }}
                  >
                    <option value="">Select Building</option>
                    <option value="sarrat">Sarrat/Rand</option>
                    <option value="slc">Student Life Center</option>
                    <option value="wondry">Wondry/ESB</option>
                    <option value="featheringill">Featheringill</option>
                  </select>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => {
                      setSelectedParking('');
                      setSelectedBuilding('');
                      setDirections(null);
                      setShowFloorPlan(false);
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#f9f9f9',
                      color: '#333',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      cursor: 'pointer'
                    }}
                  >
                    Reset
                  </button>
                  
                  <button
                    onClick={() => setShowConstructionForm(true)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      cursor: 'pointer'
                    }}
                  >
                    Report Construction
                  </button>
                </div>
                
                {selectedBuilding && showFloorPlan && (
                  <button
                    onClick={() => setShowFloorPlan(false)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#f44336',
                      color: '#fff',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Hide Floor Plan
                  </button>
                )}
                {selectedBuilding && !showFloorPlan && (
                  <button
                    onClick={() => setShowFloorPlan(true)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Show Floor Plan
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: '#f9f9f9', 
              padding: '15px', 
              borderRadius: '8px',
              flex: windowWidth >= 768 ? '1 1 0%' : '1 1 100%'
            }}>
              <h3 style={{ 
                color: '#333', 
                fontSize: 'clamp(16px, 3vw, 18px)', 
                fontWeight: 'bold', 
                marginBottom: '10px',
                textAlign: 'center'
              }}>
                Construction Reports
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {isLoading ? (
                  <p style={{ 
                    color: '#666', 
                    fontSize: 'clamp(12px, 2.5vw, 14px)', 
                    textAlign: 'center' 
                  }}>Loading construction reports...</p>
                ) : constructionReports.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {constructionReports.map((report) => (
                      <div key={report._id} style={{ 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd', 
                        backgroundColor: '#fff',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        <p style={{ 
                          color: '#333', 
                          fontSize: 'clamp(14px, 3vw, 16px)', 
                          fontWeight: 'bold' 
                        }}>{report.location}</p>
                        <p style={{ 
                          color: '#666', 
                          fontSize: 'clamp(12px, 2.5vw, 14px)'
                        }}>{report.description}</p>
                        <p style={{ 
                          color: '#999', 
                          fontSize: 'clamp(10px, 2vw, 12px)'
                        }}>{report.reportTime}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ 
                    color: '#666', 
                    fontSize: 'clamp(12px, 2.5vw, 14px)', 
                    textAlign: 'center' 
                  }}>No construction reports yet.</p>
                )}
              </div>
            </div>
          </div>
          
          {showFloorPlan && selectedBuilding && buildingDetails[selectedBuilding as keyof typeof buildingDetails] && (
            <div style={{ marginBottom: '15px' }}>
              <BuildingFloorPlan 
                buildingId={selectedBuilding} 
                buildingDetails={buildingDetails[selectedBuilding as keyof typeof buildingDetails]} 
              />
            </div>
          )}
          
          {showConstructionForm && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: '10px',
              zIndex: 1000
            }}>
              <ConstructionReportForm 
                onSubmit={(report) => handleConstructionReport(report.location, report.description)}
                onCancel={() => setShowConstructionForm(false)}
              />
            </div>
          )}
          
          <div style={{ paddingTop: '15px' }}>
            {/* Career Center Call Button */}
          <div style={{
            marginTop: '15px',
            marginBottom: '15px',
            backgroundColor: '#f0f4fa',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #d0e0f7'
          }}>
            <h3 style={{
              fontSize: 'clamp(16px, 3vw, 18px)',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              Need Additional Help?
            </h3>
            <p style={{
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              marginBottom: '10px',
              color: '#555',
              textAlign: 'center'
            }}>
              Contact the Vanderbilt Career Center for more information and assistance.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a 
                href="tel:6153222750" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: 'clamp(14px, 2.5vw, 16px)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                  style={{ marginRight: '8px' }}
                >
                  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
                </svg>
                Call Career Center (615-322-2750)
              </a>
            </div>
          </div>

          {directions && (
              <div>
                <h3 style={{ 
                  color: '#333', 
                  fontSize: 'clamp(16px, 3vw, 18px)', 
                  fontWeight: 'bold', 
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  Directions:
                </h3>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: '1px solid #ddd', 
                  backgroundColor: '#f9f9f9',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  {directions.routes[0]?.legs[0]?.steps.map((step, i) => (
                    <div key={i} style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #ddd',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>
                      <span style={{ 
                        color: '#333', 
                        fontSize: 'clamp(12px, 2.5vw, 14px)' 
                      }} dangerouslySetInnerHTML={{ __html: step.instructions.replace(/<\/?b>/g, '<span style="font-weight: bold;">').replace(/<\/?b>/g, '</span>') }} />
                      <span style={{ 
                        color: '#666', 
                        fontSize: 'clamp(10px, 2vw, 12px)', 
                        marginLeft: '10px' 
                      }}>
                        ({step.distance?.text})
                      </span>
                    </div>
                  ))}
                  <div style={{ 
                    marginTop: '10px', 
                    color: '#666', 
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    display: windowWidth >= 768 ? 'flex' : 'block',
                    flexDirection: windowWidth >= 768 ? 'row' : 'column',
                    gap: '5px'
                  }}>
                    <div style={{ 
                      flex: 1,
                      textAlign: windowWidth >= 768 ? 'left' : 'center',
                    }}>
                      <strong style={{ 
                        color: '#333', 
                        fontSize: 'clamp(14px, 3vw, 16px)' 
                      }}>Total Distance:</strong> {directions.routes[0]?.legs[0]?.distance?.text}
                    </div>
                    <div style={{ 
                      flex: 1,
                      textAlign: windowWidth >= 768 ? 'right' : 'center',
                    }}>
                      <strong style={{ 
                        color: '#333', 
                        fontSize: 'clamp(14px, 3vw, 16px)' 
                      }}>Estimated Time:</strong> {directions.routes[0]?.legs[0]?.duration?.text}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!directions && selectedParking && selectedBuilding && (
              <p style={{ 
                color: '#666', 
                fontSize: 'clamp(14px, 3vw, 16px)', 
                textAlign: 'center' 
              }}>Calculating route...</p>
            )}
            {!selectedParking && !selectedBuilding && (
              <p style={{ 
                color: '#666', 
                fontSize: 'clamp(14px, 3vw, 16px)', 
                textAlign: 'center' 
              }}>Select a parking location and destination building to begin.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
