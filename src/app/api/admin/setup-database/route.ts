import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export const POST = async (req: Request) => {
  try {
    logger.info('Starting direct database setup', 'DatabaseSetup');
    
    const db = getDb();
    
    // Create collections by adding documents
    const collections = [
      'users',
      'notFoundRegistry', 
      'invites',
      'voice_uploads',
      'voice_biometrics',
      'verification_logs',
      'trustUnits',
      'trustBonds',
      'trustConnections',
      'nfArchive',
      'tempMembers'
    ];

    const results = [];
    
    for (const collectionName of collections) {
      try {
        // Add a simple document to create the collection
        const docRef = await db.collection(collectionName).add({
          _setup: true,
          createdAt: new Date(),
          collection: collectionName
        });
        
        results.push({
          collection: collectionName,
          status: 'created',
          docId: docRef.id
        });
        
        logger.info(`Created collection: ${collectionName}`, 'DatabaseSetup');
        
      } catch (error: any) {
        results.push({
          collection: collectionName,
          status: 'failed',
          error: error.message
        });
        
        logger.error(`Failed to create collection ${collectionName}`, error, 'DatabaseSetup');
      }
    }

    // Add sample data
    try {
      // Sample user
      await db.collection('users').add({
        name: 'Test User',
        memberCode: 'TEST001',
        phone: '+1234567890',
        status: 'active',
        createdAt: new Date(),
        hasVoice: false
      });

      // Sample not found entry
      await db.collection('notFoundRegistry').add({
        name: 'Sample Person',
        phone: '+1234567890',
        sponsorName: 'Admin',
        status: 'pending',
        createdAt: new Date()
      });

      logger.info('Sample data added successfully', 'DatabaseSetup');
      
    } catch (error: any) {
      logger.warn('Sample data creation failed', error, 'DatabaseSetup');
    }

    return NextResponse.json({
      ok: true,
      message: 'Database setup completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Database setup failed', error, 'DatabaseSetup');
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Database setup failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
};

export const GET = async (req: Request) => {
  try {
    const db = getDb();
    
    // Check which collections exist
    const collections = [
      'users',
      'notFoundRegistry', 
      'invites',
      'voice_uploads',
      'voice_biometrics',
      'verification_logs',
      'trustUnits',
      'trustBonds',
      'trustConnections',
      'nfArchive',
      'tempMembers'
    ];

    const status = [];
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        status.push({
          collection: collectionName,
          exists: !snapshot.empty,
          docCount: snapshot.size
        });
      } catch (error: any) {
        status.push({
          collection: collectionName,
          exists: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      ok: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Database status check failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
};











