import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import 'dotenv/config'
import { GoogleCustomSearch } from '@langchain/community/tools/google_custom_search'
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages'

const searchTool = new GoogleCustomSearch({
  apiKey: process.env.GOOGLE_API_KEY,
  googleCSEId: process.env.GOOGLE_CSE_ID,
})

const tools = [searchTool]

const bareModel = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-pro-preview-05-06',
  maxOutputTokens: 2048,
  temperature: 0.7,
})

const model = bareModel.bindTools(tools)

async function main() {
  try {
    const query =
      'Do you have the tool GoogleCustomSearch enabled? Demonstrate it performing a search for "latest trends in renewable energy".'
    const messages = [new HumanMessage(query)]

    let response = await model.invoke(messages)
    if (Array.isArray(response.content)) {
      const textContent = response.content
        .filter(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            (item as any).type === 'text' &&
            typeof (item as any).text === 'string'
        )
        .map((item) => (item as { text: string }).text)
        .join('')
      if (textContent) {
        console.log(textContent)
      }
    } else {
      console.error(
        'Unexpected response.content structure from initial invoke (expected array):',
        response.content
      )
      console.error('Exiting program.')
      process.exit(1)
    }
    messages.push(response)

    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log('\nTool calls detected. Executing tools...')
      for (const toolCall of response.tool_calls) {
        if (
          toolCall.name === 'google-custom-search' &&
          typeof toolCall.args?.input === 'string'
        ) {
          try {
            const toolOutput = await searchTool.invoke(toolCall.args.input)
            if (!toolCall.id || typeof toolCall.id !== 'string')
              throw new Error(`Missing/invalid id for ${toolCall.name}.`)
            messages.push(
              new ToolMessage({
                content:
                  typeof toolOutput === 'string'
                    ? toolOutput
                    : JSON.stringify(toolOutput),
                tool_call_id: toolCall.id,
              })
            )
          } catch (toolError) {
            console.error(`Error executing tool ${toolCall.name}:`, toolError)
            console.error('Aborting.')
            process.exit(1)
          }
        }
      }

      response = await model.invoke(messages)
    }

    console.log('\nFinal AI Response (after processing tools):')
    if (typeof response.content === 'string') {
      console.log(response.content)
    } else {
      console.log(JSON.stringify(response.content, null, 2))
    }
  } catch (error) {
    error instanceof Error
      ? console.error(error.message)
      : console.error('An unknown error occurred:', error)
  }
}

main()
