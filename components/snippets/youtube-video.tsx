export function YouTubeVideo({
  videoId,
  title = "YouTube video",
}: {
  videoId: string;
  title?: string;
}) {
  return (
    <div className="relative mb-4 aspect-video w-full">
      <iframe
        className="absolute inset-0 h-full w-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
