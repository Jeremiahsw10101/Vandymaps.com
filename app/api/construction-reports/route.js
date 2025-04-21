// app/api/construction-reports/route.js
import dbConnect from '@/app/utils/dbConnect';
import { moderateConstructionReport } from '@/app/utils/contentModeration';
import { NextResponse } from 'next/server';

// We need to require the model this way to avoid issues with Next.js API routes
let ConstructionReport;
try {
  ConstructionReport = require('@/app/models/ConstructionReport');
} catch {
  // Model will be required on demand
}

// In-memory fallback when database isn't available
const memoryReports = [];

export async function GET() {
  try {
    const db = await dbConnect();
    
    // If database connection failed, use memory fallback
    if (!db.connection?.isConnected) {
      return NextResponse.json({ 
        success: true, 
        reports: memoryReports,
        source: 'memory'
      });
    }
    
    // Only return approved reports from database
    const reports = await ConstructionReport.find({ status: 'approved' })
      .sort({ reportTime: -1 }) // Sort by newest first
      .limit(50); // Limit to 50 most recent reports

    return NextResponse.json({ success: true, reports, source: 'database' });
  } catch (error) {
    console.error('Error fetching construction reports:', error);
    
    // Fallback to in-memory reports if database query fails
    return NextResponse.json({ 
      success: true, 
      reports: memoryReports,
      source: 'memory',
      warning: 'Using fallback memory storage due to database error'
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { location, description, coordinates } = body;

    // Validate input
    if (!location || !description) {
      return NextResponse.json(
        { success: false, message: 'Location and description are required' },
        { status: 400 }
      );
    }

    // Try to connect to the database
    const db = await dbConnect();
    const databaseAvailable = db.connection?.isConnected;
    
    // Moderate the content using OpenAI
    const moderation = await moderateConstructionReport(location, description);
    
    // Create the report object
    const reportData = {
      location,
      description,
      coordinates,
      status: moderation.isAppropriate ? 'approved' : 'pending',
      moderationResult: moderation.result,
      reportTime: new Date()
    };
    
    let savedReport;
    
    // Save to database if available, otherwise use memory fallback
    if (databaseAvailable) {
      // Create the construction report in MongoDB
      const report = new ConstructionReport(reportData);
      savedReport = await report.save();
    } else {
      // Add to in-memory array as fallback
      const memoryReport = {
        _id: `memory-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
        ...reportData
      };
      memoryReports.unshift(memoryReport); // Add to beginning of array
      
      // Keep only the 50 most recent reports in memory
      if (memoryReports.length > 50) {
        memoryReports.pop();
      }
      
      savedReport = memoryReport;
    }

    return NextResponse.json({
      success: true,
      message: moderation.isAppropriate 
        ? 'Construction report submitted and approved' 
        : 'Report submitted and pending review',
      report: savedReport,
      source: databaseAvailable ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Error saving construction report:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit construction report', error: error.message },
      { status: 500 }
    );
  }
}
