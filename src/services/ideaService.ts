import { createClient } from '../lib/supabase/client';

export type Idea = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  target: string;
  differentiation: string;
  monetization: string;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  idea_id: string;
  created_at: string;
};

export const ideaService = {
  saveIdea: async (idea: Omit<Idea, 'id' | 'created_at'>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ideas')
      .insert([idea])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getIdeas: async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Idea[];
  },

  deleteIdea: async (id: string, userId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  toggleFavorite: async (ideaId: string, userId: string) => {
    const supabase = createClient();
    
    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return false; // isFavorite = false
    } else {
      // Add favorite
      const { error } = await supabase
        .from('favorites')
        .insert([{ idea_id: ideaId, user_id: userId }]);
      if (error) throw error;
      return true; // isFavorite = true
    }
  },

  getFavorites: async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        ideas (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((f: any) => f.ideas) as Idea[];
  },
  
  checkIsFavorite: async (ideaId: string, userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .single();
    return !!data;
  }
};
