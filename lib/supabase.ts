import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function initializeRanks() {
  const { error: createError } = await supabase.rpc('create_ranks_table');
  if (createError) {
    console.error('Error creating ranks table:', createError);
    return;
  }

  // Update ranks with new colors
  const { error: updateError } = await supabase
    .from('ranks')
    .upsert([
      { level: 1, title: 'Operator Level 1', min_xp: 0, max_xp: 999, color: 'text-emerald-400' },
      { level: 2, title: 'Operator Level 2', min_xp: 1000, max_xp: 2499, color: 'text-cyan-400' },
      { level: 3, title: 'Operator Level 3', min_xp: 2500, max_xp: 4999, color: 'text-fuchsia-400' },
      { level: 4, title: 'Senior Operator', min_xp: 5000, max_xp: 9999, color: 'text-amber-400' },
      { level: 5, title: 'Matrix Controller', min_xp: 10000, max_xp: 19999, color: 'text-rose-400' },
      { level: 6, title: 'Matrix Architect', min_xp: 20000, max_xp: 49999, color: 'text-violet-400' },
      { level: 7, title: 'The One', min_xp: 50000, max_xp: 2147483647, color: 'text-white' }
    ], {
      onConflict: 'level'
    });

  if (updateError) {
    console.error('Error updating rank colors:', updateError);
  }
}