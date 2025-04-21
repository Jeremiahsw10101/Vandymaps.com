'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BuildingDetails {
  name: string;
  description: string;
  pages: number; // Changed from floors to pages
  hasAccessibility: boolean;
  floorPlanPdfs?: string; // Path to the PDF file
  floorPlanImages?: string[]; // Preview images for each page
}

interface BuildingFloorPlanProps {
  buildingId: string;
  buildingDetails: BuildingDetails;
}

const BuildingFloorPlan: React.FC<BuildingFloorPlanProps> = ({ buildingId, buildingDetails }) => {
  const [activeFloor, setActiveFloor] = useState(0);
  
  // Get the PDF path based on the building ID
  const getPdfPath = () => {
    // Map building IDs to their PDF files
    const pdfMap: {[key: string]: string} = {
      'featheringill': '/floor-plans/Featheringhill.pdf',
      'sarrat': '/floor-plans/Sarratt_Rand.pdf',
      'slc': '/floor-plans/Student Life Center.pdf',
      'wondry': '/floor-plans/Wondry_ESB.pdf'
    };
    
    return buildingDetails.floorPlanPdfs || pdfMap[buildingId] || '';
  };
  
  // Get preview image path for a specific page
  const getPreviewImagePath = (pageIndex: number) => {
    // Map building IDs to their preview image name formats
    const buildingNames: {[key: string]: string} = {
      'featheringill': 'Featheringhill',
      'sarrat': 'Sarratt_Rand',
      'slc': 'Student Life Center',
      'wondry': 'Wondry_ESB'
    };
    
    // Get the appropriate building name for the file
    const buildingName = buildingNames[buildingId] || buildingId;
    
    // Format: /floor-plans/previews/[BuildingName] [pageNumber].jpg
    // Encode the URL to handle special characters like & and :
    return encodeURI(`/floor-plans/previews/${buildingName} ${pageIndex + 1}.jpg`);
  };
  
  // For backward compatibility
  const placeholderImages = [
    'https://placehold.co/800x600/e2e8f0/1e293b?text=Floor+1+Plan',
    'https://placehold.co/800x600/e2e8f0/1e293b?text=Floor+2+Plan',
    'https://placehold.co/800x600/e2e8f0/1e293b?text=Floor+3+Plan',
    'https://placehold.co/800x600/e2e8f0/1e293b?text=Floor+4+Plan'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-200">
      <div className="p-4 bg-blue-100 border-b border-blue-200">
        <h3 className="text-xl font-bold text-blue-900">{buildingDetails.name} Floor Plan</h3>
        <p className="text-blue-800 mt-1">{buildingDetails.description}</p>
      </div>
      
      <div className="p-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
          
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: buildingDetails.pages }, (_, i) => (
              <button
                key={i}
                onClick={() => setActiveFloor(i)}
                className={`px-3 py-1 text-sm rounded-md transition duration-200 ${
                  activeFloor === i
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 font-semibold'
                }`}
              >
                Page {i + 1}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative h-[250px] sm:h-[400px] bg-blue-50 rounded-lg overflow-hidden border border-blue-200">
          {getPdfPath() ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
                {/* Display the image preview instead of PDF */}
                <img 
                  src={getPreviewImagePath(activeFloor)}
                  alt={`${buildingDetails.name} Page ${activeFloor + 1}`}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                  // Add debugging info to image error handling
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error(`Failed to load image: ${target.src}`);
                    target.onerror = null;
                    target.src = activeFloor < placeholderImages.length ? 
                      placeholderImages[activeFloor] : 
                      placeholderImages[0];
                  }}
                />
              </div>
              
              <a
                href={encodeURI(getPdfPath())}
                download={`${buildingDetails.name.replace(/[\s\/]/g, '-')}-Floor-Plan.pdf`}
                className="absolute bottom-14 right-4 z-10 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium text-sm transition duration-150 ease-in-out shadow-md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Floor Plans
              </a>
            </div>
          ) : (
            // Fallback to placeholder images if no PDF available
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={activeFloor < placeholderImages.length ? placeholderImages[activeFloor] : placeholderImages[0]} 
                alt={`${buildingDetails.name} Page ${activeFloor + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/70 to-transparent p-4">
            <div className="text-white">
              <p className="font-bold">Page {activeFloor + 1}</p>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
};

export default BuildingFloorPlan;
