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
Create kyoo matcher name
*/}}
{{- define "kyoo.matcher.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.matcher.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the matcher service account to use
*/}}
{{- define "kyoo.matcher.serviceAccountName" -}}
{{- if .Values.matcher.serviceAccount.create -}}
    {{ default (include "kyoo.matcher.fullname" .) .Values.matcher.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.matcher.serviceAccount.name }}
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
