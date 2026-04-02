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