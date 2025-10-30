{{/*
Create kyoo ingress name
*/}}
{{- define "kyoo.ingress.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) "ingress" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create kyoo autosync name
*/}}
{{- define "kyoo.autosync.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.autosync.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the autosync service account to use
*/}}
{{- define "kyoo.autosync.serviceAccountName" -}}
{{- if .Values.autosync.serviceAccount.create -}}
    {{ default (include "kyoo.autosync.fullname" .) .Values.autosync.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.autosync.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo auth name
*/}}
{{- define "kyoo.auth.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.auth.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the auth service account to use
*/}}
{{- define "kyoo.auth.serviceAccountName" -}}
{{- if .Values.auth.serviceAccount.create -}}
    {{ default (include "kyoo.auth.fullname" .) .Values.auth.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.auth.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo back name
*/}}
{{- define "kyoo.back.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.back.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the back service account to use
*/}}
{{- define "kyoo.back.serviceAccountName" -}}
{{- if .Values.back.serviceAccount.create -}}
    {{ default (include "kyoo.back.fullname" .) .Values.back.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.back.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo back-metadata name
*/}}
{{- define "kyoo.backmetadata.fullname" -}}
{{- printf "%s-%s%s" (include "kyoo.fullname" .) .Values.back.name "metadata" | trunc 63 | trimSuffix "-" -}}
{{- end -}}


{{/*
Create kyoo front name
*/}}
{{- define "kyoo.front.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.front.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the front service account to use
*/}}
{{- define "kyoo.front.serviceAccountName" -}}
{{- if .Values.front.serviceAccount.create -}}
    {{ default (include "kyoo.front.fullname" .) .Values.front.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.front.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo scanner name
*/}}
{{- define "kyoo.scanner.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.scanner.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the scanner service account to use
*/}}
{{- define "kyoo.scanner.serviceAccountName" -}}
{{- if .Values.scanner.serviceAccount.create -}}
    {{ default (include "kyoo.scanner.fullname" .) .Values.scanner.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.scanner.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo transcoder name
*/}}
{{- define "kyoo.transcoder.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.transcoder.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the transcoder service account to use
*/}}
{{- define "kyoo.transcoder.serviceAccountName" -}}
{{- if .Values.transcoder.serviceAccount.create -}}
    {{ default (include "kyoo.transcoder.fullname" .) .Values.transcoder.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.transcoder.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo transcoder-metadata name
*/}}
{{- define "kyoo.transcodermetadata.fullname" -}}
{{- printf "%s-%s%s" (include "kyoo.fullname" .) .Values.transcoder.name "metadata" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create kyoo traefikproxy name
*/}}
{{- define "kyoo.traefikproxy.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.traefikproxy.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the traefikproxy service account to use
*/}}
{{- define "kyoo.traefikproxy.serviceAccountName" -}}
{{- if .Values.traefikproxy.serviceAccount.create -}}
    {{ default (include "kyoo.traefikproxy.fullname" .) .Values.traefikproxy.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.traefikproxy.serviceAccount.name }}
{{- end -}}
{{- end -}}