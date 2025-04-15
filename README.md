# Custom Agent

![image](https://github.com/user-attachments/assets/162efe3d-d315-4431-9709-b10f5ef20d1d)


## Overview

Custom Agent is a pioneering Web3 AI platform that seamlessly integrates cutting-edge decentralized technologies to create robust, ethical, and efficient AI solutions. Custom Agents is a decentralized platform that allows users to upload datasets to IPFS-based storage systems like Filecoin, Akave, and Coophive, and then create intelligent AI agents powered by models such as DeepSeek and LLaMA using lilypad. These agents are strictly trained on the uploaded data and always provide responses backed by verifiable IPFS links, ensuring transparency, traceability, and zero out-of-context answers. Every response is citation-based, guaranteeing that the agent only says what’s supported by the user-provided data.
Our architecture addresses key challenges in data provenance, fair attribution, and ethical data sourcing.


# Video Demo: 
https://youtu.be/Z_rZlBHz_R0

# Demo/Website: 
https://custom-agent.vercel.app/

## Integration of Key Technologies

Our platform leverages several decentralized technologies to create a comprehensive solution:

### 1. Filecoin (via Lighthouse)

Filecoin serves as our primary decentralized storage solution, allowing users to upload datasets securely to the InterPlanetary File System (IPFS). We utilize the Lighthouse SDK to facilitate this integration.

- **File Upload**: Users can upload files directly to Filecoin using the `uploadToFilecoinLighthouse` function. This function takes a file as input and uses the Lighthouse SDK to upload it, providing real-time progress updates through a callback function. The uploaded file's status, including its unique Content Identifier (CID), is logged for user reference.

```javascript
const output = await lighthouse.upload([file], process.env.NEXT_PUBLIC_FILECOIN_LIGHTHOUSE_API_KEY ?? "", null, progressCallback);
```

- **JSON Upload**: For structured data, we provide the `uploadJsonToFilecoinLighthouse` function, which converts a JavaScript object into a JSON string and uploads it to IPFS. This ensures that the data is easily retrievable and can be referenced in AI responses.

```javascript
const response = await lighthouse.uploadText(jsonData, apiKey, name);
```

- **Data Retrieval**: The `getJSONfromFilecoin` and `getTextfromFilecoin` functions allow us to fetch data from IPFS using its CID. This ensures that our AI agents can access the most up-to-date information stored on the decentralized network.

### 2. Storacha

The complete implementation of storach can be found in our repository at [utils/storach.ts](https://github.com/AnirudhHack/custom-agent/blob/master/utils/storach.ts)  and [components/chat/chat-interface.tsx](https://github.com/AnirudhHack/custom-agent/blob/master//components/chat/chat-interface.tsx#L141).

Storacha is integrated into our platform to manage the storage of inputs, outputs, and additional context required for query resolution. So it upload those 3 things on storach.

- **File Upload**: The `uploadFileToStoracha` function allows users to upload files to a designated space within Storacha. This function handles user authentication and ensures that files are stored securely.

```javascript
const cid = await client.uploadFile(file);
```

This integration allows us to maintain a complete and traceable data flow for each interaction, ensuring that all relevant information is stored and accessible.

### 3. Lilypad

Lilypad provides the AI models that power our agents, specifically DeepSeek and LLaMA. These models are designed to process and analyze the data uploaded by users.

- **Model Integration**: Our agents utilize the models provided by Lilypad to generate responses based on the datasets stored in Filecoin and Storacha. This ensures that every response is contextually relevant and backed by verifiable data.

Integration can be found here:  [utils/coophive.ts](https://github.com/AnirudhHack/custom-agent/blob/master/utils/lilypad.ts) and [components/chat/chat-interface.tsx](https://github.com/AnirudhHack/custom-agent/blob/master/components/chat/chat-interface.tsx#L113). (make sure to add env variable  NEXT_PUBLIC_LILYPAD_API_KEY in .env file to enable lilypad agents).

### 4. Coophive

Coophive complements our storage strategy by providing an additional decentralized storage option. This redundancy ensures that user data is secure and accessible, even if one storage solution experiences downtime.
Integration can be found here:  [utils/coophive.ts](https://github.com/AnirudhHack/custom-agent/blob/master/utils/coophive.ts). 

### 5. Akave

We've utilized Akave to store datasets on IPFS. The AI agent references this decentralized data to answer user queries accurately. To ensure transparency and context alignment, every response includes a citation using the corresponding IPFS content ID of the deployed data source.
Integration can be found here:  [utils/akave.ts](https://github.com/AnirudhHack/custom-agent/blob/master/utils/akave.ts). 

### 6. Similarity Search

To enhance the relevance of responses generated by our AI agents, we employ a similarity search mechanism using the `string-similarity` library. This allows our agents to compare user queries with the stored data and retrieve the most relevant information.

```javascript
const score = similarity.compareTwoStrings(prompt, chunk);
```

![image](https://github.com/user-attachments/assets/98bd4014-1d30-48f9-b618-4fb01d8395be)





## Conclusion

By integrating these technologies, we have created a decentralized platform that not only allows users to upload and manage their datasets but also enables the creation of intelligent AI agents that provide accurate, verifiable, and context-aware responses. This architecture addresses key challenges in data provenance, fair attribution, and ethical data sourcing, making our Custom Agents platform a pioneering solution in the Web3 AI landscape.
