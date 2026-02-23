// lib/state-machine-parser.ts

interface StateMachineDefinition {
    Comment?: string;
    ID?: string;
    Name?: string;
    StartAt: string;
    States: Record<string, State>;
    Version?: string;
}

interface State {
    Type: 'Task' | 'Choice' | 'Parallel' | 'Map' | 'Wait' | 'Succeed' | 'Fail' | 'Pass' | 'Message';
    Comment?: string;
    Next?: string;
    End?: boolean;
    Resource?: string;
    TimeoutSeconds?: number;
    TimeoutPath?: string;
    Catch?: Array<{
        ErrorEquals: string[];
        Next: string;
    }>;
    Choices?: Array<{
        Variable?: string;
        StringEquals?: string;
        Next: string;
    }>;
    Default?: string;
    Branches?: Array<{
        StartAt: string;
        States: Record<string, State>;
    }>;
    Iterator?: {
        StartAt: string;
        States: Record<string, State>;
    };
    CorrelationKey?: string;
    CorrelationValuePath?: string;
    [key: string]: any;
}

// lib/state-machine-parser.ts

export function parseToMermaid(definition: any): string {
    try {
        const smDef = definition as any;

        if (!smDef.States || !smDef.StartAt) {
            return 'graph TD\n  error["Invalid state machine definition"]';
        }

        const states = smDef.States;
        const startState = smDef.StartAt;

        // Start building mermaid code
        let mermaid = 'graph TD\n';

        // Add all states with proper escaping
        Object.entries(states).forEach(([stateName, state]: [string, any]) => {
            const nodeLabel = getStateNodeLabel(stateName, state);
            // Escape quotes and special characters
            const safeLabel = nodeLabel.replace(/"/g, '\\"');
            const safeId = sanitizeId(stateName);
            mermaid += `  ${safeId}["${safeLabel}"]\n`;
        });

        // Add transitions
        Object.entries(states).forEach(([stateName, state]: [string, any]) => {
            // Skip if it's an end state
            if (state.End === true) {
                return;
            }

            const transitions = getStateTransitions(stateName, state, states);
            transitions.forEach(transition => {
                const sourceId = sanitizeId(stateName);
                const targetId = sanitizeId(transition.target);
                mermaid += `  ${sourceId} --> ${targetId}\n`;
            });
        });

        // Highlight start state
        const safeStartId = sanitizeId(startState);
        mermaid += `  classDef startState fill:#4F46E5,stroke:#3730A3,color:white;\n`;
        mermaid += `  class ${safeStartId} startState;\n`;

        return mermaid;
    } catch (error) {
        console.error('Error parsing state machine to Mermaid:', error);
        return 'graph TD\n  error["Error parsing state machine definition"]';
    }
}

function getStateNodeLabel(stateName: string, state: any): string {
    // ✅ Use simple text without HTML tags
    const baseName = stateName.replace(/([A-Z])/g, ' $1').trim();

    switch (state.Type) {
        case 'Task':
            return `Task: ${baseName}`;
        case 'Choice':
            return `Choice: ${baseName}`;
        case 'Parallel':
            return `Parallel: ${baseName}`;
        case 'Map':
            return `Map: ${baseName}`;
        case 'Wait':
            return `Wait: ${baseName}`;
        case 'Succeed':
            return `Succeed: ${baseName}`;
        case 'Fail':
            return `Fail: ${baseName}`;
        case 'Pass':
            return `Pass: ${baseName}`;
        case 'Message':
            return `Message: ${baseName}`;
        default:
            return `${state.Type}: ${baseName}`;
    }
}

function getStateTransitions(stateName: string, state: any, allStates: Record<string, any>): Array<{ target: string }> {
    const transitions: Array<{ target: string }> = [];

    if (state.End === true) {
        return transitions;
    }

    switch (state.Type) {
        case 'Task':
        case 'Wait':
        case 'Pass':
            if (state.Next && allStates[state.Next]) {
                transitions.push({ target: state.Next });
            }
            break;

        case 'Choice':
            if (state.Choices) {
                state.Choices.forEach((choice: any) => {
                    if (choice.Next && allStates[choice.Next]) {
                        transitions.push({ target: choice.Next });
                    }
                });
            }
            if (state.Default && allStates[state.Default]) {
                transitions.push({ target: state.Default });
            }
            break;

        case 'Message':
            if (state.Next && allStates[state.Next]) {
                transitions.push({ target: state.Next });
            }
            if (state.TimeoutPath && allStates[state.TimeoutPath]) {
                transitions.push({ target: state.TimeoutPath });
            }
            if (state.Catch) {
                state.Catch.forEach((catchClause: any) => {
                    if (catchClause.Next && allStates[catchClause.Next]) {
                        transitions.push({ target: catchClause.Next });
                    }
                });
            }
            break;

        case 'Succeed':
        case 'Fail':
            break;
    }

    return transitions;
}

function sanitizeId(id: string): string {
    // Ensure ID starts with letter and contains only valid characters
    let sanitized = id.replace(/[^a-zA-Z0-9-_]/g, '_');
    if (/^[0-9]/.test(sanitized)) {
        sanitized = '_' + sanitized;
    }
    return sanitized;
}
