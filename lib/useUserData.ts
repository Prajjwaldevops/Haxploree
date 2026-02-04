import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { supabase } from './supabase';

export interface UserStats {
    id: string;
    clerk_id: string;
    email: string;
    username: string | null;
    total_points: number;
    total_co2_saved: number;
    items_recycled: number;
    rank: number;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    item_type: string;
    weight: number;
    points_earned: number;
    co2_saved: number;
    image_url: string;
    r2_object_key: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
}

interface UseUserDataReturn {
    userStats: UserStats | null;
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updatePoints: (additionalPoints: number, co2Saved: number) => Promise<void>;
}

/**
 * Hook to manage user data from Supabase synced with Clerk
 * 
 * This hook:
 * 1. Fetches or creates a user in Supabase based on Clerk ID
 * 2. Loads user stats and transaction history
 * 3. Provides methods to update points in real-time
 */
export function useUserData(): UseUserDataReturn {
    const { user, isLoaded: isClerkLoaded } = useUser();
    const { getToken } = useAuth();

    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Sync Clerk user to Supabase (create if not exists)
     */
    const syncUserToSupabase = useCallback(async () => {
        if (!user) return null;

        const clerkId = user.id;
        const email = user.primaryEmailAddress?.emailAddress || '';
        const username = user.username || user.firstName || '';

        try {
            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_id', clerkId)
                .single();

            if (existingUser) {
                // Update email if changed
                if (existingUser.email !== email) {
                    await supabase
                        .from('users')
                        .update({ email, username })
                        .eq('clerk_id', clerkId);
                }
                return existingUser;
            }

            // Create new user if not exists
            if (fetchError?.code === 'PGRST116') { // No rows returned
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        clerk_id: clerkId,
                        email: email,
                        username: username,
                        role: 'user',
                        total_points: 0,
                        total_co2_saved: 0,
                        items_recycled: 0,
                    })
                    .select('*')
                    .single();

                if (createError) {
                    console.error('Error creating user:', createError);
                    throw new Error('Failed to create user');
                }
                return newUser;
            }

            throw fetchError;
        } catch (err) {
            console.error('Error syncing user:', err);
            throw err;
        }
    }, [user]);

    /**
     * Fetch user stats and calculate rank
     */
    const fetchUserStats = useCallback(async () => {
        if (!user) return null;

        try {
            const supabaseUser = await syncUserToSupabase();
            if (!supabaseUser) return null;

            // Calculate rank based on total points
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gt('total_points', supabaseUser.total_points || 0);

            const rank = (count || 0) + 1;

            return {
                ...supabaseUser,
                rank,
            } as UserStats;
        } catch (err) {
            console.error('Error fetching user stats:', err);
            throw err;
        }
    }, [user, syncUserToSupabase]);

    /**
     * Fetch user transactions
     */
    const fetchTransactions = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Error fetching transactions:', err);
            return [];
        }
    }, []);

    /**
     * Main data fetch function
     */
    const refetch = useCallback(async () => {
        if (!isClerkLoaded || !user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const stats = await fetchUserStats();
            if (stats) {
                setUserStats(stats);
                const txns = await fetchTransactions(stats.id);
                setTransactions(txns);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [isClerkLoaded, user, fetchUserStats, fetchTransactions]);

    /**
     * Update user points (called after successful deposit)
     */
    const updatePoints = useCallback(async (additionalPoints: number, co2Saved: number) => {
        if (!userStats) return;

        try {
            // Update in Supabase
            const { error } = await supabase
                .from('users')
                .update({
                    total_points: (userStats.total_points || 0) + additionalPoints,
                    total_co2_saved: (userStats.total_co2_saved || 0) + co2Saved,
                    items_recycled: (userStats.items_recycled || 0) + 1,
                })
                .eq('id', userStats.id);

            if (error) throw error;

            // Update local state immediately for responsive UI
            setUserStats(prev => prev ? {
                ...prev,
                total_points: (prev.total_points || 0) + additionalPoints,
                total_co2_saved: (prev.total_co2_saved || 0) + co2Saved,
                items_recycled: (prev.items_recycled || 0) + 1,
            } : null);

        } catch (err) {
            console.error('Error updating points:', err);
            throw err;
        }
    }, [userStats]);

    // Initial fetch
    useEffect(() => {
        refetch();
    }, [refetch]);

    // Set up real-time subscription for transactions
    useEffect(() => {
        if (!userStats?.id) return;

        const channel = supabase
            .channel('user-transactions')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${userStats.id}`,
                },
                (payload) => {
                    console.log('Transaction change:', payload);
                    // Refetch transactions on any change
                    fetchTransactions(userStats.id).then(setTransactions);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userStats?.id, fetchTransactions]);

    return {
        userStats,
        transactions,
        isLoading,
        error,
        refetch,
        updatePoints,
    };
}
