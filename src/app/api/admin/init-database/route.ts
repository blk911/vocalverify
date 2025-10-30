import { NextResponse } from 'next/server';
import {
  initializeDatabase,
  createSampleData,
  verifyDatabaseStructure,
} from '@/lib/databaseInit';
import { asyncHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export const POST = asyncHandler(async (req: Request) => {
  logger.info('Manual database initialization requested', 'DatabaseInit');

  try {
    // Verify current database structure
    const verification = await verifyDatabaseStructure();
    logger.info('Database verification result', 'DatabaseInit', verification);

    // Initialize database if needed
    if (verification.status !== 'healthy') {
      logger.info('Initializing database collections', 'DatabaseInit');
      const initResult = await initializeDatabase();

      if (!initResult) {
        throw new Error('Database initialization failed');
      }

      // Create sample data for testing
      logger.info('Creating sample data', 'DatabaseInit');
      const sampleResult = await createSampleData();

      if (!sampleResult) {
        logger.warn(
          'Sample data creation failed, but database is initialized',
          'DatabaseInit'
        );
      }
    }

    // Verify final state
    const finalVerification = await verifyDatabaseStructure();

    return NextResponse.json({
      ok: true,
      message: 'Database initialization completed',
      verification: finalVerification,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Database initialization failed', error, 'DatabaseInit');
    throw error;
  }
});

export const GET = asyncHandler(async (req: Request) => {
  logger.info('Database status check requested', 'DatabaseInit');

  try {
    const verification = await verifyDatabaseStructure();

    return NextResponse.json({
      ok: true,
      status: verification.status,
      collections: verification.collections,
      message: verification.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Database status check failed', error, 'DatabaseInit');
    throw error;
  }
});

























