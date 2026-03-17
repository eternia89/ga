ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS holder_id uuid REFERENCES public.user_profiles(id);
