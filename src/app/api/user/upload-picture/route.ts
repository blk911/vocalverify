import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log('\n🔥🔥🔥 [UPLOAD-PICTURE] API CALLED 🔥🔥🔥');
    const { memberCode, profilePicture } = await req.json();
    console.log('[UPLOAD-PICTURE] memberCode:', memberCode);
    
    if (!memberCode || !profilePicture) {
      console.log('[UPLOAD-PICTURE] ❌ Missing required fields');
      return NextResponse.json(
        { ok: false, error: "Member code and profile picture are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Get user data to find sponsor
    console.log('[UPLOAD-PICTURE] Fetching user data...');
    const userDoc = await db.collection('users').doc(memberCode).get();
    if (!userDoc.exists) {
      console.log('[UPLOAD-PICTURE] ❌ User not found');
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const sponsorId = userData?.sponsorId;
    const sponsorMemberCode = userData?.sponsorMemberCode || sponsorId;
    
    console.log('[UPLOAD-PICTURE] User data:', {
      name: userData?.name,
      sponsorId,
      sponsorMemberCode,
      sponsorName: userData?.sponsorName,
      status: userData?.status
    });
    
    // Update user with profile picture and complete registration
    console.log('[UPLOAD-PICTURE] Updating user status to registered...');
    await db.collection('users').doc(memberCode).update({
      profilePicture: profilePicture,
      selfieUploadedAt: new Date().toISOString(),
      status: 'registered', // Complete registration when selfie uploaded
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ [UPLOAD-PICTURE] User ${memberCode} registration completed with selfie upload`);

    // ⚡ CRITICAL: Create sponsor divisions (trust unit + trust bond)
    console.log('[UPLOAD-PICTURE] Checking sponsor eligibility...');
    console.log('[UPLOAD-PICTURE] sponsorId:', sponsorId);
    console.log('[UPLOAD-PICTURE] Is admin sponsor?', sponsorId === '0000000000');
    
    if (sponsorId && sponsorId !== '0000000000') {
      console.log(`\n🔥🔥🔥 [UPLOAD-PICTURE] CREATING SPONSOR DIVISIONS 🔥🔥🔥`);
      console.log(`🔗 Member: ${memberCode} (${userData?.name})`);
      console.log(`🔗 Sponsor: ${sponsorMemberCode} (${userData?.sponsorName})`);
      
      try {
        // 1. Create trust bond from sponsor to new member
        console.log('[UPLOAD-PICTURE] Step 1: Creating trust bond...');
        const bondData = {
          fromMemberCode: sponsorMemberCode,
          toMemberCode: memberCode,
          fromMemberName: userData?.sponsorName || 'Sponsor',
          toMemberName: userData?.name || 'Member',
          status: 'accepted', // Auto-accept for sponsor relationships
          message: 'Sponsor relationship',
          createdAt: new Date(),
          acceptedAt: new Date(),
          updatedAt: new Date(),
          type: 'sponsor' // Mark as sponsor bond
        };
        
        const bondRef = await db.collection('trustBonds').add(bondData);
        console.log(`✅ [UPLOAD-PICTURE] Trust bond created: ${bondRef.id}`);
        console.log(`✅ [UPLOAD-PICTURE] Bond: ${sponsorMemberCode} → ${memberCode}`);
        
        // 2. Create trust connection (bidirectional)
        console.log('[UPLOAD-PICTURE] Step 2: Creating trust connection...');
        const connectionData = {
          member1Code: sponsorMemberCode,
          member2Code: memberCode,
          member1Name: userData?.sponsorName || 'Sponsor',
          member2Name: userData?.name || 'Member',
          bondId: bondRef.id,
          status: 'active',
          createdAt: new Date(),
          type: 'sponsor'
        };
        
        const connectionRef = await db.collection('trustConnections').add(connectionData);
        console.log(`✅ [UPLOAD-PICTURE] Trust connection created: ${connectionRef.id}`);
        console.log(`✅ [UPLOAD-PICTURE] Connection: ${sponsorMemberCode} ↔ ${memberCode}`);
        
        // 3. Create or update trust unit
        console.log('[UPLOAD-PICTURE] Step 3: Creating/updating trust unit...');
        await createOrUpdateTrustUnit(db, sponsorMemberCode, memberCode);
        
        console.log(`\n🎉🎉🎉 [UPLOAD-PICTURE] SPONSOR DIVISIONS COMPLETE 🎉🎉🎉\n`);
      } catch (divError: any) {
        console.error('\n❌❌❌ [UPLOAD-PICTURE] ERROR CREATING SPONSOR DIVISIONS ❌❌❌');
        console.error('[UPLOAD-PICTURE] Error details:', divError);
        // Don't fail the entire request if division creation fails
      }
    } else {
      console.log('[UPLOAD-PICTURE] ℹ️ No sponsor or admin sponsor (0000000000), skipping division creation');
    }

    return NextResponse.json({
      ok: true,
      message: "Profile picture uploaded successfully and registration completed",
      user: {
        memberCode: memberCode,
        hasProfilePicture: true,
        status: 'registered'
      },
      sponsorDivisionsCreated: sponsorId && sponsorId !== '0000000000'
    });

  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { ok: false, error: "Failed to upload profile picture" },
      { status: 500 }
    );
  }
}

/**
 * Helper: Create or update trust unit with sponsor and new member
 */
async function createOrUpdateTrustUnit(db: any, sponsorCode: string, memberCode: string) {
  try {
    // Check if sponsor already has a trust unit
    const sponsorUnitQuery = await db.collection('trustUnits')
      .where('members', 'array-contains', sponsorCode)
      .limit(1)
      .get();
    
    if (!sponsorUnitQuery.empty) {
      // Sponsor has a unit, add new member to it
      const unitDoc = sponsorUnitQuery.docs[0];
      const unitData = unitDoc.data();
      const currentMembers = unitData.members || [];
      
      // Only add if not already in unit
      if (!currentMembers.includes(memberCode)) {
        await unitDoc.ref.update({
          members: [...currentMembers, memberCode],
          size: currentMembers.length + 1,
          updatedAt: new Date()
        });
        console.log(`✅ Added ${memberCode} to existing trust unit ${unitDoc.id}`);
      }
    } else {
      // Create new trust unit with sponsor and new member
      const newUnitData = {
        members: [sponsorCode, memberCode],
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 2,
        sponsorCode: sponsorCode,
        status: 'active'
      };
      
      const unitRef = await db.collection('trustUnits').add(newUnitData);
      console.log(`✅ Created new trust unit: ${unitRef.id}`);
    }
  } catch (error) {
    console.error('Error in createOrUpdateTrustUnit:', error);
    throw error;
  }
}
