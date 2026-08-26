from rest_framework import serializers


class TextFormalizeSerializer(serializers.Serializer):
    gestos = serializers.ListField(
        child=serializers.CharField(max_length=50),
        min_length=1,
        max_length=15,
        error_messages={
            'min_length': 'Debe proporcionar al menos un gesto.',
            'max_length': 'No se pueden procesar más de 15 gestos.',
            'empty': 'La lista de gestos no puede estar vacía.',
        }
    )
    contexto = serializers.CharField(
        max_length=200,
        required=False,
        default='conversación general de chat',
        allow_blank=True,
    )

    def validate_gestos(self, value):
        if not all(isinstance(g, str) and g.strip() for g in value):
            raise serializers.ValidationError('Todos los gestos deben ser strings no vacíos.')
        return [g.strip() for g in value]
