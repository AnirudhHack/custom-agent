import { create } from '@web3-storage/w3up-client'

/**
 * Upload a file from frontend to a space (by name).
 */
export async function uploadFileToStoracha(file: File) {
    
    const client = await create();
    console.log("0")
    const account = await client.login(process.env.NEXT_PUBLIC_STORACHA_EMAIL as `${string}@${string}`);
    
    console.log("1")
    await account.plan.wait();
    console.log("2")
    await client.setCurrentSpace(process.env.NEXT_PUBLIC_STORACHA_SPACE_DID as `did:${string}:${string}`)

    const cid = await client.uploadFile(file)

    console.log(`✅ Uploaded file to  CID: ${cid}`)
    console.log(`🔗 View: https://${cid}.ipfs.w3s.link`)
    return cid.toString()
}
