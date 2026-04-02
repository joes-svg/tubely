import { respondWithJSON } from "./json";
import { randomBytes } from "crypto";
import { type ApiConfig } from "../config";
import { S3Client, type BunRequest } from "bun";
import { getBearerToken, validateJWT } from "../auth";
import { BadRequestError, UserForbiddenError, NotFoundError } from "./errors";
import { getVideo, updateVideo } from "../db/videos";
import { rm } from "fs/promises";
import { uploadVideoToS3 } from "../s3";
import { getVideoDimensions } from "../utility/video";

export async function handlerUploadVideo(cfg: ApiConfig, req: BunRequest) {
  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  const { videoId } = req.params as { videoId?: string };
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Couldn't find video");
  }
  if (video.userID !== userID) {
    throw new UserForbiddenError("Not authorized");
  }

  const formData = await req.formData();
  const file = formData.get("video") as File | null;
  if (!file) {
    throw new BadRequestError("No video provided");
  }

  const MAX_FILE_SIZE = 1 << 30; // 1GB
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError("Video file too large");
  }

  const mediaType = file.type;
  if (!mediaType.includes("video/mp4")) {
    throw new BadRequestError("Invalid video media type");
  }

  const randomFilename = randomBytes(32).toString("hex");
  const filename = `${randomFilename}.${mediaType.split("/")[1]}`;
  const tempFilePath = `/tmp/${filename}`;
  
  console.log("Writing temp file...");
  await Bun.write(tempFilePath, file);

  const aspectRatio = await getVideoDimensions(tempFilePath);
  console.log("Aspect Ratio: ", aspectRatio);
  
  console.log("Uploading to S3...");
  await uploadVideoToS3(cfg, filename, tempFilePath, mediaType);
  console.log("S3 Upload Complete")
  
  await rm(tempFilePath, { force: true });

  updateVideo(cfg.db, { ...video, videoURL: `https://${cfg.s3Bucket}.s3.${cfg.s3Region}.amazonaws.com/${filename}` });
  // updateVideo(cfg.db, { ...video, videoURL: `https://${cfg.s3Bucket}.s3.${cfg.s3Region}.amazonaws.com/${aspectRatio}/${filename}` });

  return respondWithJSON(200, getVideo(cfg.db, videoId));
}
