'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface StateMachineDiagramProps {
    definition: any;
    className?: string;
}

export function StateMachineDiagram({ definition, className = '' }: StateMachineDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [mermaidCode, setMermaidCode] = useState<string>('');

    useEffect(() => {
        // Initialize Mermaid ONCE
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose', // Allow basic functionality
            fontFamily: '"Inter", sans-serif',
        });

        try {
            // Parse definition to Mermaid syntax
            const code = parseToMermaid(definition);
            setMermaidCode(code);
            console.log('✅ Generated Mermaid code:', code);

            // Render AFTER component mounts (critical for Next.js)
            if (containerRef.current) {
                mermaid.render('diagram-' + Date.now(), code)
                    .then(({ svg }) => {
                        // CRITICAL: Check if SVG actually contains content
                        if (svg.includes('<g>') && !svg.includes('<g></g>')) {
                            containerRef.current!.innerHTML = svg;
                            setError(null);
                        } else {
                            throw new Error('Generated empty SVG - invalid Mermaid syntax');
                        }
                    })
                    .catch((err: Error) => {
                        console.error('❌ Mermaid render error:', err);
                        setError(`Render failed: ${err.message}`);
                        if (containerRef.current) {
                            containerRef.current.innerHTML = `<div class="text-red-500 p-4">Diagram error: ${err.message}</div>`;
                        }
                    });
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error('❌ Parser error:', err);
            setError(`Parse error: ${errorMsg}`);
        }
    }, [definition]);

    return (
        <div className={`bg-white p-4 rounded-lg border overflow-auto ${className}`}>
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    <div className="font-medium">Diagram Error</div>
                    <div className="mt-1">{error}</div>
                    <details className="mt-2 text-xs">
                        <summary className="cursor-pointer text-blue-600">View Mermaid code</summary>
                        <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto">{mermaidCode}</pre>
                    </details>
                </div>
            )}
            <div
                ref={containerRef}
                className="min-h-[400px] w-full"
                dangerouslySetInnerHTML={{ __html: '' }} // Will be populated by mermaid.render()
            />
        </div>
    );
}

// MINIMAL PARSER THAT ACTUALLY WORKS
function parseToMermaid(definition: any): string {
    try {
        // Handle wrapped definitions
        let smDef = definition;
        if (definition?.definition && typeof definition.definition === 'object') {
            smDef = definition.definition;
        }

        if (!smDef?.States || !smDef?.StartAt) {
            console.warn('Invalid state machine structure:', smDef);
            return `graph TD\n  error["Invalid state machine definition"]`;
        }

        const states = smDef.States;
        const startState = smDef.StartAt;
        const lines = ['graph TD'];

        // Add nodes - SIMPLE LABELS WITHOUT HTML TAGS
        Object.entries(states).forEach(([name, state]: [string, any]) => {
            const safeId = name.replace(/[^a-zA-Z0-9]/g, '_');
            const type = state?.Type || 'State';
            // CRITICAL: Use simple double-quoted labels WITHOUT <br/> or HTML
            lines.push(`  ${safeId}["${type}: ${name}"]`);
        });

        // Add edges
        Object.entries(states).forEach(([name, state]: [string, any]) => {
            const safeSource = name.replace(/[^a-zA-Z0-9]/g, '_');

            // Skip end states
            if (state?.End === true) return;

            // Handle Next transition
            if (state?.Next && states[state.Next]) {
                const safeTarget = state.Next.replace(/[^a-zA-Z0-9]/g, '_');
                lines.push(`  ${safeSource} --> ${safeTarget}`);
            }

            // Handle Choice states
            if (state?.Type === 'Choice' && Array.isArray(state.Choices)) {
                state.Choices.forEach((choice: any) => {
                    if (choice?.Next && states[choice.Next]) {
                        const safeTarget = choice.Next.replace(/[^a-zA-Z0-9]/g, '_');
                        lines.push(`  ${safeSource} --> ${safeTarget}`);
                    }
                });
                if (state.Default && states[state.Default]) {
                    const safeTarget = state.Default.replace(/[^a-zA-Z0-9]/g, '_');
                    lines.push(`  ${safeSource} --> ${safeTarget}`);
                }
            }

            // Handle Message states (your custom type)
            if (state?.Type === 'Message') {
                if (state.TimeoutPath && states[state.TimeoutPath]) {
                    const safeTarget = state.TimeoutPath.replace(/[^a-zA-Z0-9]/g, '_');
                    lines.push(`  ${safeSource} -.->|timeout| ${safeTarget}`);
                }
                if (Array.isArray(state.Catch)) {
                    state.Catch.forEach((clause: any) => {
                        if (clause?.Next && states[clause.Next]) {
                            const safeTarget = clause.Next.replace(/[^a-zA-Z0-9]/g, '_');
                            lines.push(`  ${safeSource} -.->|error| ${safeTarget}`);
                        }
                    });
                }
            }
        });

        // Highlight start state
        const safeStart = startState.replace(/[^a-zA-Z0-9]/g, '_');
        lines.push(`  classDef start fill:#4F46E5,stroke:#3730A3,color:white`);
        lines.push(`  class ${safeStart} start`);

        return lines.join('\n');
    } catch (error) {
        console.error('Parser exception:', error);
        return `graph TD\n  error["Parser error: ${(error as Error).message}"]`;
    }
}
