import { createFileRoute } from '@tanstack/react-router'
import GraphQLInterface from '../components/GraphQLInterface'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <GraphQLInterface />
}
