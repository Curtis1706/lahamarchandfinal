import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Department {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    _count?: {
        users: number;
        clients: number;
    };
}

export function useDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/departments');
            if (!response.ok) throw new Error('Erreur lors du chargement des départements');
            const data = await response.json();
            setDepartments(data);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { departments, isLoading, error, refresh: fetchDepartments };
}
