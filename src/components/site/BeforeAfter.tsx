import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

interface Props {
  before: string;
  after: string;
  alt?: string;
}

export function BeforeAfter({ before, after, alt = "Before and after" }: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-2xl select-none cursor-ew-resize bg-muted"
      onMouseDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => move(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <img
        src={after}
        alt={`${alt}  after`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt={`${alt}  before`}
          className="absolute inset-0 h-full object-cover"
          style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }}
        />
      </div>

      <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/70 text-white text-[10px] font-mono tracking-[0.2em] uppercase">
        Before
      </span>
      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono tracking-[0.2em] uppercase">
        After
      </span>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white grid place-items-center shadow-lg">
          <MoveHorizontal className="w-5 h-5 text-foreground" />
        </div>
      </div>
    </div>
  );
}
