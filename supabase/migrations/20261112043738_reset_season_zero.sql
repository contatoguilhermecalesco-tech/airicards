UPDATE public.profile_data
SET rank = (rank - 'seasonTransition') || jsonb_build_object('season','S0','seasonHistory','[]'::jsonb,'pendingSeasonReward',0,'rewardClaimedFor','[]'::jsonb,'rewardsV2',true)
WHERE rank IS NOT NULL;
