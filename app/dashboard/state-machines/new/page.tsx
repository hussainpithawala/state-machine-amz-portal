'use client';

import { useRouter } from 'next/navigation';
import { CreateStateMachineForm } from '@/components/forms/create-state-machine-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateStateMachinePage() {
    const router = useRouter();

    const handleSuccess = (stateMachineId: string) => {
        // Redirect to the newly created state machine detail page
        router.push(`/dashboard/state-machines/${encodeURIComponent(stateMachineId)}`);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/state-machines">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to State Machines
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create State Machine</h1>
                        <p className="text-gray-500 mt-1">
                            Define a new workflow using AWS Step Functions-compatible JSON
                        </p>
                    </div>
                </div>
            </div>

            {/* Create Form */}
            <CreateStateMachineForm onSuccess={handleSuccess} />
        </div>
    );
}
