import AchievementBadge from "./AchievementBadge";

const ACHIEVEMENT_RULES = [
    {
      id: "first-darshan",
      icon: "temple_hindu",
      title: "First Darshan",
      description: "Visit your first pandal",
      unlocked: ({ visited }) => visited >= 1,
    },
    {
      id: "five-pandals",
      icon: "looks_5",
      title: "5 Pandals",
      description: "Complete five darshans",
      unlocked: ({ visited }) => visited >= 5,
    },
    {
      id: "ten-pandals",
      icon: "military_tech",
      title: "10 Pandals",
      description: "Complete ten darshans",
      unlocked: ({ visited }) => visited >= 10,
    },
    {
      id: "category-explorer",
      icon: "category",
      title: "Category Explorer",
      description: "Explore two Puja styles",
      unlocked: ({ categories }) => categories >= 2,
    },
    {
      id: "pujo-explorer",
      icon: "explore",
      title: "Pujo Explorer",
      description: "Visit half the loaded pandals",
      unlocked: ({ progress }) => progress >= 0.5,
    },
    {
      id: "route-explorer",
      icon: "route",
      title: "Route Explorer",
      description: "Create a route to a pandal",
      unlocked: ({ hasRoute }) => hasRoute,
    },
    {
      id: "metro-explorer",
      icon: "train",
      title: "Metro Explorer",
      description: "Plan a Metro + Walk route",
      unlocked: ({ hasMetroRoute }) => hasMetroRoute,
    },
];

const Achievements = ({ achievementStats }) => {
  const achievements = ACHIEVEMENT_RULES.map((achievement) => ({
    ...achievement,
    unlocked: achievement.unlocked(achievementStats),
  }));

  return (
    <section>
      <div className="mb-2.5">
        <p className="text-[10px] font-bold tracking-[0.16em] text-[#a86743]">MILESTONES</p>
        <h2 className="mt-0.5 text-base font-bold text-[#1b302b]">Pujo Achievements</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.id} {...achievement} />
        ))}
      </div>
    </section>
  );
};

export default Achievements;