import type { ApiConfig } from "./config";

export async function uploadVideoToS3(
  cfg: ApiConfig,
  key: string,
  processesFilePath: string,
  contentType: string,
) {
  console.log(`Uploading file ${processesFilePath} to S3 bucket ${cfg.s3Bucket} with key ${key}`);
  const s3file = cfg.s3Client.file(key);
  console.log(`S3 file object created for bucket ${cfg.s3Bucket} with key ${key}`);
  const videoFile = Bun.file(processesFilePath);
  console.log(`File object created for path ${processesFilePath}, size: ${videoFile.size} bytes`);
  // await s3file.write(videoFile, { type: contentType });
  await s3file.write(Bun.file(processesFilePath), { type: contentType });
  console.log(`File uploaded successfully to S3 bucket ${cfg.s3Bucket} with key ${key}`);

  

}
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { readFile } from "fs/promises";
// import type { ApiConfig } from "./config";

// export async function uploadVideoToS3(
//   cfg: ApiConfig,
//   key: string,
//   filePath: string,
//   contentType: string,
// ) {
//   const client = new S3Client({ region: cfg.s3Region });
//   console.log(`Uploading file ${filePath} to S3 bucket ${cfg.s3Bucket} with key ${key}`); 
//   const body = await readFile(filePath);
//   console.log(`File read successfully, size: ${body.length} bytes`);
//   await client.send(new PutObjectCommand({
//     Bucket: cfg.s3Bucket,
//     Key: key,
//     Body: body,
//     ContentType: contentType,
//   }));
//   console.log(`File uploaded successfully to S3 bucket ${cfg.s3Bucket} with key ${key}`); 
// }