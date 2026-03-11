export async function apiFetch<T>(url: string): Promise<{ data: T; total?: number }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
