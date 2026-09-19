# Remove XP, levels, streaks, achievements and the progress tree

Reviewly scored every action in experience points: XP and level on the profile, a streak, a `daily_xp` table, a weekly XP chart, XP badges and a combo readout in the review modes, a level-up banner, and a `/tree` page whose only purpose was visualising that progress. None of it served the app's actual job, which is generating review questions from a user's material and having them answer those questions, so it read as clutter. We removed the whole layer: `profiles.xp`/`level`/`streak`/`last_active`, the `daily_xp` table and its weekly endpoint, the `achievements` and `user_achievements` tables with their award logic, `XPBar`, `Exp.svg`, the Total XP stat cards, the level-up banner, the XP and combo readouts, and the `/tree` route with `TreeIllustrations` and `tree_theme`. The `sessions` table stays, and so do `mastery_score`, `total_sessions` and `total_study_time_minutes`, which measure progress at the material rather than points.

## Considered options

Keeping achievements as badges with no XP reward. Rejected because every existing achievement paid out in XP and nothing else, so without the reward they would have been purely decorative.
