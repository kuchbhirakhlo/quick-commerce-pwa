import { NextRequest, NextResponse } from 'next/server';
import { getGlobalPincodes, addGlobalPincode, removeGlobalPincode } from '@/lib/firebase/admin';

// GET - Retrieve all global pincodes
export async function GET() {
    try {
        const pincodes = await getGlobalPincodes();
        return NextResponse.json({ pincodes });
    } catch (error) {
        console.error('Error fetching pincodes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pincodes' },
            { status: 500 }
        );
    }
}

// POST - Add a new pincode
export async function POST(request: NextRequest) {
    try {
        const { pincode } = await request.json();

        if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
            return NextResponse.json(
                { error: 'Invalid pincode format. Must be a 6-digit number' },
                { status: 400 }
            );
        }

        const success = await addGlobalPincode(pincode);
        if (success) {
            // Return updated list of pincodes
            const pincodes = await getGlobalPincodes();
            return NextResponse.json({
                success: true,
                message: `Pincode ${pincode} added successfully`,
                pincodes
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to add pincode' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error adding pincode:', error);
        return NextResponse.json(
            { error: 'Failed to add pincode' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a pincode
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');

        if (!pincode) {
            return NextResponse.json(
                { error: 'Pincode parameter is required' },
                { status: 400 }
            );
        }

        if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
            return NextResponse.json(
                { error: 'Invalid pincode format. Must be a 6-digit number' },
                { status: 400 }
            );
        }

        const success = await removeGlobalPincode(pincode);
        if (success) {
            // Return updated list of pincodes
            const pincodes = await getGlobalPincodes();
            return NextResponse.json({
                success: true,
                message: `Pincode ${pincode} removed successfully`,
                pincodes
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to remove pincode' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error removing pincode:', error);
        return NextResponse.json(
            { error: 'Failed to remove pincode' },
            { status: 500 }
        );
    }
}