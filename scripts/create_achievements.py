"""
Script to create initial achievements for the gamification system.
Creates achievements for beginner, intermediate, and advanced skill levels.
"""

import os
import sys
import django

# Add the project directory to the path
project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_dir)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'll_project.settings')
django.setup()

from ear_tune.models import Achievement


def create_beginner_achievements():
    """Create beginner level achievements."""
    achievements = []

    beginner_data = [
        {
            'name': 'First Steps',
            'description': 'Complete your first game',
            'icon': '\U0001F3B5',  # Musical note emoji
            'criteria_type': 'games_played',
            'criteria_value': 1,
            'xp_reward': 50,
        },
        {
            'name': 'Quick Learner',
            'description': 'Complete 5 games',
            'icon': '\U0001F4DA',  # Books emoji
            'criteria_type': 'games_played',
            'criteria_value': 5,
            'xp_reward': 75,
        },
        {
            'name': 'Getting Started',
            'description': 'Reach level 3',
            'icon': '\u2B50',  # Star emoji
            'criteria_type': 'level',
            'criteria_value': 3,
            'xp_reward': 100,
        },
        {
            'name': 'Sharp Ear',
            'description': 'Achieve 90% or better accuracy on a game',
            'icon': '\U0001F442',  # Ear emoji
            'criteria_type': 'accuracy',
            'criteria_value': 90,
            'xp_reward': 100,
        },
        {
            'name': 'Hat Trick',
            'description': 'Maintain a 3-day streak',
            'icon': '\U0001F525',  # Fire emoji
            'criteria_type': 'streak',
            'criteria_value': 3,
            'xp_reward': 75,
        },
    ]

    for data in beginner_data:
        achievement, created = Achievement.objects.get_or_create(
            name=data['name'],
            defaults=data
        )

        if created:
            achievements.append(achievement)
            print(f"Created beginner achievement: {achievement.name}")
        else:
            print(f"Achievement already exists: {achievement.name}")

    return achievements


def create_intermediate_achievements():
    """Create intermediate level achievements."""
    achievements = []

    intermediate_data = [
        {
            'name': 'Rising Star',
            'description': 'Reach level 10',
            'icon': '\U0001F31F',  # Glowing star emoji
            'criteria_type': 'level',
            'criteria_value': 10,
            'xp_reward': 150,
        },
        {
            'name': 'Dedicated',
            'description': 'Complete 50 games',
            'icon': '\U0001F4AA',  # Flexed biceps emoji
            'criteria_type': 'games_played',
            'criteria_value': 50,
            'xp_reward': 150,
        },
        {
            'name': 'Week Warrior',
            'description': 'Maintain a 7-day streak',
            'icon': '\U0001F525',  # Fire emoji
            'criteria_type': 'streak',
            'criteria_value': 7,
            'xp_reward': 125,
        },
        {
            'name': 'Perfectionist',
            'description': 'Achieve 100% accuracy on a game',
            'icon': '\U0001F4AF',  # Hundred points emoji
            'criteria_type': 'accuracy',
            'criteria_value': 100,
            'xp_reward': 150,
        },
        {
            'name': 'Speed Demon',
            'description': 'Complete 10 games in one session',
            'icon': '\U0001F3C3',  # Runner emoji
            'criteria_type': 'games_played',
            'criteria_value': 10,
            'xp_reward': 125,
        },
    ]

    for data in intermediate_data:
        achievement, created = Achievement.objects.get_or_create(
            name=data['name'],
            defaults=data
        )

        if created:
            achievements.append(achievement)
            print(f"Created intermediate achievement: {achievement.name}")
        else:
            print(f"Achievement already exists: {achievement.name}")

    return achievements


def create_advanced_achievements():
    """Create advanced level achievements."""
    achievements = []

    advanced_data = [
        {
            'name': 'Master',
            'description': 'Reach level 25',
            'icon': '\U0001F451',  # Crown emoji
            'criteria_type': 'level',
            'criteria_value': 25,
            'xp_reward': 200,
        },
        {
            'name': 'Centurion',
            'description': 'Complete 100 games',
            'icon': '\U0001F396',  # Military medal emoji
            'criteria_type': 'games_played',
            'criteria_value': 100,
            'xp_reward': 200,
        },
        {
            'name': 'Inferno',
            'description': 'Maintain a 30-day streak',
            'icon': '\U0001F525',  # Fire emoji
            'criteria_type': 'streak',
            'criteria_value': 30,
            'xp_reward': 200,
        },
        {
            'name': 'Legendary',
            'description': 'Reach level 50',
            'icon': '\U0001F48E',  # Gem stone emoji
            'criteria_type': 'level',
            'criteria_value': 50,
            'xp_reward': 250,
        },
        {
            'name': 'Perfect Ten',
            'description': 'Achieve 10 perfect scores in a row',
            'icon': '\U0001F3AF',  # Direct hit emoji
            'criteria_type': 'perfect_scores',
            'criteria_value': 10,
            'xp_reward': 250,
        },
    ]

    for data in advanced_data:
        achievement, created = Achievement.objects.get_or_create(
            name=data['name'],
            defaults=data
        )

        if created:
            achievements.append(achievement)
            print(f"Created advanced achievement: {achievement.name}")
        else:
            print(f"Achievement already exists: {achievement.name}")

    return achievements


def main():
    """Main execution function."""
    print("=" * 60)
    print("Creating Initial Achievements")
    print("=" * 60)

    # Generate achievements for all difficulty levels
    print("\n=== Creating Beginner Achievements ===")
    beginner_achievements = create_beginner_achievements()

    print("\n=== Creating Intermediate Achievements ===")
    intermediate_achievements = create_intermediate_achievements()

    print("\n=== Creating Advanced Achievements ===")
    advanced_achievements = create_advanced_achievements()

    # Summary
    total_created = (
        len(beginner_achievements) +
        len(intermediate_achievements) +
        len(advanced_achievements)
    )
    total_achievements = Achievement.objects.count()

    print("\n" + "=" * 60)
    print("Achievement Creation Complete!")
    print("=" * 60)
    print(f"Newly created:")
    print(f"  Beginner:     {len(beginner_achievements)} achievements")
    print(f"  Intermediate: {len(intermediate_achievements)} achievements")
    print(f"  Advanced:     {len(advanced_achievements)} achievements")
    print(f"  Total new:    {total_created} achievements")
    print(f"\nTotal achievements in database: {total_achievements}")
    print("=" * 60)

    # Display all achievements
    if total_created > 0:
        print("\nNewly Created Achievements:")
        print("-" * 60)
        all_new = (
            beginner_achievements +
            intermediate_achievements +
            advanced_achievements
        )
        for achievement in all_new:
            print(f"\n{achievement.icon} {achievement.name}")
            print(f"   Description: {achievement.description}")
            print(f"   Criteria: {achievement.get_criteria_type_display()} >= {achievement.criteria_value}")
            print(f"   Reward: {achievement.xp_reward} XP")


if __name__ == "__main__":
    main()
