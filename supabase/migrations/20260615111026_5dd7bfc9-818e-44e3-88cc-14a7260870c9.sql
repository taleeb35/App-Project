UPDATE auth.identities SET identity_data = identity_data || jsonb_build_object('email','krysta@availcannabis.com') WHERE user_id = 'ab9616bc-5af6-453d-ae97-cecd5a1766be' AND provider = 'email';
UPDATE auth.identities SET identity_data = identity_data || jsonb_build_object('email','ceo@availcannabis.com') WHERE user_id = 'b766892f-4dcb-4a1b-a18b-e96eb0618b24' AND provider = 'email';

UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('email','krysta@availcannabis.com'), updated_at = now() WHERE id = 'ab9616bc-5af6-453d-ae97-cecd5a1766be';
UPDATE auth.users SET raw_user_meta_data = COALESCE(raw_user_meta_data,'{}'::jsonb) || jsonb_build_object('email','ceo@availcannabis.com'), updated_at = now() WHERE id = 'b766892f-4dcb-4a1b-a18b-e96eb0618b24';

UPDATE public.profiles SET email = 'krysta@availcannabis.com' WHERE id = 'ab9616bc-5af6-453d-ae97-cecd5a1766be';
UPDATE public.profiles SET email = 'ceo@availcannabis.com' WHERE id = 'b766892f-4dcb-4a1b-a18b-e96eb0618b24';