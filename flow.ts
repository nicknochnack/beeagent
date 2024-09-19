import dotenv from "dotenv";
dotenv.config();
import { WatsonXChatLLM } from "bee-agent-framework/adapters/watsonx/chat";
import { BaseMessage, Role } from "bee-agent-framework/llms/primitives/message";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { DuckDuckGoSearchTool } from "bee-agent-framework/tools/search/duckDuckGoSearch";
import { OpenMeteoTool } from "bee-agent-framework/tools/weather/openMeteo";
import { PythonTool } from "bee-agent-framework/tools/python/python";
import { LocalPythonStorage } from "bee-agent-framework/tools/python/storage";

const llm = WatsonXChatLLM.fromPreset("meta-llama/llama-3-1-70b-instruct", {
  apiKey: process.env.WATSONX_API_KEY,
  projectId: process.env.WATSONX_PROJECT_ID,
  parameters: {
    decoding_method: "greedy",
    max_new_tokens: 1000,
  },
});

const agent = new BeeAgent({
  llm,
  memory: new TokenMemory({ llm }),
  tools: [
    new DuckDuckGoSearchTool(),
    new OpenMeteoTool(),
    new PythonTool({
      codeInterpreter: {
        url: process.env.CODE_INTERPRETER_URL || "http://localhost:50051",
      },
      storage: new LocalPythonStorage({
        interpreterWorkingDir: "./tmp/code_interpreter",
        localWorkingDir: "./tmp/local",
      }),
    }),
  ],
});

async function main() {
  const response = await agent
    .run({ prompt: "is 3 a prime number?" })
    .observe((emitter) => {
      emitter.on("update", async ({ data, update, meta }) => {
        console.log(`Agent (${update.key}) 🤖 : `, update.value);
      });
    });

  console.log(`Agent 🤖 : `, response.result.text);

  // Uncomment to run the llm generation without the agent
  // for await (const chunk of llm.stream([
  //   BaseMessage.of({
  //     role: Role.USER,
  //     text: "who is nicholas renotte?",
  //   }),
  // ])) {
  //   process.stdout.write(chunk.getTextContent());
  // }
}
main().catch(console.error);
