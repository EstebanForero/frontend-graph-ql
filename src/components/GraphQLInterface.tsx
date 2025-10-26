import { useState } from 'react'

const GRAPHQL_URL = 'https://graphql.sabanus.site/api/graphql'

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
    id: 'String!',
    name: 'String!',
    description: 'String',
    temperament: 'String',
    origin: 'String',
    lifeSpan: 'String',
    weight: 'CatWeight',
    image: 'CatImage'
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
  const [validCatBreeds, setValidCatBreeds] = useState<string[]>([])
  const [showBreedsDropdown, setShowBreedsDropdown] = useState(false)
  const [filteredBreeds, setFilteredBreeds] = useState<string[]>([])

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

  const fetchCatBreeds = async () => {
    try {
      const query = `
        query {
          catBreeds {
            id
          }
        }
      `

      const data = await executeGraphQLQuery(query)

      if (data?.data?.catBreeds) {
        const breedIds = data.data.catBreeds.map((breed: any) => breed.id)
        setValidCatBreeds(breedIds)
      }
    } catch (error) {
      console.error('Error fetching cat breeds:', error)
    }
  }

  const isValidBreedId = (id: string): boolean => {
    return validCatBreeds.includes(id)
  }

  const handleCatIdChange = (value: string) => {
    setCatId(value)
    setShowBreedsDropdown(true)

    const filtered = validCatBreeds.filter(breed =>
      breed.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredBreeds(filtered)
  }

  const selectBreed = (breedId: string) => {
    setCatId(breedId)
    setShowBreedsDropdown(false)
    setFilteredBreeds([])
  }

  const handleInputFocus = () => {
    if (validCatBreeds.length === 0) {
      fetchCatBreeds()
    }
    setShowBreedsDropdown(true)
    if (catId.trim()) {
      const filtered = validCatBreeds.filter(breed =>
        breed.toLowerCase().includes(catId.toLowerCase())
      )
      setFilteredBreeds(filtered)
    } else {
      setFilteredBreeds(validCatBreeds)
    }
  }

  const handleInputBlur = () => {
    setTimeout(() => setShowBreedsDropdown(false), 200)
  }

  const executeGraphQLQuery = async (query: string, variables?: any) => {
    try {
      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...(variables && { variables })
        })
      })

      const text = await response.text()
      return text ? JSON.parse(text) : null
    } catch (error) {
      console.error('GraphQL request error:', error)
      throw error
    }
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

    let queryFields = selectedFields.map(field => {
      if (field === 'weight') {
        return `weight {
          imperial
          metric
        }`
      } else if (field === 'image') {
        return `image {
          url
          width
          height
        }`
      }
      return field
    })

    const query = `
query GetCatById($id: String!) {
  catBreed(id: $id) {
    ${queryFields.join('\n    ')}
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
      const data = await executeGraphQLQuery(queryStr)
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
      alert('Please enter a cat breed ID')
      return
    }

    if (!isValidBreedId(catId)) {
      alert('Invalid cat breed ID. Please select a valid breed from the suggestions.')
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
      const data = await executeGraphQLQuery(queryStr, { id: catId })
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
              Query Cat Breed by ID
            </h2>

            <div className="mb-6 relative">
              <label htmlFor="catId" className="block text-sm font-medium text-gray-300 mb-2">
                Cat Breed ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="catId"
                  value={catId}
                  onChange={(e) => handleCatIdChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-gray-400 shadow-lg transition-all duration-200 ${
                    catId && !isValidBreedId(catId)
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-pink-500/30 focus:ring-pink-500'
                  }`}
                  placeholder="Enter cat breed ID"
                />
                {catId && !isValidBreedId(catId) && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {showBreedsDropdown && filteredBreeds.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-pink-500/30 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {filteredBreeds.map((breed) => (
                    <button
                      key={breed}
                      onClick={() => selectBreed(breed)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-pink-500/20 hover:text-pink-300 transition-colors duration-150 border-b border-pink-500/10 last:border-b-0"
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              )}
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
                Cat Breed Response
              </h3>
              <div className="bg-slate-900/90 border border-pink-500/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-pink-300 whitespace-pre-wrap font-mono">
                  {catLoading ? 'Loading...' : error ? `Error: ${error}` : catResponse ? JSON.stringify(catResponse, null, 2) : 'No data yet'}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border border-pink-500/20 rounded-xl shadow-2xl shadow-pink-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generated Cat Breed Query</h3>
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