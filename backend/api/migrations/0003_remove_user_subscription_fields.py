from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_user_plan_type_user_stripe_customer_id_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='plan_type',
        ),
        migrations.RemoveField(
            model_name='user',
            name='subscription_status',
        ),
        migrations.RemoveField(
            model_name='user',
            name='subscription_start_date',
        ),
        migrations.RemoveField(
            model_name='user',
            name='subscription_end_date',
        ),
        migrations.RemoveField(
            model_name='user',
            name='stripe_customer_id',
        ),
        migrations.RemoveField(
            model_name='user',
            name='stripe_subscription_id',
        ),
    ]

