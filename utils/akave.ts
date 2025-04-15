// akaveMarketplace.js - Custom Agent integration with Akave storage

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');

// Configuration for Akave connection
const AKAVE_API_URL = process.env.AKAVE_API_URL || '';
const AGENT_BUCKET_NAME = 'custom-agents';
const MARKETPLACE_BUCKET_NAME = 'marketplace-metadata';

/**
 * Helper function to make API requests to Akave
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data (for POST, PUT, etc.)
 * @returns {Promise<Object>} - API response
 */
async function apiRequest(method, endpoint, data = null) {
  try {
    const response = await axios({
      method,
      url: `${AKAVE_API_URL}${endpoint}`,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Initialize Akave storage by creating necessary buckets
 * @returns {Promise<boolean>} - Success indicator
 */
async function initializeAkaveStorage() {
  try {
    // Create bucket for agent data
    await apiRequest('POST', '/buckets', { bucketName: AGENT_BUCKET_NAME });
    console.log(`Created agent bucket: ${AGENT_BUCKET_NAME}`);
    
    // Create bucket for marketplace metadata
    await apiRequest('POST', '/buckets', { bucketName: MARKETPLACE_BUCKET_NAME });
    console.log(`Created marketplace bucket: ${MARKETPLACE_BUCKET_NAME}`);
    
    return true;
  } catch (error) {
    console.log('Buckets may already exist, continuing...');
    return true;
  }
}

/**
 * Upload a file to Akave storage
 * @param {string} bucketName - Bucket name
 * @param {string} filePath - Path to file
 * @param {string} customFileName - Optional custom filename
 * @returns {Promise<Object>} - Upload response with CID
 */
async function uploadFileToAkave(bucketName, filePath, customFileName = null) {
  const form = new FormData();
  const fileStream = fs.createReadStream(filePath);
  
  if (customFileName) {
    form.append('file', fileStream, { filename: customFileName });
  } else {
    form.append('file', fileStream);
  }
  
  try {
    const response = await axios.post(
      `${AKAVE_API_URL}/buckets/${bucketName}/files`,
      form,
      { headers: form.getHeaders() }
    );
    
    console.log(`File uploaded to ${bucketName}: ${response.data.fileName || 'file'}`);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Create a temporary file with JSON content and upload it to Akave
 * @param {string} bucketName - Bucket name
 * @param {Object} jsonData - JSON data to upload
 * @param {string} fileName - File name for the JSON data
 * @returns {Promise<Object>} - Upload response with CID
 */
async function uploadJsonToAkave(bucketName, jsonData, fileName) {
  const tempFilePath = `./${fileName}_${Date.now()}.json`;
  
  try {
    // Write JSON to temporary file
    fs.writeFileSync(tempFilePath, JSON.stringify(jsonData, null, 2));
    
    // Upload the file
    const response = await uploadFileToAkave(bucketName, tempFilePath, fileName);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    return response;
  } catch (error) {
    // Clean up temporary file in case of error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}

/**
 * Download a file from Akave storage
 * @param {string} bucketName - Bucket name
 * @param {string} fileName - File name
 * @param {string} outputPath - Output path
 * @returns {Promise<string>} - Path to downloaded file
 */
async function downloadFileFromAkave(bucketName, fileName, outputPath) {
  try {
    const response = await axios.get(
      `${AKAVE_API_URL}/buckets/${bucketName}/files/${fileName}/download`,
      { responseType: 'arraybuffer' }
    );
    
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    console.log(`File downloaded to: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    console.error('Download failed:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Get file information from Akave
 * @param {string} bucketName - Bucket name
 * @param {string} fileName - File name
 * @returns {Promise<Object>} - File information
 */
async function getFileInfo(bucketName, fileName) {
  return apiRequest('GET', `/buckets/${bucketName}/files/${fileName}`);
}

/**
 * List all files in a bucket
 * @param {string} bucketName - Bucket name
 * @returns {Promise<Array>} - Array of files
 */
async function listBucketFiles(bucketName) {
  return apiRequest('GET', `/buckets/${bucketName}/files`);
}

/**
 * Download and parse JSON file from Akave
 * @param {string} bucketName - Bucket name
 * @param {string} fileName - File name
 * @returns {Promise<Object>} - Parsed JSON data
 */
async function downloadAndParseJson(bucketName, fileName) {
  const tempOutputPath = `./${fileName}_${Date.now()}_temp.json`;
  
  try {
    await downloadFileFromAkave(bucketName, fileName, tempOutputPath);
    const jsonContent = fs.readFileSync(tempOutputPath, 'utf8');
    const parsedData = JSON.parse(jsonContent);
    
    // Clean up
    fs.unlinkSync(tempOutputPath);
    
    return parsedData;
  } catch (error) {
    if (fs.existsSync(tempOutputPath)) {
      fs.unlinkSync(tempOutputPath);
    }
    throw error;
  }
}

// ====== Agent Marketplace Implementation ======

/**
 * Upload an agent's dataset and metadata to Akave
 * @param {string} agentId - Unique identifier for the agent
 * @param {Array<Object>} files - Array of file objects {path, name, description}
 * @param {Object} agentMetadata - Agent metadata
 * @returns {Promise<Object>} - Upload results with references
 */
async function uploadAgentToAkave(agentId, files, agentMetadata) {
  // Initialize storage if needed
  await initializeAkaveStorage();
  
  // Upload each training file to Akave
  const fileReferences = [];
  for (const file of files) {
    const uploadResult = await uploadFileToAkave(
      AGENT_BUCKET_NAME, 
      file.path,
      `${agentId}_${file.name}`
    );
    
    fileReferences.push({
      originalName: file.name,
      storedName: uploadResult.fileName,
      description: file.description || '',
      cid: uploadResult.cid,
      size: uploadResult.size,
      contentType: uploadResult.contentType || 'application/octet-stream'
    });
  }
  
  // Generate encryption key for secure access control
  const accessKey = crypto.randomBytes(32).toString('hex');
  
  // Create comprehensive metadata
  const completeMetadata = {
    agentId,
    name: agentMetadata.name,
    description: agentMetadata.description,
    creator: agentMetadata.creator,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: agentMetadata.version || '1.0.0',
    files: fileReferences,
    price: agentMetadata.price || 0,
    accessKey: accessKey, // This would be encrypted in a real implementation
    tags: agentMetadata.tags || [],
    modelType: agentMetadata.modelType || 'unknown',
  };
  
  // Upload metadata to marketplace bucket
  const metadataFileName = `${agentId}_metadata.json`;
  const metadataUploadResult = await uploadJsonToAkave(
    MARKETPLACE_BUCKET_NAME,
    completeMetadata,
    metadataFileName
  );
  
  // Return references to all uploaded content
  return {
    agentId,
    metadataFile: metadataFileName,
    metadataCid: metadataUploadResult.cid,
    files: fileReferences,
    accessKey
  };
}

/**
 * Retrieve all available agents from the marketplace
 * @returns {Promise<Array>} - Array of agent metadata
 */
async function listMarketplaceAgents() {
  try {
    // Get all files in the marketplace bucket
    const files = await listBucketFiles(MARKETPLACE_BUCKET_NAME);
    
    // Filter for metadata files and extract basic info
    const agentsList = [];
    const metadataFiles = files.filter(file => file.fileName.includes('_metadata.json'));
    
    for (const file of metadataFiles) {
      try {
        // Get detailed info for this file
        const fileInfo = await getFileInfo(MARKETPLACE_BUCKET_NAME, file.fileName);
        
        // Only download and parse if necessary
        const metadata = await downloadAndParseJson(MARKETPLACE_BUCKET_NAME, file.fileName);
        
        // Add to list with public info only (removing sensitive data)
        agentsList.push({
          agentId: metadata.agentId,
          name: metadata.name,
          description: metadata.description,
          creator: metadata.creator,
          createdAt: metadata.createdAt,
          price: metadata.price,
          tags: metadata.tags,
          modelType: metadata.modelType,
          fileCount: metadata.files.length,
          metadataFile: file.fileName,
          metadataCid: fileInfo.cid
        });
      } catch (error) {
        console.error(`Error parsing metadata for ${file.fileName}:`, error);
        // Continue with other agents even if one fails
      }
    }
    
    return agentsList;
  } catch (error) {
    console.error('Failed to list marketplace agents:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} - Agent details
 */
async function getAgentDetails(agentId) {
  try {
    // Find the metadata file for this agent
    const files = await listBucketFiles(MARKETPLACE_BUCKET_NAME);
    const metadataFile = files.find(file => file.fileName === `${agentId}_metadata.json`);
    
    if (!metadataFile) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Download and parse the metadata
    const metadata = await downloadAndParseJson(
      MARKETPLACE_BUCKET_NAME, 
      metadataFile.fileName
    );
    
    // Return agent details (without sensitive information)
    return {
      agentId: metadata.agentId,
      name: metadata.name,
      description: metadata.description,
      creator: metadata.creator,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      version: metadata.version,
      price: metadata.price,
      tags: metadata.tags,
      modelType: metadata.modelType,
      files: metadata.files.map(file => ({
        originalName: file.originalName,
        description: file.description,
        size: file.size,
        contentType: file.contentType
        // Note: Not including CIDs or stored names for security
      }))
    };
  } catch (error) {
    console.error(`Failed to get agent details for ${agentId}:`, error);
    throw error;
  }
}

/**
 * Purchase access to an agent
 * Note: In a real implementation, this would involve blockchain transactions
 * For the hackathon prototype, we'll simulate the purchase process
 * 
 * @param {string} agentId - Agent ID
 * @param {string} buyerId - Buyer identifier
 * @returns {Promise<Object>} - Purchase receipt
 */
async function purchaseAgentAccess(agentId, buyerId) {
  try {
    // Get agent metadata
    const files = await listBucketFiles(MARKETPLACE_BUCKET_NAME);
    const metadataFile = files.find(file => file.fileName === `${agentId}_metadata.json`);
    
    if (!metadataFile) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Download and parse the metadata
    const metadata = await downloadAndParseJson(
      MARKETPLACE_BUCKET_NAME, 
      metadataFile.fileName
    );
    
    // Create access record (in a real implementation, this would be on-chain)
    const accessRecord = {
      agentId: metadata.agentId,
      buyerId,
      purchasedAt: new Date().toISOString(),
      price: metadata.price,
      accessKey: metadata.accessKey,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    
    // Store access record
    const accessRecordFileName = `${agentId}_${buyerId}_access.json`;
    await uploadJsonToAkave(
      MARKETPLACE_BUCKET_NAME,
      accessRecord,
      accessRecordFileName
    );
    
    // Return purchase receipt
    return {
      agentId: metadata.agentId,
      name: metadata.name,
      buyerId,
      purchasedAt: accessRecord.purchasedAt,
      expiresAt: accessRecord.expiresAt,
      accessRecordFile: accessRecordFileName
    };
  } catch (error) {
    console.error(`Failed to purchase agent ${agentId}:`, error);
    throw error;
  }
}

/**
 * Download agent data for a user who has purchased access
 * @param {string} agentId - Agent ID
 * @param {string} buyerId - Buyer identifier
 * @param {string} outputDir - Directory to save files
 * @returns {Promise<Object>} - Download results
 */
async function downloadAgentData(agentId, buyerId, outputDir) {
  try {
    // Verify access rights
    const files = await listBucketFiles(MARKETPLACE_BUCKET_NAME);
    const accessFile = files.find(file => file.fileName === `${agentId}_${buyerId}_access.json`);
    
    if (!accessFile) {
      throw new Error(`No access rights found for ${buyerId} to agent ${agentId}`);
    }
    
    // Get access record
    const accessRecord = await downloadAndParseJson(
      MARKETPLACE_BUCKET_NAME,
      accessFile.fileName
    );
    
    // Check if access has expired
    if (new Date(accessRecord.expiresAt) < new Date()) {
      throw new Error(`Access to agent ${agentId} has expired`);
    }
    
    // Get agent metadata
    const metadataFile = files.find(file => file.fileName === `${agentId}_metadata.json`);
    const metadata = await downloadAndParseJson(
      MARKETPLACE_BUCKET_NAME,
      metadataFile.fileName
    );
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Download all agent files
    const downloadResults = [];
    for (const file of metadata.files) {
      const outputPath = `${outputDir}/${file.originalName}`;
      await downloadFileFromAkave(
        AGENT_BUCKET_NAME,
        file.storedName,
        outputPath
      );
      
      downloadResults.push({
        originalName: file.originalName,
        path: outputPath,
        description: file.description
      });
    }
    
    return {
      agentId,
      name: metadata.name,
      downloadedAt: new Date().toISOString(),
      files: downloadResults
    };
  } catch (error) {
    console.error(`Failed to download agent data:`, error);
    throw error;
  }
}

/**
 * Implement a simple hot retrieval cache for frequently accessed agent files
 * Note: This is a simulation of hot cache functionality
 * 
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} - Cache status
 */
async function setupHotRetrievalCache(agentId) {
  try {
    // Get agent metadata
    const files = await listBucketFiles(MARKETPLACE_BUCKET_NAME);
    const metadataFile = files.find(file => file.fileName === `${agentId}_metadata.json`);
    
    if (!metadataFile) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Download and parse the metadata
    const metadata = await downloadAndParseJson(
      MARKETPLACE_BUCKET_NAME,
      metadataFile.fileName
    );
    
    // Create hot cache manifest (in a real implementation, this would interact with a cache system)
    const hotCacheManifest = {
      agentId: metadata.agentId,
      name: metadata.name,
      cachedAt: new Date().toISOString(),
      files: metadata.files.map(file => ({
        originalName: file.originalName,
        storedName: file.storedName,
        cid: file.cid,
        hotCached: true,
        priority: 'high' // In a real impl, this would vary based on access patterns
      }))
    };
    
    // Store hot cache manifest
    const cacheManifestFileName = `${agentId}_hotcache.json`;
    await uploadJsonToAkave(
      MARKETPLACE_BUCKET_NAME,
      hotCacheManifest,
      cacheManifestFileName
    );
    
    console.log(`Hot retrieval cache set up for agent ${agentId}`);
    return {
      agentId: metadata.agentId,
      cachedAt: hotCacheManifest.cachedAt,
      fileCount: hotCacheManifest.files.length,
      status: 'active'
    };
  } catch (error) {
    console.error(`Failed to set up hot retrieval cache:`, error);
    throw error;
  }
}

/**
 * Update agent metadata (e.g., price, description)
 * @param {string} agentId - Agent ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated agent details
 */
async function updateAgentMetadata(agentId, updates) {
  try {
    // Get current metadata
    const files = await listBucketFiles(MARKETPLACE_BUCKET_NAME);
    const metadataFile = files.find(file => file.fileName === `${agentId}_metadata.json`);
    
    if (!metadataFile) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Download and parse the metadata
    const metadata = await downloadAndParseJson(
      MARKETPLACE_BUCKET_NAME,
      metadataFile.fileName
    );
    
    // Apply updates
    const updatedMetadata = {
      ...metadata,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Protect immutable fields
    updatedMetadata.agentId = metadata.agentId;  // Don't allow changing agentId
    updatedMetadata.createdAt = metadata.createdAt;  // Don't allow changing createdAt
    updatedMetadata.accessKey = metadata.accessKey;  // Don't allow changing accessKey directly
    
    // Upload updated metadata
    await uploadJsonToAkave(
      MARKETPLACE_BUCKET_NAME,
      updatedMetadata,
      metadataFile.fileName
    );
    
    // Return updated details (excluding sensitive information)
    return {
      agentId: updatedMetadata.agentId,
      name: updatedMetadata.name,
      description: updatedMetadata.description,
      updatedAt: updatedMetadata.updatedAt,
      price: updatedMetadata.price,
      tags: updatedMetadata.tags,
      version: updatedMetadata.version
    };
  } catch (error) {
    console.error(`Failed to update agent metadata:`, error);
    throw error;
  }
}

// Export all functions
module.exports = {
  // Core Akave storage functions
  initializeAkaveStorage,
  uploadFileToAkave,
  uploadJsonToAkave,
  downloadFileFromAkave,
  getFileInfo,
  listBucketFiles,
  downloadAndParseJson,
  
  // Agent marketplace functions
  uploadAgentToAkave,
  listMarketplaceAgents,
  getAgentDetails,
  purchaseAgentAccess,
  downloadAgentData,
  setupHotRetrievalCache,
  updateAgentMetadata
};