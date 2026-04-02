import { getBearerToken, validateJWT } from "../auth";
import { respondWithJSON } from "./json";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig } from "../config";
import type { BunRequest } from "bun";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { randomBytes } from "crypto";

export async function handlerUploadThumbnail(cfg: ApiConfig, req: BunRequest) {
  const { videoId } = req.params as { videoId?: string };
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  console.log("uploading thumbnail for video", videoId, "by user", userID);

  const formData = await req.formData();
  const file = formData.get("thumbnail") as File | null;
  if (!file) {
    throw new BadRequestError("No thumbnail provided");
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestError("Thumbnail file too large");
  }

  const mediaType = file.type;
  if (!mediaType.startsWith("image/")) {
    throw new BadRequestError("Invalid thumbnail media type");
  }
  
  const data = await file.arrayBuffer();
  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Couldn't find video");
  } 

  if (video.userID !== userID) {
    throw new UserForbiddenError("Unauthorized to upload thumbnail for this video");
  }

  const randomFilename = randomBytes(32).toString("base64url");
  const filename = `${randomFilename}.${mediaType.split("/")[1]}`;
  Bun.write(`${cfg.assetsRoot}/${filename}`, new Uint8Array(data));
  updateVideo(cfg.db, { ...video, thumbnailURL: `http://localhost:${cfg.port}/assets/${filename}` });
  

  return respondWithJSON(200, getVideo(cfg.db, videoId));
}
