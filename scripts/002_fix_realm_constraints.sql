-- Update quests table realm check constraint to match app values
ALTER TABLE quests DROP CONSTRAINT quests_realm_check;

ALTER TABLE quests 
ADD CONSTRAINT quests_realm_check 
CHECK (realm IN ('Mind & Skill', 'Emotional & Spiritual', 'Body & Discipline', 'Creation & Mission', 'Heart & Loyalty'));
