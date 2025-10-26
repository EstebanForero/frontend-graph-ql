import { useState } from 'react'

const sampleSchema = {
  students: {
    id: 'ID!',
    name: 'String!',
    career: 'String!',
    email: 'String!',
    age: 'Int',
    createdAt: 'String'
  },
  cat: {
    id: 'ID!',
    name: 'String!',
    breed: 'String!',
    color: 'String!',
    age: 'Int',
    createdAt: 'String'
  }
}

interface FieldConfig {
  [key: string]: boolean
}

interface GraphQLResponse {
  data?: any
  errors?: Array<{ message: string }>
}


export default function GraphQLInterface() {
  const [selectedStudentFields, setSelectedStudentFields] = useState<FieldConfig>({})
  const [selectedCatFields, setSelectedCatFields] = useState<FieldConfig>({})
  const [generatedStudentQuery, setGeneratedStudentQuery] = useState('')
  const [generatedCatQuery, setGeneratedCatQuery] = useState('')
  const [studentResponse, setStudentResponse] = useState<GraphQLResponse | null>(null)
  const [catResponse, setCatResponse] = useState<GraphQLResponse | null>(null)
  const [studentLoading, setStudentLoading] = useState(false)
  const [catLoading, setCatLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catId, setCatId] = useState('')

  const handleStudentFieldToggle = (field: string) => {
    setSelectedStudentFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleCatFieldToggle = (field: string) => {
    setSelectedCatFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const generateStudentsQuery = () => {
    const selectedFields = Object.keys(selectedStudentFields).filter(field => selectedStudentFields[field])
    if (selectedFields.length === 0) return ''

    const query = `
query Students {
  students {
    ${selectedFields.join('\n    ')}
  }
}`.trim()

    return query
  }

  const generateCatQuery = () => {
    const selectedFields = Object.keys(selectedCatFields).filter(field => selectedCatFields[field])
    if (selectedFields.length === 0) return ''

    const query = `
query GetCatById($id: ID!) {
  cat(id: $id) {
    ${selectedFields.join('\n    ')}
  }
}`.trim()

    return query
  }

  const handleExecuteStudentQuery = async () => {
    const selectedFields = Object.keys(selectedStudentFields).filter(field => selectedStudentFields[field])
    if (selectedFields.length === 0) {
      alert('Please select at least one field')
      return
    }

    const queryStr = generateStudentsQuery()

    setStudentLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryStr
        })
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : null
      setGeneratedStudentQuery(queryStr)
      setStudentResponse(data)

      if (data && data.errors && data.errors.length > 0) {
        setError(data.errors[0].message)
      }
    } catch (error: any) {
      setError('Network error: ' + (error?.message || 'Unknown error'))
      console.error('Error executing query:', error)
    } finally {
      setStudentLoading(false)
    }
  }

  const handleExecuteCatQuery = async () => {
    if (!catId.trim()) {
      alert('Please enter a cat ID')
      return
    }

    const selectedFields = Object.keys(selectedCatFields).filter(field => selectedCatFields[field])
    if (selectedFields.length === 0) {
      alert('Please select at least one field')
      return
    }

    const queryStr = generateCatQuery()

    setCatLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryStr,
          variables: { id: catId }
        })
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : null
      setGeneratedCatQuery(queryStr)
      setCatResponse(data)

      if (data && data.errors && data.errors.length > 0) {
        setError(data.errors[0].message)
      }
    } catch (error: any) {
      setError('Network error: ' + (error?.message || 'Unknown error'))
      console.error('Error executing query:', error)
    } finally {
      setCatLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text drop-shadow-lg">
          GraphQL Query Interface
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></span>
              Query Students
            </h2>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Select Fields:</h3>
              <div className="space-y-3">
                {Object.keys(sampleSchema.students).filter(field => field !== 'id').map(field => (
                  <label key={field} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedStudentFields[field] || false}
                        onChange={() => handleStudentFieldToggle(field)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 bg-slate-700/50 border-2 border-purple-500/30 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-blue-500 peer-checked:border-purple-400 transition-all duration-200 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-purple-300 transition-colors duration-200">{field}</span>
                    <span className="text-xs text-gray-500 ml-auto">({sampleSchema.students[field as keyof typeof sampleSchema.students]})</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleExecuteStudentQuery}
              disabled={studentLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/50 disabled:shadow-none"
            >
              {studentLoading ? 'Executing...' : 'Execute Query'}
            </button>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse"></span>
                Student Response
              </h3>
              <div className="bg-slate-900/90 border border-purple-500/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-cyan-300 whitespace-pre-wrap font-mono">
                  {studentLoading ? 'Loading...' : error ? `Error: ${error}` : studentResponse ? JSON.stringify(studentResponse, null, 2) : 'No data yet'}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generated Student Query</h3>
            <div className="bg-slate-900/80 border border-purple-500/20 rounded-lg p-4">
              <pre className="text-sm text-purple-300 whitespace-pre-wrap font-mono">
                {generatedStudentQuery || generateStudentsQuery() || 'Select fields to generate query'}
              </pre>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border border-pink-500/30 rounded-xl shadow-2xl shadow-pink-500/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full"></span>
              Query Cat by ID
            </h2>

            <div className="mb-6">
              <label htmlFor="catId" className="block text-sm font-medium text-gray-300 mb-2">
                Cat ID
              </label>
              <input
                type="text"
                id="catId"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-pink-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-gray-400 shadow-lg"
                placeholder="Enter cat ID"
              />
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Select Fields:</h3>
              <div className="space-y-3">
                {Object.keys(sampleSchema.cat).filter(field => field !== 'id').map(field => (
                  <label key={field} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedCatFields[field] || false}
                        onChange={() => handleCatFieldToggle(field)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 bg-slate-700/50 border-2 border-pink-500/30 rounded-md peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-orange-500 peer-checked:border-pink-400 transition-all duration-200 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-pink-300 transition-colors duration-200">{field}</span>
                    <span className="text-xs text-gray-500 ml-auto">({sampleSchema.cat[field as keyof typeof sampleSchema.cat]})</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleExecuteCatQuery}
              disabled={catLoading}
              className="w-full bg-gradient-to-r from-pink-600 to-orange-500 text-white py-3 px-6 rounded-lg hover:from-pink-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-pink-500/50 disabled:shadow-none"
            >
              {catLoading ? 'Executing...' : 'Execute Query'}
            </button>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse"></span>
                Cat Response
              </h3>
              <div className="bg-slate-900/90 border border-pink-500/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-pink-300 whitespace-pre-wrap font-mono">
                  {catLoading ? 'Loading...' : error ? `Error: ${error}` : catResponse ? JSON.stringify(catResponse, null, 2) : 'No data yet'}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border border-pink-500/20 rounded-xl shadow-2xl shadow-pink-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generated Cat Query</h3>
            <div className="bg-slate-900/80 border border-pink-500/20 rounded-lg p-4">
              <pre className="text-sm text-pink-300 whitespace-pre-wrap font-mono">
                {generatedCatQuery || generateCatQuery() || 'Select fields to generate query'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}