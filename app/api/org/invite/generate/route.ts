import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

const generateInviteSchema = z.object({
  orgId: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify requester is Org Admin or Super Admin
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single<{ org_id: string | null; role: string }>()

    if (!requesterProfile || (requesterProfile.role !== 'org_admin' && requesterProfile.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 })
    }

    const json = await req.json()
    const { orgId } = generateInviteSchema.parse(json)

    // Verify the requester belongs to the organization
    if (requesterProfile.role !== 'super_admin' && requesterProfile.org_id !== orgId) {
      return NextResponse.json({ error: 'Forbidden: Cannot create invites for other organizations' }, { status: 403 })
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Set expiry to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Use admin client to insert the invite token
    const adminSupabase = createAdminClient()
    const { data: inviteToken, error } = await (adminSupabase
      .from('invite_tokens') as any)
      .insert({
        org_id: orgId,
        role: 'technician',
        email: 'pending@invite.link', // Placeholder for link-based invites
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating invite token:', error)
      return NextResponse.json({ error: 'Failed to create invite token' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      token: token,
      expiresAt: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('Error generating invite link:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
