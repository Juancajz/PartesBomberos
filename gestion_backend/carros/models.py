from django.db import models

# Create your models here.
class Carro(models.Model):
    
    
    ESTADO_CHOICES = [
        ('EN_SERVICIO', 'En Servicio'),
        ('FUERA_DE_SERVICIO', 'Fuera de Servicio'),
        ('EN_MANTENCION', 'En Mantención'),
    ]

    TIPO_CARRO_CHOICES = [
            ('BOMBA', 'Bomba'),
            ('ESCALA', 'Escala'),
            ('RESCATE', 'Rescate'),
            ('FORESTAL', 'Forestal'),
            ('Z', 'Cisterna (Z)'),
            ('OTRO', 'Otro'),
        ]

    nombre = models.CharField(max_length=50,unique=True)
    patente = models.CharField(max_length=10,blank=True,null=True)
    modelo = models.CharField(max_length=100,blank=True,null=True)
    ano = models.IntegerField(blank=True, null=True)
    capacidad_personal = models.IntegerField(default=0)

    tipo = models.CharField(
            max_length=50, 
            choices=TIPO_CARRO_CHOICES, 
            default='BOMBA'
        )

    estado = models.CharField(
            max_length=50, 
            choices=ESTADO_CHOICES, 
            default='EN_SERVICIO'
        )

    def __str__(self):
        return self.nombre