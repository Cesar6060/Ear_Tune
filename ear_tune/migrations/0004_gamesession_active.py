# Generated by Django 5.1.6 on 2025-02-11 00:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ear_tune', '0003_alter_gamesession_score'),
    ]

    operations = [
        migrations.AddField(
            model_name='gamesession',
            name='active',
            field=models.BooleanField(default=True),
        ),
    ]
