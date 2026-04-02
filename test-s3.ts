import { s3 } from "bun";
const f = s3.file("v2.mp4", { bucket: "tubely-465b5863-a944-409e-af00-69a386294bdf" });
const videoFile = Bun.file("./samples/boots-video-horizontal.mp4");
//   console.log(`File object created for path ${processesFilePath}, size: ${videoFile.size} bytes`);
  // await s3file.write(videoFile, { type: contentType });
  await f.write(Bun.file("./samples/boots-video-horizontal.mp4"), { type: "video/mp4" });
// await f.write("./samples/boots-video-horizontal.mp4", { type: "video/mp4" });
console.log("done");