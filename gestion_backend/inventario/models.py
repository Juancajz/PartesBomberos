from django.db import models
from carros.models import Carro 

class Material(models.Model):

    CATEGORIAS = [
        ('AGUA', 'Material de Agua'),
        ('RESCATE', 'Material de Rescate'),
        ('TRAUMA', 'Material Médico'),
        ('EPP', 'Protección Personal'),
        ('COMUNICACION', 'Comunicaciones'),
        ('HERRAMIENTAS', 'Herramientas y Zapadores'),
        ('OTRO', 'Otros'),
    ]

    ESTADOS = [
        ('OPERATIVO', '🟢 Operativo'),
        ('MANTENCION', '🟡 En Mantención'),
        ('BAJA', '🔴 De Baja'),
    ]

    carro = models.ForeignKey(
        Carro, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='materiales' 
    )

    # 2. Detalles del Material
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default='HERRAMIENTAS')
    ubicacion = models.CharField(max_length=100, blank=True, null=True, help_text="Ej: Cajonera 3, Bandeja superior")
    
    # 3. Control de Stock 
    cantidad = models.PositiveIntegerField(default=1)
    numero_serie = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    # 4. Estado
    estado = models.CharField(max_length=20, choices=ESTADOS, default='OPERATIVO')
    fecha_ingreso = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.carro})"