// import * as similarity from 'string-similarity';

const similarity = require('string-similarity');

type SourceData = {
  sourceLink: string;
  data: string;
};



function getRelevantData(sources: SourceData[], prompt: string): SourceData[] {
  const results: SourceData[] = [];

  sources.forEach((source) => {
    // Split the data into sentences or paragraphs (you can adjust this to suit your needs)
    const chunks = source.data.split(". "); // Simple split by sentence for this example
    let bestMatch = { score: 0, chunk: "" };

    // Compare the prompt to each chunk
    chunks.forEach((chunk) => {
      const score = similarity.compareTwoStrings(prompt, chunk);
      if (score > bestMatch.score) {
        bestMatch = { score, chunk };
      }
    });

    // If a relevant match is found (above a threshold), store it
    if (bestMatch.score > 0.2) {
      results.push({
        sourceLink: source.sourceLink,
        data: bestMatch.chunk,
      });
    }
  });

  results.push(...sources)

  return results;
}

module.exports = {
    getRelevantData
}

// Example usage:
// const ficciDetails = `
// 1. FICCI Federation House, New Delhi
//    - Location: 1 Federation House, Tansen Marg, Mandi House, New Delhi 110001
//    - Details: This is the headquarters of FICCI, hosting various industry events and conferences, including those focused on renewable energy and industrial transitions.

// 2. Park Hotel, Kolkata
//    - Event: Renewable Energy Transition for Commercial and Industrial Consumers (Eastern Region)
//    - Date: November 23, 2023
//    - Details: FICCI, in collaboration with AmpIn Energy Transition, organized an interactive session to showcase renewable energy solutions and technologies available for Indian industrial consumers, supporting their transition towards decarbonization and the net-zero journey.

// 3. Hotel The Lalit Ashok, Bangalore
//    - Event: Interaction on Renewable Energy Adoption by Industrial Consumers (Southern Region)
//    - Date: October 31, 2023
//    - Details: This event focused on discussing the adoption of renewable energy solutions by industrial consumers in the southern region of India.
// `;
// const sources: SourceData[] = [
//   {
//     sourceLink: "https://source1.com",
//     data: ficciDetails,
//   },
//   {
//     sourceLink: "https://source2.com",
//     data: "Here is another source with some data. It might have relevant information about your query prompt that will help you understand better.",
//   },
// ];

// const query = "Give me travel location in kolkata";

// const relevantData = getRelevantData(sources, query);
// console.log(relevantData);











// type SourceData = {
//   sourceLink: string;
//   data: string;
// };

// type RelevantDataResult = {
//   source: string;
//   relevantData: string;
// };

// function getRelevantData(sources: SourceData[], prompt: string): RelevantDataResult[] {
//   const results: RelevantDataResult[] = [];

//   sources.forEach((source) => {
//     // Calculate similarity score with the prompt using string-similarity library
//     const score = similarity.compareTwoStrings(prompt, source.data);
//     console.log(score)
//     // If similarity score is above a certain threshold (e.g., 0.2), consider it relevant
//     if (score > 0.2) {
//       // For simplicity, just return a chunk of the data
//       // In a real scenario, you might want to extract the specific relevant part
//       const relevantData = extractRelevantChunk(source.data, prompt);

//       results.push({
//         source: source.sourceLink,
//         relevantData: relevantData,
//       });
//     }
//   });

//   return results;
// }

// // Function to extract a chunk of data based on prompt (simple example)
// function extractRelevantChunk(data: string, prompt: string): string {
//   const chunkLength = 200; // Length of data to extract around the prompt (e.g., 200 characters)
//   const promptIndex = data.toLowerCase().indexOf(prompt.toLowerCase());

//   if (promptIndex === -1) {
//     return "No relevant data found."; // No match found
//   }

//   // Extract surrounding text
//   const start = Math.max(0, promptIndex - chunkLength);
//   const end = Math.min(data.length, promptIndex + chunkLength + prompt.length);

//   return data.substring(start, end);
// }

// // Example usage:

// const sources: SourceData[] = [
//   {
//     sourceLink: "https://source1.com",
//     data: "This is the data from source one. It contains lots of information about different topics, including the prompt you are looking for.",
//   },
//   {
//     sourceLink: "https://source2.com",
//     data: "Here is another source with some data. It might have relevant information about your query prompt that will help you understand better.",
//   },
// ];

// const query = "how to understand better";

// const relevantData = getRelevantData(sources, query);
// console.log(relevantData);
