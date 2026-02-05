"""
Script to create EQChallenge database entries for the frequency recognition game.
Run this after generating audio samples with generate_eq_samples.py
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

from ear_tune.models import Game, FrequencyBand, EQChallenge


def create_eq_challenges():
    """Create EQChallenge entries for all generated audio files."""

    print("=" * 60)
    print("Creating EQ Challenges")
    print("=" * 60)

    # Get or create the Frequency Recognition game
    game, created = Game.objects.get_or_create(
        name='Frequency Recognition',
        defaults={'description': 'Train your ears to identify frequency ranges'}
    )
    if created:
        print(f"Created game: {game.name}")
    else:
        print(f"Using existing game: {game.name}")

    # Get all frequency bands
    frequency_bands = FrequencyBand.objects.all()
    if not frequency_bands.exists():
        print("\nError: No frequency bands found in database!")
        print("Please load the frequency_bands.json fixture first:")
        print("  python manage.py loaddata ear_tune/fixtures/frequency_bands.json")
        return

    print(f"\nFound {frequency_bands.count()} frequency bands")

    # Source audio files that were generated
    source_files = ['pink_noise', 'drums', 'bass', 'synth_pad']

    # EQ change amounts (in dB)
    change_amounts = [-12, -9, -6, -3, 3, 6, 9, 12]

    # Difficulty mapping based on change amount
    def get_difficulty(change_amount):
        abs_change = abs(change_amount)
        if abs_change >= 9:
            return 'beginner'  # Easier to hear
        elif abs_change >= 6:
            return 'intermediate'
        else:
            return 'advanced'  # Harder to hear subtle changes

    created_count = 0
    skipped_count = 0

    print("\nCreating challenges...")

    for source_file in source_files:
        for freq_band in frequency_bands:
            for change_amount in change_amounts:
                # Create the challenge
                band_name_slug = freq_band.name.lower().replace(' ', '_')
                difficulty = get_difficulty(change_amount)

                challenge, created = EQChallenge.objects.get_or_create(
                    game=game,
                    source_audio=source_file,
                    frequency_band=freq_band,
                    change_amount=change_amount,
                    defaults={'difficulty': difficulty}
                )

                if created:
                    created_count += 1
                    if created_count <= 10 or created_count % 50 == 0:
                        print(f"  Created: {source_file} | {freq_band.name} | {change_amount:+d}dB | {difficulty}")
                else:
                    skipped_count += 1

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Challenges created: {created_count}")
    print(f"Challenges skipped (already exist): {skipped_count}")
    print(f"Total challenges in database: {EQChallenge.objects.count()}")
    print("\nBreakdown by difficulty:")
    for diff in ['beginner', 'intermediate', 'advanced']:
        count = EQChallenge.objects.filter(difficulty=diff).count()
        print(f"  {diff.capitalize()}: {count}")
    print("=" * 60)


if __name__ == '__main__':
    create_eq_challenges()
