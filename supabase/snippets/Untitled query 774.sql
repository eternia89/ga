 SELECT au.id as auth_id, au.email, up.id as profile_id
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.id = au.id
  WHERE au.email = 'hi@samuelekanata.com';