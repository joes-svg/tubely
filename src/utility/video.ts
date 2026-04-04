import type { ApiConfig } from "../config";

export async function getVideoDimensions(filePath: string): Promise<string | null> {
    const resolution = await Bun.spawn(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=display_aspect_ratio", "-of", "default=nw=1:nk=1", filePath],
        { stdout: "pipe", stderr: "pipe" }
    )

    await resolution.exited;

    if (resolution.exitCode !== 0) {
        throw new Error(`ffprobe failed with exit code ${resolution.exitCode}`);
    }

    const stdoutText = await new Response(resolution.stdout).text();
    switch (stdoutText.trim()) {
        case "16:9": {
            return "landscape";
        }
        case "9:16": {
            return "portrait";
        }
        default: {
            return "other";
        }
    }
}

export async function processVideoForFastStart(inputFilePath: string) : Promise<string> {
    const fastStartFilePath = inputFilePath.replace(/(\.\w+)$/, "_faststart$1");

    const result = await Bun.spawn(["ffmpeg", "-i", inputFilePath, "-c:v", "copy", "-c:a", "copy", "-map_metadata", "0", "-movflags", "+faststart", fastStartFilePath],
        { stdout: "pipe", stderr: "pipe" }
    );
    await result.exited;
    return fastStartFilePath;

}

export async function generatePresignedURL(cfg: ApiConfig, key: string, expireTime: number): Promise<string> {
    const signedURL = await cfg.s3Client.presign(key, {
        expiresIn: expireTime
    });
    return signedURL;
}