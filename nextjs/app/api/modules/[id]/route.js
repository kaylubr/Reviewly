import { NextResponse } from 'next/server'
import { requireAuth, getAdminClient } from '@/lib/server'

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request)
    const { id } = await params
    const insforge = getAdminClient()

    // Verify ownership
    const { data: module, error: fetchErr } = await insforge.database
      .from('modules')
      .select('id, file_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchErr || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Delete associated data
    await Promise.all([
      insforge.database.from('flashcards').delete().eq('module_id', id),
      insforge.database.from('mcq_questions').delete().eq('module_id', id),
      insforge.database.from('sessions').delete().eq('module_id', id),
    ])

    // Delete module
    const { error: delErr } = await insforge.database
      .from('modules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (delErr) throw delErr

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err.status === 401) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('[delete module]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
