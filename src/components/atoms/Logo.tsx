export const Logo = (props) => (
    <svg width={24} height={24} viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <marker id="a" overflow="visible" orient="auto">
                <path d="m10 0 4-4L0 0l14 4z" fill="context-stroke" fillRule="evenodd" stroke="context-stroke" strokeWidth=".8pt" />
            </marker>
        </defs>
        <g stroke="#000">
            <circle transform="rotate(232.1)" cx={-70.13} cy={8.735} fill="#fff" fillRule="evenodd" strokeWidth={10} r={44.973} />
            <path d="M49.973 8.633v1.84" fill="none" markerMid="url(#a)" strokeLinecap="square" strokeWidth={10} />
            <circle cx={49.973} cy={49.973} strokeLinecap="round" r={7.645} />
        </g>
        <g fill="none" stroke="#000" strokeLinecap="square" strokeWidth={10}>
            <path d="M49.973 47.765V27M49.452 50.448 28.159 67.024" />
            <path d="M91.313 49.973h-1.84" markerMid="url(#a)" />
            <path d="M49.973 91.313v-1.84" markerMid="url(#a)" />
            <path d="M8.633 49.973h1.84" markerMid="url(#a)" />
        </g>
        <g transform="translate(-32.808 -27.517)" stroke="#01468a" strokeLinecap="round">
            <circle cx={111.51} cy={105.93} r={25.665} fill="#fff" strokeWidth={10} />
            <path d="m97.987 109.83 9.843 10.209 11.777-26.45" fill="none" strokeLinejoin="round" strokeWidth={8} />
        </g>
    </svg>
)
