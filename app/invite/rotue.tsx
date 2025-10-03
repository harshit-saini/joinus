// app/api/invite/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '../../lib/mongoose';
import Invite from '../../lib/models/invite';


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType } = body;
    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }


    await dbConnect();
    const invite = await Invite.create(body);


    return NextResponse.json({ id: invite._id.toString() });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}