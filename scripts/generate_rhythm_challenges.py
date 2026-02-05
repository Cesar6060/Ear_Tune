"""
Script to generate rhythm challenge audio files and database entries.
Creates click tracks for beginner, intermediate, and advanced difficulties.
"""

import os
import sys
import django
import numpy as np
from pydub import AudioSegment
from pydub.generators import Sine

# Add the project directory to the path
project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_dir)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'll_project.settings')
django.setup()

from ear_tune.models import RhythmChallenge, Game


def generate_click_sound(frequency=1000, duration_ms=50, volume_db=-10):
    """
    Generate a single click sound.

    Args:
        frequency: Frequency of the click in Hz
        duration_ms: Duration of the click in milliseconds
        volume_db: Volume adjustment in decibels

    Returns:
        AudioSegment: The generated click sound
    """
    # Generate a short sine wave
    click = Sine(frequency).to_audio_segment(duration=duration_ms)

    # Apply a quick fade in/out to avoid pops
    click = click.fade_in(5).fade_out(5)

    # Adjust volume
    click = click + volume_db

    return click


def generate_rhythm_pattern(pattern, tempo, time_signature="4/4", bars=4):
    """
    Generate an audio file from a rhythm pattern.

    Args:
        pattern: List of beat positions (e.g., [0, 1, 2, 3] for quarter notes)
        tempo: Tempo in BPM
        time_signature: Time signature (e.g., "4/4")
        bars: Number of bars to generate

    Returns:
        AudioSegment: The generated rhythm pattern
    """
    # Parse time signature
    beats_per_bar, note_value = map(int, time_signature.split('/'))

    # Calculate timing
    ms_per_beat = (60000 / tempo)  # milliseconds per beat
    ms_per_bar = ms_per_beat * beats_per_bar
    total_duration = ms_per_bar * bars

    # Create silent audio segment
    audio = AudioSegment.silent(duration=int(total_duration))

    # Generate different sounds for downbeats and other beats
    downbeat_click = generate_click_sound(frequency=1200, volume_db=-8)
    regular_click = generate_click_sound(frequency=800, volume_db=-12)

    # Add clicks for each bar
    for bar in range(bars):
        bar_start = bar * ms_per_bar

        for beat_position in pattern:
            if beat_position < beats_per_bar:
                click_time = bar_start + (beat_position * ms_per_beat)

                # Use downbeat click for first beat of each bar
                if beat_position == 0:
                    audio = audio.overlay(downbeat_click, position=int(click_time))
                else:
                    audio = audio.overlay(regular_click, position=int(click_time))

    return audio


def generate_syncopated_pattern(pattern, tempo, time_signature="4/4", bars=4):
    """
    Generate a syncopated rhythm pattern with more complex subdivisions.

    Args:
        pattern: List of tuples (beat_position, subdivision)
                 e.g., [(0, 0), (0.5, 0), (1, 0), (1.5, 0)] for eighth notes
        tempo: Tempo in BPM
        time_signature: Time signature
        bars: Number of bars

    Returns:
        AudioSegment: The generated rhythm pattern
    """
    # Parse time signature
    beats_per_bar, note_value = map(int, time_signature.split('/'))

    # Calculate timing
    ms_per_beat = (60000 / tempo)
    ms_per_bar = ms_per_beat * beats_per_bar
    total_duration = ms_per_bar * bars

    # Create silent audio segment
    audio = AudioSegment.silent(duration=int(total_duration))

    # Generate different sounds
    downbeat_click = generate_click_sound(frequency=1200, volume_db=-8)
    regular_click = generate_click_sound(frequency=800, volume_db=-12)
    offbeat_click = generate_click_sound(frequency=600, volume_db=-14)

    # Add clicks for each bar
    for bar in range(bars):
        bar_start = bar * ms_per_bar

        for beat_position in pattern:
            if beat_position < beats_per_bar:
                click_time = bar_start + (beat_position * ms_per_beat)

                # Determine click type
                if beat_position == 0:
                    click = downbeat_click
                elif beat_position == int(beat_position):
                    click = regular_click
                else:
                    click = offbeat_click

                audio = audio.overlay(click, position=int(click_time))

    return audio


