import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStorage() {
  try {
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .list('folder', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      })

    if (error) {
      console.error('Error listing files:', error)
      return
    }

    console.log('Files in avatars/folder:', data)
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the test
testStorage()