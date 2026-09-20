from rest_framework import serializers
class TextFormalizeSerializer(serializers.Serializer):
    gestos = serializers.ListField(child=serializers.CharField(max_length=50), min_length=1, max_length=15)
    contexto = serializers.CharField(max_length=200, required=False, default='conversación general de chat', allow_blank=True)
