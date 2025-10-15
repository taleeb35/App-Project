-- Remove admin role from admin@weblerzdemo.com (sub-admin should only manage their own clinic)
-- Only ceo@weblerzdemo.com should be the Super Admin

DELETE FROM user_roles 
WHERE user_id = 'ab9616bc-5af6-453d-ae97-cecd5a1766be';