-- Update the realm constraint to match the app's actual realm values
ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_realm_check;

ALTER TABLE quests 
ADD CONSTRAINT quests_realm_check 
CHECK (realm IN (
  'Mind & Skill',
  'Emotional & Spiritual', 
  'Body & Discipline',
  'Creation & Mission',
  'Heart & Loyalty'
));
