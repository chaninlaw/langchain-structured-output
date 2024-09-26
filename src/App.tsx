import './App.css'
import { Ollama } from '@langchain/ollama'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate } from '@langchain/core/prompts'

import { useState } from 'react'

interface Structured {
  message: string
  data:
    | null
    | {
        title: string
        description: string
      }[]
}
const parser = new JsonOutputParser<Structured>()

const prompt = ChatPromptTemplate.fromTemplate(
  'Answer the user query.\n{format_instructions}\n{query}\n'
)

const llm = new Ollama({
  model: 'llama3.2',
  temperature: 0,
  maxRetries: 2,
  baseUrl: process.env.AI_API_URL,
})

function App() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Structured>({ message: '', data: null })

  const handleClick = async () => {
    const format_instructions = `
      Respond only in valid JSON. The JSON object you return should match the following schema:
      { "message": "type string to descripe chat to user", "data": [{ "title": "type string", "description": "type string" }] }
    `
    const partialedPrompt = await prompt.partial({ format_instructions })
    const chain = partialedPrompt.pipe(llm).pipe(parser)
    for await (const s of await chain.stream({ query })) {
      setResult(s)
    }
  }
  console.log('result', result)

  return (
    <>
      <div className="">Message: {result.message}</div>
      <div className="">Data: {JSON.stringify(result.data)}</div>

      <p>Structured output:</p>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={handleClick}>Run</button>

      {JSON.stringify(result)}
    </>
  )
}

export default App
