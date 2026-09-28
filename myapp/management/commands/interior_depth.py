"""Turns each car's interior photo into 3D: a depth map (white = near) made by Depth Anything V2 on the CPU.

Runs in its own environment (LOCAL_3D_PYTHON, default ~/.local/share/tuyona-3d) with interior_depth.py
(LOCAL_DEPTH_SCRIPT). Only cars with an interior photo and no depth map yet are processed.
"""
import os
import subprocess
import tempfile
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand

from myapp.models import Car


class Command(BaseCommand):
    help = 'Аз сурати дохили мошин харитаи чуқурӣ месозад (салон дар 3D)'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Аз нав созад')

    def handle(self, *args, force=False, **options):
        cars = [c for c in Car.objects.exclude(interior='') if c.interior and (force or not c.interior_depth)]
        self.stdout.write(f'Мошинҳо: {len(cars)}')
        if not cars:
            return
        home = Path.home() / '.local/share'
        python = os.environ.get('LOCAL_3D_PYTHON', str(home / 'tuyona-3d/bin/python'))
        script = os.environ.get('LOCAL_DEPTH_SCRIPT', str(home / 'triposr/interior_depth.py'))
        with tempfile.TemporaryDirectory() as folder:
            outputs = {car.id: Path(folder) / f'car-{car.id}-depth.png' for car in cars}
            args = [part for car in cars for part in (car.interior.path, str(outputs[car.id]))]
            subprocess.run([python, script, *args], check=True)
            for car in cars:
                with open(outputs[car.id], 'rb') as f:
                    car.interior_depth.save(f'car-{car.id}-depth.png', File(f), save=True)
                self.stdout.write(f'  ✓ {car.name}')
        self.stdout.write(self.style.SUCCESS('Тайёр.'))
