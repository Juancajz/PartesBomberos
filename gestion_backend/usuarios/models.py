from django.db import models
from django.contrib.auth.models import AbstractUser

class Bombero(AbstractUser):
    # Opciones de Rango
    RANGOS = [
        # GENERAL #
        ('SUPERINTENDENTE', 'SuperIntendente'),
        ('VICESUPERINTENDENTE', 'ViceSuperIntendente'),
        ('SECRETARIOGENERAL', 'Secretario General'),
        ('TESOREROGENERAL', 'Tesorero General'),
        ('COMANDANTE', 'Comandante'),
        ('SEGUNDOCOMANDANTE', 'Segundo Comandante'),
        ### COMPAÑIA ###

        # Administrativos #
        ('DIRECTOR','Director'),
        ('SECRETARIO','Secretario'),
        ('TESORERO','Tesorero'),
        # #
        ('CAPITAN','Capitan'),
        ('AYUDANTE','Ayudante'),
        ('TENIENTEPRIMERO','Teniente Primero'),
        ('TENIENTESEGUNDO','Teniente Segundo'),
        ('TENIENTETERCERO','Teniente Tercero'),
        ('VOLUNTARIO','Voluntario'),

    ]

    # Compañía
    COMPANIAS = [
        ('PRIMERA', 'Primera Compañía'),
        ('SEGUNDA', 'Segunda Compañía'),
        ('TERCERA', 'Tercera Compañía'),
    ]

    # --- GRUPO SANGUÍNEO ---
    SANGRE = [
        ('O+', 'O Positivo'), ('O-', 'O Negativo'),
        ('A+', 'A Positivo'), ('A-', 'A Negativo'),
        ('B+', 'B Positivo'), ('B-', 'B Negativo'),
        ('AB+', 'AB Positivo'), ('AB-', 'AB Negativo'),
    ]

    rut = models.CharField(max_length=12, unique=True, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    foto = models.ImageField(upload_to='perfiles/', null=True, blank=True, verbose_name="Foto de Perfil")
    
    rango = models.CharField(max_length=20, choices=RANGOS, default='VOLUNTARIO')
    compania = models.CharField(max_length=20, choices=COMPANIAS, default='PRIMERA')

    # --- HOJA DE VIDA ---
    # 1. Contacto
    telefono = models.CharField(max_length=15, null=True, blank=True, verbose_name="Teléfono Móvil")
    direccion = models.CharField(max_length=200, null=True, blank=True, verbose_name="Domicilio")
    
    # 2. Emergencia 
    contacto_emergencia_nombre = models.CharField(max_length=100, null=True, blank=True)
    contacto_emergencia_telefono = models.CharField(max_length=15, null=True, blank=True)

    # 3. Datos Médicos
    grupo_sanguineo = models.CharField(max_length=5, choices=SANGRE, null=True, blank=True)
    alergias = models.TextField(null=True, blank=True, help_text="Alergias a medicamentos o alimentos")
    enfermedades_cronicas = models.TextField(null=True, blank=True)

    # 4. Tallas
    talla_polera = models.CharField(max_length=5, null=True, blank=True) 
    talla_pantalon = models.CharField(max_length=5, null=True, blank=True) 
    talla_calzado = models.CharField(max_length=5, null=True, blank=True) 

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_rango_display()})"
    
class GuardiaNocturna(models.Model):
    fecha_inicio = models.DateField(unique=True, verbose_name="Mes de Guardia")
    compania_responsable = models.CharField(max_length=20, choices=Bombero.COMPANIAS)
    voluntarios = models.ManyToManyField(Bombero, related_name='guardias_asignadas')
    activa = models.BooleanField(default=True)
    def __str__(self):
        return f"Guardia {self.fecha_inicio.strftime('%m-%Y')} - {self.get_compania_responsable_display()}"