const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  candidates: {
    list: () => req('/api/candidates/'),
    get:  (id: string) => req(`/api/candidates/${id}`),
    create: (body: unknown) => req('/api/candidates/', { method: 'POST', body: JSON.stringify(body) }),
  },
  jobs: {
    list: () => req('/api/jobs/'),
    get:  (id: string) => req(`/api/jobs/${id}`),
    create: (body: unknown) => req('/api/jobs/', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => req(`/api/jobs/${id}`, { method: 'DELETE' }),
  },
  matching: {
    run:  (candidateId: string, jobId: string) =>
      req(`/api/matching/${candidateId}/${jobId}`, { method: 'POST' }),
    forCandidate: (candidateId: string) =>
      req(`/api/matching/candidate/${candidateId}`),
  },
  upload: {
    cv: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API}/api/upload/cv`, { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed')
      return res.json()
    },
  },
}
