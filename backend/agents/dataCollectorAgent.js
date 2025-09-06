const { tavily } = require("@tavily/core");
const { ChatGroq } = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

async function runAgent(userQuery) {
 
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY missing in .env");
  if (!TAVILY_API_KEY) throw new Error("TAVILY_API_KEY missing in .env");

  const tvly = tavily({ apiKey: TAVILY_API_KEY });

  const searchResults = await tvly.search(userQuery, {
    max_results: 10,
    search_type: "web",
    search_depth: "advanced"
  });

  const webData = searchResults.results
    .map(r => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
    .join("\n\n");

  const groqChatModel = new ChatGroq({
    apiKey: GROQ_API_KEY,
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
  });

  let promptTemplate;
  try {
    promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a professional market research analyst specializing in consumer product. Analyze the search results and return a JSON response with the following structure:

- query: string, the user query
- search_overview: string, summarize key findings from the search results
- product_profiles: array of objects, each with:
  - name: string, the product name
  - description: string, brief product description
  - launch_date: string, in Month/Year format
  - price_range: string, in INR
  - services: array of strings, key features or OS
  - advantages: array of strings, specific benefits from reviews
  - disadvantages: array of strings, specific drawbacks from reviews
  - reviews_summary: string, aggregated customer review insights
- comparative_analysis: string, compare the product with competitors or predecessors
- market_trends: string, relevant smartphone market trends

For the product in the query, include specific details like launch date, price range, key features, advantages, disadvantages, and customer review insights based on the search results. Ensure accuracy, relevance, and no skipped details. Return valid JSON only.`
      ],
      ["human", "User query: {query}\n\nWeb search results:\n{webData}"],
    ]);

  } catch (err) {
    console.error("Error creating prompt template:", err.message);
  }

  const chain = promptTemplate.pipe(groqChatModel).pipe(new StringOutputParser());

  try {

    const rawResult = await chain.invoke({ query: userQuery, webData });
    const match = rawResult.match(/\{[\s\S]*\}/);

    if (!match) 
      throw new Error("No JSON found in LLM response");
   
    const parsedResult = JSON.parse(match[0]);
   
    return parsedResult;
  } 
  catch (err) 
  {
    console.error("runAgent error:", err.message, "Raw response:", rawResult || "No response");
    throw new Error(`Failed to process request: ${err.message}`);
  }
}

module.exports = { runAgent };