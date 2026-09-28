"""Builds a 3D model (GLB) of each car from its own photo with TRELLIS (image-to-3D) on Hugging Face.

Only cars without a model are processed, so the command can be re-run after a quota pause.
Free GPU quota is limited per day; setting HF_TOKEN in .env gives more.
--local makes them on this computer instead (TripoSR on the CPU, ~1 min per car, no quota, simpler
models); LOCAL_3D_PYTHON and LOCAL_3D_SCRIPT point to its environment and car_to_glb.py.
"""
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db.models import Q

from myapp.models import Car

SPACE = 'trellis-community/TRELLIS'


class Command(BaseCommand):
    help = 'Аз сурати ҳар мошин 3D-модел месозад (TRELLIS, Hugging Face)'

    def add_arguments(self, parser):
        parser.add_argument('--ids', nargs='*', type=int, help='Танҳо ин мошинҳо')
        parser.add_argument('--force', action='store_true', help='Моделҳои мавҷударо аз нав созад')
        parser.add_argument('--local', action='store_true', help='Дар ҳамин компютер созад (TripoSR, бе квота)')

    def handle(self, *args, ids=None, force=False, local=False, **options):
        cars = Car.objects.exclude(image='').order_by('id')
        if ids:
            cars = cars.filter(id__in=ids)
        if not force:
            cars = cars.filter(Q(model_3d='') | Q(model_3d__isnull=True))

        self.stdout.write(f'Мошинҳо: {cars.count()}')
        if local:
            return self.make_locally(list(cars))
        from gradio_client import Client, handle_file

        with tempfile.TemporaryDirectory() as folder:
            client = Client(SPACE, token=settings.HF_TOKEN or None, verbose=False, download_files=folder)
            for car in cars:
                started = time.monotonic()
                try:
                    client.predict(api_name='/start_session')
                    prompt = client.predict(handle_file(car.image.path), api_name='/preprocess_image')
                    _video, glb, _download = client.predict(
                        handle_file(prompt), [], 0, 7.5, 12, 3.0, 12, 'stochastic', 0.95, 1024,
                        api_name='/generate_and_extract_glb',
                    )
                except Exception as error:  # quota, queue timeout, Space restarting…
                    message = str(error)
                    self.stdout.write(self.style.WARNING(f'  ✗ {car.name}: {message[:160]}'))
                    if 'quota' in message.lower():
                        self.stdout.write('Квотаи ройгон тамом шуд — баъдтар ҳамин фармонро боз иҷро кунед (ё HF_TOKEN гузоред).')
                        break
                    continue
                target = Path(folder) / f'car-{car.id}.glb'
                shutil.copyfile(glb, target)
                with open(target, 'rb') as f:
                    car.model_3d.save(f'car-{car.id}.glb', File(f), save=True)
                self.stdout.write(f'  ✓ {car.name}: {round(time.monotonic() - started)} с')
        self.stdout.write(self.style.SUCCESS('Тайёр.'))

    def make_locally(self, cars):
        home = Path.home() / '.local/share'
        python = os.environ.get('LOCAL_3D_PYTHON', str(home / 'tuyona-3d/bin/python'))
        script = Path(os.environ.get('LOCAL_3D_SCRIPT', str(home / 'triposr/car_to_glb.py')))
        with tempfile.TemporaryDirectory() as folder:
            args = []
            for car in cars:
                args += [car.image.path, str(Path(folder) / f'car-{car.id}.glb')]
            # One process for all cars: the model loads once.
            process = subprocess.Popen([python, '-u', str(script), *args], cwd=script.parent, stdout=subprocess.PIPE, text=True)
            by_path = {str(Path(folder) / f'car-{car.id}.glb'): car for car in cars}
            for line in process.stdout:
                src, _, rest = line.partition(' -> ')
                glb = rest.rsplit(' ', 1)[0]
                car = by_path.get(glb)
                if not car:
                    continue
                with open(glb, 'rb') as f:
                    car.model_3d.save(f'car-{car.id}.glb', File(f), save=True)
                self.stdout.write(f'  ✓ {car.name}: {rest.rsplit(" ", 1)[1].strip()}')
            process.wait()
        self.stdout.write(self.style.SUCCESS('Тайёр.'))