def create_beginner_challenges(output_dir, game):
    """Create beginner level rhythm challenges."""
    challenges = []

    # Beginner patterns (simple quarter and half notes)
    patterns = [
        {
            'name': 'quarter_notes',
            'pattern': [0, 1, 2, 3],
            'tempo': 80,
            'description': 'Quarter notes',
            'correct_pattern': {'beats': [0, 1, 2, 3], 'subdivision': 'quarter'}
        },
        {
            'name': 'half_notes',
            'pattern': [0, 2],
            'tempo': 80,
            'description': 'Half notes',
            'correct_pattern': {'beats': [0, 2], 'subdivision': 'half'}
        },
        {
            'name': 'whole_note',
            'pattern': [0],
            'tempo': 80,
            'description': 'Whole note',
            'correct_pattern': {'beats': [0], 'subdivision': 'whole'}
        },
        {
            'name': 'dotted_half',
            'pattern': [0, 3],
            'tempo': 90,
            'description': 'Dotted half notes in 3/4',
            'correct_pattern': {'beats': [0], 'subdivision': 'dotted_half'}
        },
    ]

    for pattern_info in patterns:
        # Generate audio
        audio = generate_rhythm_pattern(
            pattern_info['pattern'],
            pattern_info['tempo'],
            time_signature="4/4",
            bars=4
        )

        # Save audio file
        filename = f"beginner_{pattern_info['name']}.mp3"
        filepath = os.path.join(output_dir, filename)
        audio.export(filepath, format='mp3', bitrate='192k')

        # Create database entry
        challenge = RhythmChallenge.objects.create(
            game=game,
            pattern_data={
                'pattern': pattern_info['pattern'],
                'description': pattern_info['description']
            },
            tempo=pattern_info['tempo'],
            time_signature="4/4",
            difficulty='beginner',
            audio_file=f'static/audio/rhythm/{filename}',
            correct_pattern=pattern_info['correct_pattern']
        )
        challenges.append(challenge)
        print(f"Created beginner challenge: {pattern_info['name']}")

    return challenges


def create_intermediate_challenges(output_dir, game):
    """Create intermediate level rhythm challenges."""
    challenges = []

    # Intermediate patterns (eighth notes, simple syncopation)
    patterns = [
        {
            'name': 'eighth_notes',
            'pattern': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
            'tempo': 100,
            'description': 'Eighth notes',
            'correct_pattern': {'beats': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], 'subdivision': 'eighth'}
        },
        {
            'name': 'quarter_eighth',
            'pattern': [0, 1, 1.5, 2, 3],
            'tempo': 100,
            'description': 'Mixed quarter and eighth notes',
            'correct_pattern': {'beats': [0, 1, 1.5, 2, 3], 'subdivision': 'mixed'}
        },
        {
            'name': 'simple_syncopation',
            'pattern': [0, 0.5, 1.5, 2, 2.5, 3.5],
            'tempo': 110,
            'description': 'Simple syncopation',
            'correct_pattern': {'beats': [0, 0.5, 1.5, 2, 2.5, 3.5], 'subdivision': 'syncopated'}
        },
        {
            'name': 'dotted_quarter',
            'pattern': [0, 1.5, 3],
            'tempo': 95,
            'description': 'Dotted quarter notes',
            'correct_pattern': {'beats': [0, 1.5, 3], 'subdivision': 'dotted_quarter'}
        },
    ]

    for pattern_info in patterns:
        # Generate audio
        audio = generate_syncopated_pattern(
            pattern_info['pattern'],
            pattern_info['tempo'],
            time_signature="4/4",
            bars=4
        )

        # Save audio file
        filename = f"intermediate_{pattern_info['name']}.mp3"
        filepath = os.path.join(output_dir, filename)
        audio.export(filepath, format='mp3', bitrate='192k')

        # Create database entry
        challenge = RhythmChallenge.objects.create(
            game=game,
            pattern_data={
                'pattern': pattern_info['pattern'],
                'description': pattern_info['description']
            },
            tempo=pattern_info['tempo'],
            time_signature="4/4",
            difficulty='intermediate',
            audio_file=f'static/audio/rhythm/{filename}',
            correct_pattern=pattern_info['correct_pattern']
        )
        challenges.append(challenge)
        print(f"Created intermediate challenge: {pattern_info['name']}")

    return challenges


