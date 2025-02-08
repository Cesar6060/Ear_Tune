from django import forms

class AnswerForm(forms.Form):
    """A simple form for users to submit an answer to a challenge."""
    answer = forms.CharField(label='Your Answer', max_length=50)