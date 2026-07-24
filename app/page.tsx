import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: parts, error } = await supabase.from('parts_master').select('*')

  return (
    <main style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Shamsi Store - Orodha ya Spea</h1>
      
      {error && <p style={{ color: 'red' }}>Kosa: {error.message}</p>}

      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Namba ya Spea</th>
            <th>Jina la Spea</th>
            <th>Kundi</th>
            <th>Kiwango cha Chini</th>
          </tr>
        </thead>
        <tbody>
          {parts?.map((part) => (
            <tr key={part.id}>
              <td>{part.part_number}</td>
              <td>{part.part_name}</td>
              <td>{part.category}</td>
              <td>{part.min_stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
