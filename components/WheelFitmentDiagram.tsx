export function WheelFitmentDiagram() {
  return (
    <figure className="cm-wheel-diagram">
      <figcaption><strong>Wheel measurements</strong><span>Illustration only. Dimensions vary by order.</span></figcaption>
      <svg viewBox="0 0 580 170" role="img" aria-label="Bolt circle diameter (PCD) and offset (ET) measurement diagrams" fill="none">
        <g stroke="#5b6570" strokeWidth="1.7">
          <circle cx="145" cy="72" r="56" />
          <circle cx="145" cy="72" r="8" />
          <circle cx="145" cy="72" r="35" strokeDasharray="4 4" />
          <circle cx="145" cy="37" r="3.5" />
          <circle cx="180" cy="72" r="3.5" />
          <circle cx="145" cy="107" r="3.5" />
          <circle cx="110" cy="72" r="3.5" />
          <path d="M341 22h12v8h116v-8h12v20h-12l-22 17v26l22 17h12v20h-12v-8H353v8h-12v-20h12l21-17V59l-21-17h-12Z" />
          <path d="M411 12v115M447 12v115" strokeDasharray="4 4" />
        </g>
        <g stroke="#0b5aa5" strokeWidth="2">
          <path d="M110 72h70m-64-4-6 4 6 4m58-8 6 4-6 4M411 72h36m-30-4-6 4 6 4m24-8 6 4-6 4" />
        </g>
        <g fill="#172129" fontFamily="system-ui, sans-serif" fontSize="17" textAnchor="middle" fontWeight="650">
          <text x="145" y="151">Bolt circle (PCD)</text>
          <text x="411" y="151">Offset (ET)</text>
        </g>
      </svg>
    </figure>
  );
}
