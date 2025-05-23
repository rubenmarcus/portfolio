interface TimelineEvent {
  year: string
  title: string
  description: string
}

interface TimelineProps {
  events: TimelineEvent[]
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-green-500/30 transform md:translate-x-px"></div>

      <div className="space-y-12">
        {events.map((event, index) => (
          <div
            key={index}
            className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}
          >
            {/* Year marker */}
            <div className="md:w-1/2 flex items-center">
              <div className={`w-full ${index % 2 === 0 ? "md:pl-8" : "md:pr-8 md:text-right"}`}>
                <div className="font-mono text-3xl font-bold text-green-500 mb-2">{event.year}</div>
                <div className="font-mono text-xl font-semibold text-green-400 mb-1">{event.title}</div>
                <div className="text-green-300/80 font-mono">{event.description}</div>
              </div>
            </div>

            {/* Circle marker */}
            <div className="absolute left-0 md:left-1/2 w-5 h-5 bg-black border-2 border-green-500 rounded-full transform -translate-x-1/2 md:-translate-x-1/2"></div>

            {/* Empty space for the other side */}
            <div className="md:w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
