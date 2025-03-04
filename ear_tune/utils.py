def validate_answer(user_input, correct_value):
    """
    Validate the user's answer against the correct answer.
    Supports multiple valid answers separated by underscores.
    """
    user_input = user_input.strip().lower()
    correct_value = correct_value.strip().lower()
    
    is_correct = False
    if "_" in correct_value:
        acceptable = [val.strip().lower() for val in correct_value.split("_")]
        is_correct = user_input in acceptable
    else:
        is_correct = user_input == correct_value
        
    if is_correct:
        return "Correct!", 1
    else:
        return "Incorrect. Try again!", 0