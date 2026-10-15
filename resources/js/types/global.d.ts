import type { Auth } from '@/types/auth';
import type {
    Catalog,
    CurrentHousehold,
    HouseholdSummary,
} from '@/types/models';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            household: CurrentHousehold | null;
            households: HouseholdSummary[];
            catalog: Catalog;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
        flashDataType: {
            toast?: {
                type: 'success' | 'info' | 'warning' | 'error';
                message: string;
            };
            celebrate?: boolean;
            finished?: { id: number; name: string };
            invitation?: {
                id: number;
                url: string;
                email: string | null;
                emailed: boolean;
            };
        };
    }
}
