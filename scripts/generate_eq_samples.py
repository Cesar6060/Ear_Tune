"""
Script to generate EQ'd audio samples for the frequency recognition game.
"""

import os
import numpy as np
import soundfile as sf
from scipy import signal

def apply_eq(audio_data, sample_rate, center_freq, gain_db, q_factor=1.0):
    """Apply parametric EQ to audio data."""
    # Convert gain from dB to linear
    gain_linear = 10 ** (gain_db / 20)
    
    # Design a peaking EQ filter
    nyquist = sample_rate / 2
    normalized_freq = center_freq / nyquist
    
    # Ensure normalized frequency is valid
    if normalized_freq >= 1.0:
        normalized_freq = 0.99
    
    # Create peaking filter coefficients
    b, a = signal.iirpeak(normalized_freq, q_factor, sample_rate)
    
    # Apply the filter with gain
    if gain_db > 0:
        filtered = signal.filtfilt(b, a, audio_data) * gain_linear
        # Mix with original (parallel processing)
        output = audio_data + (filtered - audio_data) * 0.7
    else:
        # For cuts, apply inverse filter
        filtered = signal.filtfilt(b, a, audio_data)
        output = audio_data - (audio_data - filtered) * abs(gain_linear - 1)
    
    # Normalize to prevent clipping
    max_val = np.max(np.abs(output))
    if max_val > 1.0:
        output = output / max_val
    
    return output

def generate_test_audio(output_dir):
    """Generate test audio files if no source files exist."""
    sample_rate = 44100
    duration = 5  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Create pink noise
    white_noise = np.random.randn(len(t))
    # Apply 1/f filter to create pink noise
    b, a = signal.butter(1, 0.01)
    pink_noise = signal.filtfilt(b, a, white_noise)
    pink_noise = pink_noise / np.max(np.abs(pink_noise)) * 0.5
    
    # Create drum-like sound (kick drum simulation)
    kick_freq = 60
    kick_envelope = np.exp(-5 * t)
    kick = np.sin(2 * np.pi * kick_freq * t) * kick_envelope
    kick += np.sin(2 * np.pi * kick_freq * 2 * t) * kick_envelope * 0.5
    drums = kick * 0.7
    
    # Create bass-like sound
    bass_freq = 110
    bass = np.sin(2 * np.pi * bass_freq * t) * 0.6
    bass += np.sin(2 * np.pi * bass_freq * 2 * t) * 0.3
    
    # Save source files
    os.makedirs(output_dir, exist_ok=True)
    sf.write(os.path.join(output_dir, 'pink_noise.wav'), pink_noise, sample_rate)
    sf.write(os.path.join(output_dir, 'drums.wav'), drums, sample_rate)
    sf.write(os.path.join(output_dir, 'bass.wav'), bass, sample_rate)
    
    print("Generated test audio files")
    return ['pink_noise.wav', 'drums.wav', 'bass.wav']

def process_audio_file(input_path, output_dir, frequency_bands, gain_amounts):
    """Process a single audio file with various EQ settings."""
    # Load audio file
    audio_data, sample_rate = sf.read(input_path)
    
    # Handle stereo files by converting to mono
    if len(audio_data.shape) > 1:
        audio_data = np.mean(audio_data, axis=1)
    
    # Get filename without extension
    filename = os.path.splitext(os.path.basename(input_path))[0]
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save original
    original_output_path = os.path.join(output_dir, f"{filename}.wav")
    sf.write(original_output_path, audio_data, sample_rate)
    
    # Process each frequency band
    for band_name, center_freq in frequency_bands.items():
        for gain_db in gain_amounts:
            if gain_db == 0:
                continue  # Skip no change
                
            # Apply EQ
            processed = apply_eq(audio_data, sample_rate, center_freq, gain_db)
            
            # Save processed file
            output_filename = f"{filename}_{band_name}_{gain_db}db.wav"
            output_path = os.path.join(output_dir, output_filename)
            sf.write(output_path, processed, sample_rate)
            print(f"Created: {output_filename}")

# Define frequency bands (matching our Django model)
frequency_bands = {
    'sub_bass': 40,
    'bass': 120,
    'low_mids': 350,
    'mids': 1000,
    'high_mids': 3500,
    'presence': 6500,
    'brilliance': 12000
}

# Define gain amounts for different difficulty levels
gain_amounts = [-12, -9, -6, -3, 3, 6, 9, 12]

# Main execution
if __name__ == "__main__":
    source_dir = 'static/audio/eq_samples/sources'
    output_dir = 'static/audio/eq_samples'
    
    # Check if source directory exists
    if not os.path.exists(source_dir):
        os.makedirs(source_dir)
    
    # Get list of source files
    source_files = [f for f in os.listdir(source_dir) if f.endswith('.wav')]
    
    # If no source files, generate test audio
    if not source_files:
        print("No source files found. Generating test audio...")
        source_files = generate_test_audio(source_dir)
    
    # Process each file
    for filename in source_files:
        input_path = os.path.join(source_dir, filename)
        print(f"\nProcessing: {filename}")
        process_audio_file(input_path, output_dir, frequency_bands, gain_amounts)
    
    print("\nAudio generation complete!")