from django.conf import settings
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .assistant import AssistantError, AssistantUnavailable, ask, provider


class MessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField(max_length=2000, trim_whitespace=True)


class AskSerializer(serializers.Serializer):
    messages = MessageSerializer(many=True, allow_empty=False, max_length=40)

    def validate_messages(self, messages):
        if messages[-1]['role'] != 'user':
            raise serializers.ValidationError('Охирин паём бояд аз корбар бошад.')
        return messages


class AssistantView(APIView):
    """GET: is the assistant on? POST {messages}: the assistant's reply."""

    permission_classes = [permissions.AllowAny]
    throttle_scope = 'assistant'

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.request.method == 'POST' else []

    def get(self, request):
        return Response({'enabled': provider() is not None})

    def post(self, request):
        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            reply = ask(serializer.validated_data['messages'])
        except AssistantUnavailable:
            return Response({'detail': 'Ёрдамчии AI ҳоло фаъол нест.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except AssistantError as error:
            body = {'detail': 'Ёрдамчӣ ҳоло ҷавоб дода наметавонад. Баъдтар кӯшиш кунед.'}
            if settings.DEBUG:
                body['detail_debug'] = str(error)
            return Response(body, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({'reply': reply})
