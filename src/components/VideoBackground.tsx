import { site } from "../config/site"

type VideoBackgroundProps = {
  activeZoom: number
}

export function VideoBackground({ activeZoom }: VideoBackgroundProps) {
  const { videoSrcWebm, videoSrcMp4 } = site.background
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="h-full w-full object-cover"
      style={{
        transform: `scale(${activeZoom})`,
        transformOrigin: "center center",
        transition: "transform 0.8s ease-out",
      }}
    >
      <source src={videoSrcWebm} type="video/webm" />
      <source src={videoSrcMp4} type="video/mp4" />
    </video>
  )
}