def create_advanced_challenges(output_dir, game):
    """Create advanced level rhythm challenges."""
    challenges = []

    # Advanced patterns (sixteenth notes, complex syncopation, triplets)
    patterns = [
        {
            'name': 'sixteenth_notes',
            'pattern': [i * 0.25 for i in range(16)],
            'tempo': 90,
            'description': 'Sixteenth notes',
            'correct_pattern': {'beats': [i * 0.25 for i in range(16)], 'subdivision': 'sixteenth'}
        },
        {
            'name': 'complex_syncopation',
            'pattern': [0, 0.5, 1.25, 2, 2.75, 3.5],
            'tempo': 120,
            'description': 'Complex syncopation with sixteenth notes',
            'correct_pattern': {'beats': [0, 0.5, 1.25, 2, 2.75, 3.5], 'subdivision': 'complex_syncopated'}
        },
        {
            'name': 'triplet_feel',
            'pattern': [0, 0.667, 1.333, 2, 2.667, 3.333],
            'tempo': 110,
            'description': 'Triplet feel',
            'correct_pattern': {'beats': [0, 0.667, 1.333, 2, 2.667, 3.333], 'subdivision': 'triplet'}
        },
        {
            'name': 'odd_meter',
            'pattern': [0, 1, 2, 3, 4],
            'tempo': 100,
            'description': '5/4 time signature',
            'correct_pattern': {'beats': [0, 1, 2, 3, 4], 'subdivision': 'quarter', 'time_signature': '5/4'}
        },
    ]

    for pattern_info in patterns:
        # Generate audio
        time_sig = pattern_info.get('time_signature', "4/4")
        if 'time_signature' in pattern_info['correct_pattern']:
            time_sig = pattern_info['correct_pattern']['time_signature']

        audio = generate_syncopated_pattern(
            pattern_info['pattern'],
            pattern_info['tempo'],
            time_signature=time_sig,
            bars=4
        )

        # Save audio file
        filename = f"advanced_{pattern_info['name']}.mp3"
        filepath = os.path.join(output_dir, filename)
        audio.export(filepath, format='mp3', bitrate='192k')

        # Create database entry
        challenge = RhythmChallenge.objects.create(
            game=game,
            pattern_data={
                'pattern': pattern_info['pattern'],
                'description': pattern_info['description']
            },
            tempo=pattern_info['tempo'],
            time_signature=time_sig,
            difficulty='advanced',
            audio_file=f'static/audio/rhythm/{filename}',
            correct_pattern=pattern_info['correct_pattern']
        )
        challenges.append(challenge)
        print(f"Created advanced challenge: {pattern_info['name']}")

    return challenges


def main():
    """Main execution function."""
    # Define output directory
    output_dir = os.path.join(project_dir, 'static', 'audio', 'rhythm')

    # Create directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    print(f"Output directory: {output_dir}")

    # Get or create the Rhythm Training game
    game, created = Game.objects.get_or_create(
        name='Rhythm Training',
        defaults={
            'description': 'Test your ability to identify and reproduce rhythm patterns'
        }
    )

    if created:
        print("Created new 'Rhythm Training' game")
    else:
        print("Using existing 'Rhythm Training' game")

    # Clear existing rhythm challenges for this game
    existing_count = RhythmChallenge.objects.filter(game=game).count()
    if existing_count > 0:
        print(f"Removing {existing_count} existing rhythm challenges...")
        RhythmChallenge.objects.filter(game=game).delete()

    # Generate challenges for all difficulty levels
    print("\n=== Generating Beginner Challenges ===")
    beginner_challenges = create_beginner_challenges(output_dir, game)

    print("\n=== Generating Intermediate Challenges ===")
    intermediate_challenges = create_intermediate_challenges(output_dir, game)

    print("\n=== Generating Advanced Challenges ===")
    advanced_challenges = create_advanced_challenges(output_dir, game)

    # Summary
    total_challenges = len(beginner_challenges) + len(intermediate_challenges) + len(advanced_challenges)
    print("\n" + "=" * 50)
    print("Rhythm Challenge Generation Complete!")
    print("=" * 50)
    print(f"Beginner:     {len(beginner_challenges)} challenges")
    print(f"Intermediate: {len(intermediate_challenges)} challenges")
    print(f"Advanced:     {len(advanced_challenges)} challenges")
    print(f"Total:        {total_challenges} challenges")
    print(f"\nAudio files saved to: {output_dir}")
    print("=" * 50)


if __name__ == "__main__":
    main()
