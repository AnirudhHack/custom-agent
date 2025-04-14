const lighthouse = require('@lighthouse-web3/sdk')

const { pipeline } = require('stream');
const { promisify } = require('util');
const { Readable }  = require('stream');

// async function uploadToFilecoinLighthouse(file){

//     const uploadResponse = await lighthouse.upload(
//       'new.txt', 
//       process.env.FILECOIN_LIGHTHOUSE_API_KEY ?? ""
//     )
    
//     console.log(uploadResponse)
// }


const uploadToFilecoinLighthouse = async(file:any) =>{
    const progressCallback = (progressData) => {
        let percentageDone =
          100 - (progressData?.total / progressData?.uploaded)?.toFixed(2)
        console.log(percentageDone)
      }
    // Push file to lighthouse node
    // Both file and folder are supported by upload function
    // Third parameter is for multiple files, if multiple files are to be uploaded at once make it true
    // Fourth parameter is the deal parameters, default null af
    const output = await lighthouse.upload([file],  process.env.NEXT_PUBLIC_FILECOIN_LIGHTHOUSE_API_KEY ?? "", null, progressCallback)
        // process.env.FILECOIN_LIGHTHOUSE_API_KEY ?? ""
    console.log('File Status:', output)
    /*
      output:
        data: {
          Name: "filename.txt",
          Size: 88000,
          Hash: "QmWNmn2gr4ZihNPqaC5oTeePsHvFtkWNpjY3cD6Fd5am1w"
        }
      Note: Hash in response is CID.
    */

      console.log('Visit at https://gateway.lighthouse.storage/ipfs/' + output.data.Hash)
      return output
}

// const uploadJsonToFilecoinLighthouse = async(file:any) =>{
//     const response = await lighthouse.uploadText(text, apiKey, name)

//     console.log(response)
//     // Sample response
//     {
//     data: {
//         Name: 'shikamaru',
//         Hash: 'QmY77L7JzF8E7Rio4XboEpXL2kTZnW2oBFdzm6c53g5ay8',
//         Size: '91'
//     }
//     }
// }

const uploadJsonToFilecoinLighthouse = async (dataObject:any) => {
    // Convert the object to a JSON string
    const jsonData = JSON.stringify(dataObject);
    
    const apiKey =  process.env.NEXT_PUBLIC_FILECOIN_LIGHTHOUSE_API_KEY ?? "" // Replace with your Lighthouse API key
    const name = "AIAGENT"; // Optional, name for the text upload
    
    try {
      // Upload JSON string to IPFS via Lighthouse
      const response = await lighthouse.uploadText(jsonData, apiKey, name);
  
      // Log the response and IPFS hash
      console.log('Uploaded successfully:', response);
      console.log('IPFS URL: https://gateway.lighthouse.storage/ipfs/' + response.data.Hash);
  
      return response;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
    }
  };


const getJSONfromFilecoin = async (cid:any) => {
  try {
    const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);
    if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);

    // await streamPipeline(response.body, fs.createWriteStream(path));
    const text = await response.text(); // convert stream to string
    const json = JSON.parse(text); // try parsing to object if it's JSON
    // console.log("Parsed object:\n", json);
    return json
  } catch (error) {
    console.error('Failed to save the file:', error);
  }
};

const getAllAgents = async() =>{
  /*
    @param {string} apiKey - Your API key.
    @param {number} [lastKey=null] - id of last object of previous response, defaults to null.
  */
 
    const apiKey =  process.env.NEXT_PUBLIC_FILECOIN_LIGHTHOUSE_API_KEY ?? "" 
  const response = await lighthouse.getUploads(apiKey ,null)
  console.log(response.data.fileList)

  const list = []

  for (const [index, i] of response.data.fileList.entries()){
    if(i.fileName == "AIAGENT") {
      const res = await getJSONfromFilecoin(i.cid);
      list.push({
        id: index,
        name: res.agentName,
        description: res.agentDescription,
        datasetList: res.datasetList
      })
    }
  }
  console.log(list)
  return list 
  
}

const getTextfromFilecoin = async (cid:any) => {
  try {
    const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);
    if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);

    // await streamPipeline(response.body, fs.createWriteStream(path));
    const text = await response.text(); // convert stream to string
    // const json = JSON.parse(text); // try parsing to object if it's JSON
    // console.log("Parsed object:\n", json);
    return text
  } catch (error) {
    console.error('Failed to save the file:', error);
  }
};

module.exports = {
    uploadToFilecoinLighthouse,
    uploadJsonToFilecoinLighthouse,
    getAllAgents,
    getTextfromFilecoin
}

