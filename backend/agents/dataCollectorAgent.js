const { tavily } = require('@tavily/core');
const axios = require('axios');
const cheerio = require('cheerio'); 

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function extractTextFromUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }

    });
    
    const cheer = cheerio.load(response.data);
    
    cheer('script').remove();
    cheer('style').remove();
    cheer('nav').remove();
    cheer('header').remove();
    cheer('footer').remove();
    cheer('.advertisement').remove();
    cheer('.ads').remove();
    
        // console.log(cheer)
   
    let content = '';
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      'main',
      '.main-content',
      '.article-body',
      '.post-body'
    ];
    
    
    for (const selector of contentSelectors) {
      const element = cheer(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }
    
    
    if (!content) {
      content = cheer('body').text().trim();
    }
    
   
    content = content
      .replace(/\s+/g, ' ') 
      .replace(/\n\s*\n/g, '\n') 
      .trim();
    
    return content.substring(0, 21000); 
    
  } catch (error) {
    console.error(`Error extracting text from ${url}:`, error.message);
    return null;
  }
}


function isValidUrl(url) {
  const excludedDomains = [
    'youtube.com',
    'tiktok.com',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'pinterest.com'
  ];
  
  return !excludedDomains.some(domain => url.toLowerCase().includes(domain));
}

async function runAgent(query) {
  try {
   

    const tvlyResults = await tvly.search(query );
    
    const filteredResults = tvlyResults.results.filter(result => isValidUrl(result.url));    

    const enhancedResults = await Promise.all(
      filteredResults.slice(0, 3).map(async (result) => {
     
        const fullText = await extractTextFromUrl(result.url);
        
        return {
          ...result,
          fullText: fullText,
          hasFullText: !!fullText
        };
      })
    );
    
    const remainingResults = filteredResults.slice(3).map(result => ({
      ...result,
      fullText: null,
      hasFullText: false
    }));
    
    const allEnhancedResults = [...enhancedResults, ...remainingResults];
    
    return {
      source: 'tavily',
      query,
      totalResults: allEnhancedResults.length,
      resultsWithFullText: enhancedResults.filter(r => r.hasFullText).length,
      rawData: {
        tavily: {
          ...tvlyResults,
          results: allEnhancedResults
        }
      },
    };
  } catch (error) {
    console.error("Error in runAgent:", error.message);
  }
}

module.exports = { runAgent};