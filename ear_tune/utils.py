# Ear_Tune/ear_tune/utils.py
"""
utils.py
--------
Helper functions for the EarTune application.
"""

def validate_answer(user_input, correct_value):
    if user_input == correct_value:
        return "Correct!", 1
    else:
        return "Incorrect. Try again!", 0
    


