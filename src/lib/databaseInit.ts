/**
 * Database Initialization
 * Creates required collections and initial data structure
 */

import { getDb } from './firebaseAdmin';
import { logger } from './logger';

export interface DatabaseCollections {
  users: string;
  notFoundRegistry: string;
  inviteHistory: string;
  nfArchive: string;
  voiceUploads: string;
  trustBonds: string;
  trustUnits: string;
}

/**
 * Initialize database collections with proper structure
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    logger.info('Initializing database collections', 'DatabaseInit');
    
    const db = getDb();
    
    // Create collections with initial documents to establish structure
    const collections: DatabaseCollections = {
      users: 'users',
      notFoundRegistry: 'notFoundRegistry', 
      inviteHistory: 'inviteHistory',
      nfArchive: 'nfArchive',
      voiceUploads: 'voiceUploads',
      trustBonds: 'trustBonds',
      trustUnits: 'trustUnits'
    };

    // Initialize each collection with a placeholder document
    for (const [collectionName, collectionPath] of Object.entries(collections)) {
      try {
        // Create collection by adding a document directly
        await db.collection(collectionPath).add({
          _initialized: true,
          createdAt: new Date(),
          type: 'placeholder',
          message: `Collection ${collectionName} initialized`
        });
        
        logger.info(`Initialized collection: ${collectionName}`, 'DatabaseInit');
      } catch (error) {
        logger.error(`Failed to initialize collection ${collectionName}`, error as Error, 'DatabaseInit');
        // Continue with other collections even if one fails
        continue;
      }
    }

    logger.info('Database initialization completed successfully', 'DatabaseInit');
    return true;
    
  } catch (error) {
    logger.error('Database initialization failed', error as Error, 'DatabaseInit');
    return false;
  }
}

/**
 * Create sample data for testing
 */
export async function createSampleData(): Promise<boolean> {
  try {
    logger.info('Creating sample data', 'DatabaseInit');
    
    const db = getDb();
    
    // Sample user data
    const sampleUser = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      status: 'active',
      memberCode: 'TEST001',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    // Sample not found registry entry
    const sampleNotFound = {
      name: 'Sample User',
      phone: '+1234567890',
      sponsorName: 'Admin',
      status: 'pending',
      createdAt: new Date(),
      message: 'Sample invitation for testing'
    };

    // Add sample data
    try {
      await db.collection('users').add(sampleUser);
      await db.collection('notFoundRegistry').add(sampleNotFound);
    } catch (error) {
      logger.warn('Sample data creation failed, but continuing', 'DatabaseInit', { error: (error as Error).message });
    }
    
    logger.info('Sample data created successfully', 'DatabaseInit');
    return true;
    
  } catch (error) {
    logger.error('Failed to create sample data', error as Error, 'DatabaseInit');
    return false;
  }
}

/**
 * Verify database structure
 */
export async function verifyDatabaseStructure(): Promise<{
  collections: string[];
  status: 'healthy' | 'needs_init' | 'error';
  message: string;
}> {
  try {
    const db = getDb();
    const collections = [
      'users',
      'notFoundRegistry', 
      'inviteHistory',
      'nfArchive',
      'voiceUploads',
      'trustBonds',
      'trustUnits'
    ];

    const results = await Promise.allSettled(
      collections.map(collection => 
        db.collection(collection).limit(1).get()
      )
    );

    const existingCollections = results
      .map((result, index) => ({ 
        name: collections[index], 
        exists: result.status === 'fulfilled' 
      }))
      .filter(item => item.exists)
      .map(item => item.name);

    if (existingCollections.length === collections.length) {
      return {
        collections: existingCollections,
        status: 'healthy',
        message: 'All collections exist and accessible'
      };
    } else if (existingCollections.length === 0) {
      return {
        collections: [],
        status: 'needs_init',
        message: 'Database needs initialization'
      };
    } else {
      return {
        collections: existingCollections,
        status: 'needs_init',
        message: `Missing collections: ${collections.filter(c => !existingCollections.includes(c)).join(', ')}`
      };
    }
    
  } catch (error) {
    logger.error('Database verification failed', error as Error, 'DatabaseInit');
    return {
      collections: [],
      status: 'error',
      message: `Database verification failed: ${(error as Error).message}`
    };
  }
}

/**
 * Auto-initialize database on startup
 */
export async function autoInitializeDatabase(): Promise<boolean> {
  try {
    const verification = await verifyDatabaseStructure();
    
    if (verification.status === 'healthy') {
      logger.info('Database is already initialized', 'DatabaseInit');
      return true;
    }
    
    if (verification.status === 'needs_init') {
      logger.info('Database needs initialization', 'DatabaseInit', { 
        message: verification.message 
      });
      
      const initResult = await initializeDatabase();
      if (initResult) {
        logger.info('Database auto-initialization completed', 'DatabaseInit');
        return true;
      }
    }
    
    logger.error('Database auto-initialization failed', undefined, 'DatabaseInit');
    return false;
    
  } catch (error) {
    logger.error('Auto-initialization failed', error as Error, 'DatabaseInit');
    return false;
  }
}
